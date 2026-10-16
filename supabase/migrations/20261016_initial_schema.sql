-- ====================================================================
-- AGROCHAIN FEEDTRACE - SUPABASE POSTGRESQL INITIAL SCHEMA & RLS
-- Persona 1: Blockchain, Supabase y Backend de Integracion
-- ====================================================================

-- Habilitar extension pgcrypto si no estuviera habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. TABLAS PRINCIPALES
-- ====================================================================

-- 1.1 Organizaciones
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('producer', 'feedlot', 'supplier', 'frigorifico')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 Perfiles de Usuario (vinculados a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.3 Establecimientos Agropecuarios
CREATE TABLE IF NOT EXISTS public.establishments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    province TEXT NOT NULL,
    locality TEXT NOT NULL,
    geojson JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.4 Lotes de Grano (Agricolas)
CREATE TABLE IF NOT EXISTS public.grain_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE RESTRICT,
    external_code TEXT NOT NULL,
    crop TEXT NOT NULL,
    initial_quantity_kg BIGINT NOT NULL CHECK (initial_quantity_kg > 0),
    remaining_quantity_kg BIGINT NOT NULL,
    origin_hash TEXT NOT NULL,
    blockchain_id BIGINT UNIQUE,
    blockchain_tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'confirmed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT grain_lots_quantities_check CHECK (remaining_quantity_kg >= 0 AND remaining_quantity_kg <= initial_quantity_kg),
    CONSTRAINT grain_lots_org_external_code_unique UNIQUE (organization_id, external_code)
);

-- 1.5 Lotes Ganaderos
CREATE TABLE IF NOT EXISTS public.cattle_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE RESTRICT,
    external_code TEXT NOT NULL,
    animal_count INTEGER NOT NULL CHECK (animal_count > 0),
    establishment_hash TEXT NOT NULL,
    blockchain_id BIGINT UNIQUE,
    blockchain_tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'confirmed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT cattle_lots_org_external_code_unique UNIQUE (organization_id, external_code)
);

-- 1.6 Asignaciones de Alimento
CREATE TABLE IF NOT EXISTS public.feed_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grain_lot_id UUID NOT NULL REFERENCES public.grain_lots(id) ON DELETE RESTRICT,
    cattle_lot_id UUID NOT NULL REFERENCES public.cattle_lots(id) ON DELETE RESTRICT,
    quantity_kg BIGINT NOT NULL CHECK (quantity_kg > 0),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    blockchain_assignment_id BIGINT UNIQUE,
    blockchain_tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'confirmed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT feed_assignments_period_check CHECK (period_start <= period_end)
);

-- 1.7 Documentos de Evidencia
CREATE TABLE IF NOT EXISTS public.evidence_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    establishment_id UUID REFERENCES public.establishments(id) ON DELETE SET NULL,
    grain_lot_id UUID REFERENCES public.grain_lots(id) ON DELETE SET NULL,
    cattle_lot_id UUID REFERENCES public.cattle_lots(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    document_type TEXT NOT NULL,
    is_simulated BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.8 Mapeo de Identificadores UUID <-> On-Chain uint256
CREATE SEQUENCE IF NOT EXISTS blockchain_id_seq START WITH 1000 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.blockchain_entity_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('grain_lot', 'cattle_lot', 'feed_assignment')),
    supabase_id UUID NOT NULL UNIQUE,
    blockchain_id BIGINT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- 2. INDICES PARA PERFORMANCE Y CONSULTAS
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_establishments_org ON public.establishments(organization_id);
CREATE INDEX IF NOT EXISTS idx_grain_lots_org ON public.grain_lots(organization_id);
CREATE INDEX IF NOT EXISTS idx_grain_lots_establishment ON public.grain_lots(establishment_id);
CREATE INDEX IF NOT EXISTS idx_grain_lots_blockchain_id ON public.grain_lots(blockchain_id);
CREATE INDEX IF NOT EXISTS idx_cattle_lots_org ON public.cattle_lots(organization_id);
CREATE INDEX IF NOT EXISTS idx_cattle_lots_establishment ON public.cattle_lots(establishment_id);
CREATE INDEX IF NOT EXISTS idx_cattle_lots_blockchain_id ON public.cattle_lots(blockchain_id);
CREATE INDEX IF NOT EXISTS idx_feed_assignments_grain ON public.feed_assignments(grain_lot_id);
CREATE INDEX IF NOT EXISTS idx_feed_assignments_cattle ON public.feed_assignments(cattle_lot_id);
CREATE INDEX IF NOT EXISTS idx_feed_assignments_status ON public.feed_assignments(status);
CREATE INDEX IF NOT EXISTS idx_evidence_org ON public.evidence_documents(organization_id);

