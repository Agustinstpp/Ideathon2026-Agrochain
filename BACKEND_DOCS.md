# AgroChain FeedTrace — Documentación Técnica del Backend (Persona 3)

Documento maestro de arquitectura, esquemas PostgreSQL, endpoints API, tipos TypeScript, seguridad y reconciliación blockchain generado por el **Desarrollador Backend Senior (Persona 3)** para el equipo (Persona 1, Persona 2 y Persona 4).

---

## 1. Arquitectura del Núcleo y Fuente de Verdad

AgroChain FeedTrace implementa un modelo de **verdad dual coordinada**:
1. **Blockchain EVM (Smart Contract `AgroChainTrace.sol`):** Es la **fuente de verdad matemática e inmutable** para:
   - Registro de granos con huella `originHash` (`bytes32`).
   - Registro de tropas ganaderas con huella `establishmentHash` (`bytes32`).
   - Asignación atómica de alimento con descuento irrecusable de inventario (`assignFeed`).
2. **Supabase PostgreSQL:** Base relacional de alta velocidad para indexación, georreferenciación (`geojson`), documentos de evidencia y consultas multi-tenant con Row Level Security (RLS).
3. **Mecanismo de Reconciliación (`POST /api/grain-lots/[id]/reconcile`):**
   Si ocurre cualquier inconsistencia temporal o corte de red durante una transacción, el backend consulta directamente la función `getRemainingQuantity(uint256)` del smart contract y sincroniza la copia de PostgreSQL de forma irrefutable.

---

## 2. Esquema Relacional de Base de Datos y RLS

Archivo de migración: `supabase/migrations/20261016_initial_schema.sql`  
Datos de prueba: `supabase/seed.sql`

### 2.1 Tablas Implementadas

| Tabla | Claves & Restricciones | Propósito |
|---|---|---|
| `organizations` | `id UUID PK`, `name`, `type` (`producer`, `feedlot`, `supplier`, `frigorifico`) | Aislamiento multi-tenant |
| `profiles` | `id UUID PK` -> `auth.users`, `organization_id FK` | Vínculo usuario Supabase Auth y Organización |
| `establishments` | `id UUID PK`, `organization_id FK`, `geojson JSONB` | Campos agrícolas y corrales de feedlot |
| `grain_lots` | `id UUID PK`, `remaining_quantity_kg <= initial_quantity_kg`, `status` (`pending`, `processing`, `confirmed`, `failed`, `reconciliation_required`), `blockchain_id UNIQUE` | Inventario agrícola de alimento |
| `cattle_lots` | `id UUID PK`, `animal_count > 0`, `status` (`pending`, `processing`, `confirmed`, `failed`, `reconciliation_required`), `blockchain_id UNIQUE` | Rodeos ganaderos |
| `feed_assignments` | `id UUID PK`, `operation_id TEXT UNIQUE` (idempotencia), `period_start <= period_end`, `status` (`pending`, `processing`, `confirmed`, `failed`, `reconciliation_required`) | Asignación atómica grano -> ganado |
| `evidence_documents` | `id UUID PK`, `storage_path`, `sha256_hash` (64 hex chars), `is_simulated BOOLEAN` | Documentos y certificados de calidad |
| `blockchain_entity_mappings`| `supabase_id UUID UNIQUE`, `blockchain_id BIGINT UNIQUE` | Correlación biunívoca UUID <-> uint256 EVM |

### 2.2 Políticas de Seguridad y Triggers del Servidor
- **RLS Activo:** Usuarios cliente solo leen registros pertenecientes a su `organization_id` (`public.current_user_organization_id()`).
- **Consulta Pública Selectiva:** Lotes con `status = 'confirmed'` tienen acceso público `TO anon` para permitir la consulta QR del pasaporte.
- **Triggers Anti-Alteración:** `trg_protect_grain_lots` y `trg_protect_feed_assignments` arrojan excepción si un cliente intenta alterar `remaining_quantity_kg`, `blockchain_tx_hash` o marcar `status = 'confirmed'` sin pasar por el rol administrativo del servidor (`service_role`).

---

## 3. Catálogo Completo de Endpoints API

Todos los endpoints soportan tanto tokens reales de Supabase (`Authorization: Bearer <token>`) como headers de organización (`x-organization-id`). En entorno de desarrollo o demostración, proveen fallback automático al usuario y organización demo (`f47ac10b-58cc-4372-a567-0e02b2c3d479`).

