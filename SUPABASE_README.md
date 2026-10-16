# AgroChain FeedTrace — Arquitectura de Persistencia Supabase PostgreSQL

Documentación técnica generada por **Persona 1 (Blockchain, Supabase y Backend de Integración)**.

---

## 1. Esquema Relacional de Base de Datos

El modelo implementa persistencia transaccional y reglas de negocio para agroindustria y trazabilidad en:
`supabase/migrations/20261016_initial_schema.sql`

```
 [organizations] <──1:N── [profiles] (vinculado a auth.users)
        │
        ├──1:N── [establishments] (establecimientos / campos)
        │               │
        │               ├──1:N── [grain_lots] (lotes agrícolas)
        │               │             │
        │               │             ├──1:N── [feed_assignments] (asignaciones)
        │               │             │               │
        │               └──1:N── [cattle_lots] (lotes ganaderos)
        │
        └──1:N── [evidence_documents] (documentos y hashes SHA-256)
```

---

## 2. Tablas y Restricciones Principales

### 2.1 `organizations`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `name TEXT NOT NULL`
- `type TEXT NOT NULL CHECK (type IN ('producer', 'feedlot', 'supplier', 'frigorifico'))`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### 2.2 `profiles`
- `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
- `organization_id UUID NOT NULL REFERENCES organizations(id)`
- `full_name TEXT NOT NULL`

### 2.3 `establishments`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES organizations(id)`
- `name TEXT NOT NULL`, `province TEXT NOT NULL`, `locality TEXT NOT NULL`
- `geojson JSONB DEFAULT '{}'::jsonb`

### 2.4 `grain_lots`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `external_code TEXT NOT NULL`
- `crop TEXT NOT NULL`
- `initial_quantity_kg BIGINT NOT NULL CHECK (initial_quantity_kg > 0)`
- `remaining_quantity_kg BIGINT NOT NULL`
- `origin_hash TEXT NOT NULL`
- `blockchain_id BIGINT UNIQUE`
- `blockchain_tx_hash TEXT`
- `status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'confirmed', 'failed'))`
- **Constraint de Coherencia de Saldo:**
  `CHECK (remaining_quantity_kg >= 0 AND remaining_quantity_kg <= initial_quantity_kg)`
- **Constraint de Unicidad:**
  `UNIQUE (organization_id, external_code)`

### 2.5 `cattle_lots`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `external_code TEXT NOT NULL`
- `animal_count INTEGER NOT NULL CHECK (animal_count > 0)`
- `establishment_hash TEXT NOT NULL`
- `blockchain_id BIGINT UNIQUE`
- `status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'confirmed', 'failed'))`
- **Constraint de Unicidad:**
  `UNIQUE (organization_id, external_code)`

### 2.6 `feed_assignments`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `grain_lot_id UUID REFERENCES grain_lots(id)`
- `cattle_lot_id UUID REFERENCES cattle_lots(id)`
- `quantity_kg BIGINT NOT NULL CHECK (quantity_kg > 0)`
- `period_start DATE NOT NULL`, `period_end DATE NOT NULL`
- `blockchain_assignment_id BIGINT UNIQUE`
- `blockchain_tx_hash TEXT`
- `status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'confirmed', 'failed'))`
- **Constraint Temporal:**
  `CHECK (period_start <= period_end)`

### 2.7 `blockchain_entity_mappings`
Resuelve la correlación entre identificadores UUID de PostgreSQL y enteros `uint256` requeridos por la EVM sin colisiones:
- `supabase_id UUID NOT NULL UNIQUE`
- `blockchain_id BIGINT NOT NULL UNIQUE` (alimentado por la secuencia `blockchain_id_seq`)

---

## 3. Seguridad Estricta: Row Level Security (RLS) y Triggers

1. **Aislamiento Multi-inquilino (Multi-tenant):**
   Mediante la función `public.current_user_organization_id()`, cada usuario autenticado solo puede consultar los lotes de su propia organización.
2. **Consulta Pública de Trazabilidad:**
   Se habilitan políticas selectivas `TO anon, authenticated` para registros que tengan `status = 'confirmed'`, permitiendo que compradores o consumidores consulten la ficha pública mediante QR.
3. **Protección Anti-Alteración por Trigger de Servidor:**
   Los triggers `trg_protect_grain_lots` y `trg_protect_feed_assignments` verifican que `auth.role() = 'service_role'`. Si un usuario intenta modificar directamente desde el cliente `remaining_quantity_kg`, el estado a `confirmed` o inventar un `blockchain_tx_hash`, PostgreSQL arroja inmediatamente una excepción de violación de seguridad.

---

## 4. Instrucciones para Aplicar la Migración

### Opción A: Supabase Dashboard
1. Ingresar a la consola web de Supabase.
2. Ir a **SQL Editor**.
3. Copiar y pegar el contenido de [20261016_initial_schema.sql](file:///e:/Github/Ideathon2026-Agrochain/supabase/migrations/20261016_initial_schema.sql).
4. Hacer clic en **Run**.

### Opción B: Supabase CLI
```bash
supabase db push
# O ejecutar localmente con:
supabase migration up
```