-- ====================================================================
-- 3. FUNCIONES AUXILIARES DE AUTORIZACION
-- ====================================================================

-- Obtener la organizacion del usuario actual autenticado
CREATE OR REPLACE FUNCTION public.current_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Funcion para asignar el siguiente ID numerico blockchain de manera consistente
CREATE OR REPLACE FUNCTION public.get_or_create_blockchain_id(
    p_entity_type TEXT,
    p_supabase_id UUID
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_blockchain_id BIGINT;
BEGIN
    SELECT blockchain_id INTO v_blockchain_id
    FROM public.blockchain_entity_mappings
    WHERE supabase_id = p_supabase_id;

    IF v_blockchain_id IS NULL THEN
        v_blockchain_id := nextval('public.blockchain_id_seq');
        INSERT INTO public.blockchain_entity_mappings (entity_type, supabase_id, blockchain_id)
        VALUES (p_entity_type, p_supabase_id, v_blockchain_id);
    END IF;

    RETURN v_blockchain_id;
END;
$$;

-- ====================================================================
-- 4. TRIGGERS DE SEGURIDAD (ANTI-ALTERACION POR CLIENTES)
-- ====================================================================

-- Impedir que usuarios del cliente modifiquen saldos, tx hashes y estados
CREATE OR REPLACE FUNCTION public.enforce_server_authority_grain_lots()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Si no es rol service_role (es decir, viene directamente de un token de usuario client-side)
    IF auth.role() <> 'service_role' THEN
        IF NEW.remaining_quantity_kg <> OLD.remaining_quantity_kg THEN
            RAISE EXCEPTION 'Security violation: remaining_quantity_kg can only be updated by the verified server authority.';
        END IF;
        IF NEW.status <> OLD.status AND NEW.status = 'confirmed' THEN
            RAISE EXCEPTION 'Security violation: status cannot be marked as confirmed directly by client.';
        END IF;
        IF NEW.blockchain_tx_hash IS DISTINCT FROM OLD.blockchain_tx_hash THEN
            RAISE EXCEPTION 'Security violation: blockchain_tx_hash cannot be altered directly by client.';
        END IF;
        IF NEW.blockchain_id IS DISTINCT FROM OLD.blockchain_id THEN
            RAISE EXCEPTION 'Security violation: blockchain_id cannot be altered directly by client.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_grain_lots ON public.grain_lots;
CREATE TRIGGER trg_protect_grain_lots
    BEFORE UPDATE ON public.grain_lots
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_server_authority_grain_lots();

-- Impedir que usuarios del cliente alteren transacciones de feed_assignments
CREATE OR REPLACE FUNCTION public.enforce_server_authority_feed_assignments()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF auth.role() <> 'service_role' THEN
        IF NEW.status <> OLD.status AND NEW.status = 'confirmed' THEN
            RAISE EXCEPTION 'Security violation: feed assignments can only be confirmed by verified server authority.';
        END IF;
        IF NEW.blockchain_tx_hash IS DISTINCT FROM OLD.blockchain_tx_hash THEN
            RAISE EXCEPTION 'Security violation: blockchain_tx_hash cannot be modified directly by client.';
        END IF;
        IF NEW.blockchain_assignment_id IS DISTINCT FROM OLD.blockchain_assignment_id THEN
            RAISE EXCEPTION 'Security violation: blockchain_assignment_id cannot be modified directly by client.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_feed_assignments ON public.feed_assignments;
CREATE TRIGGER trg_protect_feed_assignments
    BEFORE UPDATE ON public.feed_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_server_authority_feed_assignments();

-- ====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grain_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cattle_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_entity_mappings ENABLE ROW LEVEL SECURITY;

-- 5.1 ORGANIZATIONS
CREATE POLICY "Users can read own organization"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (id = public.current_user_organization_id());

CREATE POLICY "Service role full access to organizations"
    ON public.organizations FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5.2 PROFILES
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can read profiles of own organization"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Service role full access to profiles"
    ON public.profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5.3 ESTABLISHMENTS
CREATE POLICY "Users can read own organization establishments"
    ON public.establishments FOR SELECT
    TO authenticated
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can create establishments for own organization"
    ON public.establishments FOR INSERT
    TO authenticated
    WITH CHECK (organization_id = public.current_user_organization_id());

CREATE POLICY "Service role full access to establishments"
    ON public.establishments FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5.4 GRAIN LOTS
CREATE POLICY "Users can read own organization grain lots"
    ON public.grain_lots FOR SELECT
    TO authenticated
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Public read for confirmed grain lots traceability"
    ON public.grain_lots FOR SELECT
    TO anon, authenticated
    USING (status = 'confirmed');

CREATE POLICY "Users can insert grain lots for own organization"
    ON public.grain_lots FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id = public.current_user_organization_id()
        AND remaining_quantity_kg = initial_quantity_kg
        AND status = 'pending'
    );