### 3.1 Métricas del Dashboard (Para Persona 2)
- **Ruta:** `GET /api/dashboard`
- **Query Params opcionales:** `?organization_id=<uuid>`
- **Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_grain_lots": 3,
    "total_grain_initial_kg": 25000,
    "total_grain_remaining_kg": 21000,
    "total_cattle_lots": 4,
    "total_animals": 450,
    "total_assignments": 3,
    "total_assigned_kg": 4000,
    "recent_assignments": [ ... ],
    "recent_grain_lots": [ ... ],
    "recent_cattle_lots": [ ... ],
    "blockchain_status": {
      "connected": true,
      "simulation_mode": false,
      "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "chain_id": 80002,
      "operator_address": "0x..."
    }
  }
}
```

---

### 3.2 Lotes Agrícolas
- **Listar Lotes:** `GET /api/grain-lots?organization_id=<uuid>`
- **Registrar Lote:** `POST /api/grain-lots`
  - **Body:**
```json
{
  "organization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "establishment_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "external_code": "MAIZ-2026-CH01",
  "crop": "Maíz Picado Silo Planta Entera",
  "initial_quantity_kg": 10000,
  "origin_hash": "0x3a7e58f034b1d6e8a9c2f5e4b7a8d9c0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6"
}
```
  - **Respuesta (201 Created):** Retorna el objeto con `remaining_quantity_kg: 10000`, `blockchain_id: 1001`, `blockchain_tx_hash: "0x..."`, `status: "confirmed"`.

- **Reconciliar con Blockchain:** `POST /api/grain-lots/[id]/reconcile`
  - Consulta en vivo al smart contract `getRemainingQuantity(id)` y sincroniza la base de datos si hubiera divergencia.

---

### 3.3 Lotes Ganaderos
- **Listar Lotes:** `GET /api/cattle-lots?organization_id=<uuid>`
- **Registrar Lote:** `POST /api/cattle-lots`
  - **Body:**
```json
{
  "organization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "establishment_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "external_code": "FEEDLOT-CORRAL-03",
  "animal_count": 120,
  "establishment_hash": "0x8f2c3d4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d"
}
```

---

### 3.4 Asignación de Alimento (Core Crítico Anti Double-Spending)
- **Ruta:** `POST /api/feed-assignments`
- **Soporte Flexible:** Acepta tanto `camelCase` como `snake_case`.
- **Cuerpo de Solicitud:**
```json
{
  "grain_lot_id": "e9b1192e-5036-4078-a0e2-63b71eb26d30",
  "cattle_lot_id": "2d8f99e1-6712-4f32-8499-c89283920194",
  "quantity_kg": 2000,
  "period_start": "2026-10-01",
  "period_end": "2026-10-31",
  "operation_id": "op-feedlot-allocation-001"
}
```
- **Flujo Interno de Ejecución:**
  1. Autenticación y chequeo de organización.
  2. Validación de saldo disponible en lote agrícola (`remaining_quantity_kg >= quantity_kg`).
  3. Chequeo de idempotencia por `operation_id`. Si ya fue confirmada, retorna el resultado previo con status `200 OK` sin duplicar el descuento.
  4. Adquisición de lock de concurrencia para evitar doble clic o condiciones de carrera.
  5. Registro preliminar en estado `pending` en base de datos.
  6. Envío de transacción on-chain a `assignFeed` en el Smart Contract.
  7. Confirmación del recibo de bloque (`txHash`).
  8. Actualización atómica en base de datos a `status: "confirmed"` y descuento del remanente.
  9. En caso de fallo de red después del envío, pasa a `reconciliation_required` para comprobación posterior sin descontar erróneamente.
- **Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "5fa23d11-19bb-4328-92ee-912837492810",
    "grain_lot_id": "e9b1192e-5036-4078-a0e2-63b71eb26d30",
    "cattle_lot_id": "2d8f99e1-6712-4f32-8499-c89283920194",
    "quantity_kg": 2000,
    "period_start": "2026-10-01",
    "period_end": "2026-10-31",
    "blockchain_assignment_id": 3001,
    "blockchain_tx_hash": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    "status": "confirmed",
    "operation_id": "op-feedlot-allocation-001"
  },
  "remaining_quantity_kg": 8000,
  "is_duplicate": false,
  "message": "Feed assignment verified and confirmed on blockchain"
}
```
- **Rechazo por Saldo Insuficiente (400 Bad Request):**
```json
{
  "success": false,
  "error": "Insufficient grain inventory: Requested 9000 kg but only 8000 kg available"
}
```

