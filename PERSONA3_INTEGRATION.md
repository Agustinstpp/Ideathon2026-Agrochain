# AgroChain FeedTrace — Guía de Integración para Persona 2, Persona 4 y Jurado

Documentación completa de contratos de API, formatos JSON, tipos TypeScript y ejemplos prácticos generada por el **Desarrollador Backend Senior (Persona 3)**.

> [!IMPORTANT]
> Ver documentación técnica exhaustiva en [BACKEND_DOCS.md](file:///c:/Users/agust/Proyectos/Personal/Ideathon2026-Agrochain/BACKEND_DOCS.md).

---

## 1. Importación de Tipos TypeScript

Todos los tipos de dominio están exportados en:
```typescript
import {
  Organization,
  Profile,
  Establishment,
  GrainLot,
  CattleLot,
  FeedAssignment,
  EvidenceDocument,
  TraceabilityDossier,
  DashboardMetrics,
  FeedHistoryResponse,
  PassportPublicData,
  EntityStatus,
} from "@/lib/types";
```

---

## 2. Directorio de Endpoints API

### 2.1 Dashboard General (Para Persona 2)
- **Ruta:** `GET /api/dashboard`
- **Headers:** `Authorization: Bearer <token>` o `x-organization-id: <uuid>` (opcional en demo)
- **Retorna:** Totales de granos (inicial vs remanente), cabezas de ganado, asignaciones, actividad reciente y estado de conexión a la blockchain.

### 2.2 Establecimientos
- **Listar:** `GET /api/establishments`
- **Crear:** `POST /api/establishments`
  - Body: `{ organization_id, name, province, locality, geojson? }`

### 2.3 Lotes Agrícolas
- **Listar:** `GET /api/grain-lots`
- **Registrar:** `POST /api/grain-lots`
  - Body: `{ organization_id, establishment_id, external_code, crop, initial_quantity_kg, origin_hash }`
- **Detalle:** `GET /api/grain-lots/[id]`
- **Reconciliar con Blockchain (Fuente de Verdad):** `POST /api/grain-lots/[id]/reconcile`
  - Consulta on-chain y sincroniza en Supabase si hubiera discrepancia.

### 2.4 Lotes Ganaderos
- **Listar:** `GET /api/cattle-lots`
- **Registrar:** `POST /api/cattle-lots`
  - Body: `{ organization_id, establishment_id, external_code, animal_count, establishment_hash }`
- **Detalle:** `GET /api/cattle-lots/[id]`
- **Historial de Alimentación:** `GET /api/cattle-lots/[id]/feed-history`
  - Retorna cronología de raciones, cultivo de origen y hashes blockchain.

### 2.5 Asignación de Alimento (Operación Crítica Anti Double-Spending)
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
  "operation_id": "op-feedlot-001"
}
```
- **Respuesta (201 Created):**
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
    "blockchain_tx_hash": "0x...",
    "status": "confirmed",
    "operation_id": "op-feedlot-001"
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

### 2.6 Pasaporte Digital Público (Para Persona 4 & Código QR)
- **Ruta:** `GET /api/passport/[id]` (donde `id` es el UUID del lote de ganado)
- **Acceso:** Público / No requiere autenticación.
- **Retorna:** Información autorizada para el consumidor final: datos del rodeo, raciones de grano consumidas con hash de origen, hashes de transacciones on-chain y verificación matemática de integridad de balance.

### 2.7 Documentos de Evidencia y Hashes SHA-256
- **Listar:** `GET /api/documents?lot_id=<uuid>`
- **Subir/Registrar:** `POST /api/documents`
  - Acepta `multipart/form-data` con archivo real (calcula SHA-256 sobre los bytes exactos) o `application/json` con metadatos.

### 2.8 Diagnóstico y Estado del Sistema
- **Ruta:** `GET /api/status`
- Retorna estado de la blockchain, contratos, endpoints activos y versión.

---

## 3. Pruebas Automatizadas

```bash
# 21 pruebas de Hardhat del contrato Solidity
npm run test:contracts

# 40 pruebas de integración del Backend (idempotencia, concurrencia, seguridad multi-tenant)
npm run test:integration

# Verificación de compilación limpia de Next.js
npm run build
```
