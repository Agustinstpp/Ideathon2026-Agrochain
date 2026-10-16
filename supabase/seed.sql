-- ====================================================================
-- AGROCHAIN FEEDTRACE - SUPABASE POSTGRESQL SEED DATA
-- Datos de demostracion para el Ideathon / Presentacion
-- ====================================================================

-- 1. Organizacion Principal de Demostracion
INSERT INTO public.organizations (id, name, type)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Agropecuaria Las Lilas S.A.', 'feedlot'),
  ('b1234567-89ab-cdef-0123-456789abcdef', 'Cooperativa Agricola Chaco Central', 'producer')
ON CONFLICT (id) DO NOTHING;

-- 2. Establecimientos
INSERT INTO public.establishments (id, organization_id, name, province, locality, geojson)
VALUES 
  (
    '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Establecimiento La Posta - Campo Norte',
    'Chaco',
    'Charata',
    '{"type": "Feature", "geometry": {"type": "Point", "coordinates": [-61.1889, -27.2144]}, "properties": {"renspa": "06.012.0.12345/00"}}'::jsonb
  ),
  (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Feedlot Don Pedro - Modulo Intensivo',
    'Santa Fe',
    'Rafaela',
    '{"type": "Feature", "geometry": {"type": "Point", "coordinates": [-61.4867, -31.2503]}, "properties": {"renspa": "21.034.0.98765/01"}}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Lote Agricola Inicial (10.000 kg registrados, 8.000 kg remanentes tras asignacion de 2.000 kg)
INSERT INTO public.grain_lots (
  id,
  organization_id,
  establishment_id,
  external_code,
  crop,
  initial_quantity_kg,
  remaining_quantity_kg,
  origin_hash,
  blockchain_id,
  blockchain_tx_hash,
  status
)
VALUES (
  'e9b1192e-5036-4078-a0e2-63b71eb26d30',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  'MAIZ-2026-CH01',
  'Maíz Picado Silo Planta Entera',
  10000,
  8000,
  '0x3a7e58f034b1d6e8a9c2f5e4b7a8d9c0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
  1001,
  '0x9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
  'confirmed'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Lote Ganadero Inicial (120 cabezas en terminacion)
INSERT INTO public.cattle_lots (
  id,
  organization_id,
  establishment_id,
  external_code,
  animal_count,
  establishment_hash,
  blockchain_id,
  blockchain_tx_hash,
  status
)
VALUES (
  '2d8f99e1-6712-4f32-8499-c89283920194',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'FEEDLOT-CORRAL-03',
  120,
  '0x8f2c3d4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
  2001,
  '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
  'confirmed'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Asignacion Verificada Inicial (2.000 kg asignados de grano a ganado)
INSERT INTO public.feed_assignments (
  id,
  grain_lot_id,
  cattle_lot_id,
  quantity_kg,
  period_start,
  period_end,
  blockchain_assignment_id,
  blockchain_tx_hash,
  status,
  operation_id
)
VALUES (
  '5fa23d11-19bb-4328-92ee-912837492810',
  'e9b1192e-5036-4078-a0e2-63b71eb26d30',
  '2d8f99e1-6712-4f32-8499-c89283920194',
  2000,
  '2026-10-01',
  '2026-10-31',
  3001,
  '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
  'confirmed',
  'op-seed-initial-assignment-001'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Mapeo de Identificadores EVM
INSERT INTO public.blockchain_entity_mappings (entity_type, supabase_id, blockchain_id)
VALUES 
  ('grain_lot', 'e9b1192e-5036-4078-a0e2-63b71eb26d30', 1001),
  ('cattle_lot', '2d8f99e1-6712-4f32-8499-c89283920194', 2001),
  ('feed_assignment', '5fa23d11-19bb-4328-92ee-912837492810', 3001)
ON CONFLICT (supabase_id) DO NOTHING;

-- 7. Documento de Evidencia Simulado
INSERT INTO public.evidence_documents (
  id,
  organization_id,
  establishment_id,
  grain_lot_id,
  cattle_lot_id,
  storage_path,
  sha256_hash,
  document_type,
  is_simulated
)
VALUES (
  '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  'e9b1192e-5036-4078-a0e2-63b71eb26d30',
  NULL,
  'evidence-documents/f47ac10b/carta_de_porte_MAIZ-2026-CH01.pdf',
  '3a7e58f034b1d6e8a9c2f5e4b7a8d9c0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
  'carta_de_porte_grano',
  true
)
ON CONFLICT (id) DO NOTHING;