---

### 3.5 Historial de Alimentación por Lote Ganadero
- **Ruta:** `GET /api/cattle-lots/[id]/feed-history`
- **Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "cattle_lot": {
      "id": "2d8f99e1-6712-4f32-8499-c89283920194",
      "external_code": "FEEDLOT-CORRAL-03",
      "animal_count": 120
    },
    "feed_history": [
      {
        "id": "5fa23d11-19bb-4328-92ee-912837492810",
        "quantity_kg": 2000,
        "period_start": "2026-10-01",
        "period_end": "2026-10-31",
        "blockchain_tx_hash": "0x1a2b...",
        "grain_lot": {
          "external_code": "MAIZ-2026-CH01",
          "crop": "Maíz Picado Silo Planta Entera",
          "origin_hash": "0x3a7e..."
        }
      }
    ],
    "total_consumed_kg": 2000
  }
}
```

---

### 3.6 Pasaporte Digital Público (Para Persona 4 & Código QR)
- **Ruta:** `GET /api/passport/[id]` (donde `id` es el UUID del lote ganadero)
- **Nivel de Acceso:** Público / No requiere cabeceras de autorización.
- **Información Devuelta:**
  - Rodeo, cantidad de animales y hash de establecimiento.
  - Ubicación pública (provincia, localidad) omitiendo coordenadas privadas.
  - Detalle verificado de todas las raciones agrícolas consumidas.
  - Dirección del Smart Contract, Chain ID (80002 Polygon Amoy) y bandera de integridad matemática.
  - Documentos de evidencia con hash SHA-256 (cartas de porte, análisis bromatológicos).

---

### 3.7 Establecimientos y Documentos de Evidencia
- **Establecimientos:**
  - `GET /api/establishments`
  - `POST /api/establishments` (`{ name, province, locality, geojson }`)
- **Documentos de Evidencia:**
  - `GET /api/documents?lot_id=<uuid>`
  - `POST /api/documents` (Acepta `multipart/form-data` con archivo real o `application/json` con `{ storage_path, sha256_hash, document_type }`). Calcula el hash SHA-256 de los bytes exactos.

---

## 4. Matriz de Pruebas Automatizadas Ejecutadas

Ejecutables con:
```bash
npm run test:contracts   # 21 tests de Hardhat sobre el Smart Contract
npm run test:integration # 40 pruebas unitarias y de integración end-to-end
npm run build            # Verificación de compilación Next.js 14 sin advertencias
```

| # | Criterio de Aceptación Validado | Resultado |
|---|---|---|
| 1 | Hash SHA-256 determinista canónico y formato bytes32 EVM | ✅ APROBADO |
| 2 | Guardado y listado de Establecimientos con coordenadas geoespaciales | ✅ APROBADO |
| 3 | Registro de lote agrícola con saldo inicial 10.000 kg y status confirmed | ✅ APROBADO |
| 4 | Registro de lote ganadero con 120 cabezas | ✅ APROBADO |
| 5 | Asignación real de 2.000 kg con saldo remanente resultante de EXACTAMENTE 8.000 kg | ✅ APROBADO |
| 6 | Idempotencia: Solicitud duplicada con mismo operation_id no duplica descuento | ✅ APROBADO |
| 7 | Rechazo estricto anti double-spending ante intento de 9.000 kg sobre saldo de 8.000 kg | ✅ APROBADO |
| 8 | Inmutabilidad de inventario: Saldo permanece intacto en 8.000 kg tras rechazo | ✅ APROBADO |
| 9 | Reconciliación directa con blockchain como única fuente de verdad | ✅ APROBADO |
| 10 | Seguridad multi-tenant: Bloqueo de usuarios u operaciones entre organizaciones cruzadas | ✅ APROBADO |
| 11 | Historial cronológico de alimentación para ganado con detalles del grano | ✅ APROBADO |
| 12 | Generación y lectura de Pasaporte Digital público para código QR | ✅ APROBADO |
| 13 | Registro de evidencias con hash SHA-256 e identificación de archivos simulados | ✅ APROBADO |
| 14 | Métricas del dashboard consolidadas para la interfaz | ✅ APROBADO |
| 15 | Compilación y empaquetado de producción Next.js 14 sin errores de TypeScript | ✅ APROBADO |