CREATE POLICY "Service role full access to grain lots"
    ON public.grain_lots FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5.5 CATTLE LOTS
CREATE POLICY "Users can read own organization cattle lots"
    ON public.cattle_lots FOR SELECT
    TO authenticated
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Public read for confirmed cattle lots traceability"
    ON public.cattle_lots FOR SELECT
    TO anon, authenticated
    USING (status = 'confirmed');

CREATE POLICY "Users can insert cattle lots for own organization"
    ON public.cattle_lots FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id = public.current_user_organization_id()
        AND status = 'pending'
    );

CREATE POLICY "Service role full access to cattle lots"
    ON public.cattle_lots FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5.6 FEED ASSIGNMENTS
CREATE POLICY "Users can read feed assignments linked to own organization lots"
    ON public.feed_assignments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.grain_lots g
            WHERE g.id = feed_assignments.grain_lot_id
              AND g.organization_id = public.current_user_organization_id()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.cattle_lots c
            WHERE c.id = feed_assignments.cattle_lot_id
              AND c.organization_id = public.current_user_organization_id()
        )
    );

CREATE POLICY "Public read for confirmed feed assignments"
    ON public.feed_assignments FOR SELECT
    TO anon, authenticated
    USING (status = 'confirmed');

-- Las inserciones y actualizaciones de asignaciones deben pasar por la API segura del servidor
CREATE POLICY "Service role full access to feed assignments"
    ON public.feed_assignments FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5.7 EVIDENCE DOCUMENTS
CREATE POLICY "Users can read own organization documents"
    ON public.evidence_documents FOR SELECT
    TO authenticated
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Public read for evidence linked to confirmed lots"
    ON public.evidence_documents FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.grain_lots g
            WHERE g.id = evidence_documents.grain_lot_id
              AND g.status = 'confirmed'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.cattle_lots c
            WHERE c.id = evidence_documents.cattle_lot_id
              AND c.status = 'confirmed'
        )
    );

CREATE POLICY "Service role full access to evidence documents"
    ON public.evidence_documents FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5.8 BLOCKCHAIN MAPPINGS
CREATE POLICY "Service role full access to blockchain mappings"
    ON public.blockchain_entity_mappings FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can read blockchain mappings"
    ON public.blockchain_entity_mappings FOR SELECT
    TO authenticated
    USING (true);
