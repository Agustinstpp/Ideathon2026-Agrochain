# AgroChain FeedTrace — Guía de Integración para Persona 3 y Persona 4

Documentación de contratos de API, formatos JSON, tipos TypeScript y ejemplos prácticos generada por **Persona 1**.

---

## 1. Importación de Tipos TypeScript

Todos los tipos de dominio están exportados en:
```typescript
import {
  GrainLot,
  CattleLot,
  FeedAssignment,
  TraceabilityDossier,
  EntityStatus
} from "@/lib/types";
```

---

## 2. Endpoints de la API Backend

### 2.1 Registrar Lote Agrícola
- **Método / Ruta:** `POST /api/grain-lots`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <supabase_access_token>` (opcional en demo)
- **Cuerpo de Solicitud (Request Body):**
```json
{
  "organization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "establishment_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "external_code": "MAIZ-2026-CH01",
  "crop": "Maíz Picado Silo Grano Húmedo",
  "initial_quantity_kg": 10000,
  "origin_hash": "0x3a7e58f0...64hex"
}
```
- **Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "e9b1192e-5036-4078-a0e2-63b71eb26d30",
    "organization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "external_code": "MAIZ-2026-CH01",
    "crop": "Maíz Picado Silo Grano Húmedo",
    "initial_quantity_kg": 10000,
    "remaining_quantity_kg": 10000,
    "blockchain_id": 1001,
    "blockchain_tx_hash": "0x...",
    "status": "confirmed",
    "created_at": "2026-10-16T04:00:00.000Z"
  },
  "message": "Grain lot registered and confirmed on-chain"
}
```

---

### 2.2 Registrar Lote Ganadero
- **Método / Ruta:** `POST /api/cattle-lots`
- **Cuerpo de Solicitud:**
```json
{
  "organization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "establishment_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "external_code": "FEEDLOT-CORRAL-03",
  "animal_count": 120,
  "establishment_hash": "0x8f2c3...64hex"
}
```
- **Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "2d8f99e1-6712-4f32-8499-c89283920194",
    "animal_count": 120,
    "blockchain_id": 2001,
    "blockchain_tx_hash": "0x...",
    "status": "confirmed"
  }
}
```

---

### 2.3 Asignar Alimento (Operación Crítica Anti Double-Spending)
- **Método / Ruta:** `POST /api/feed-assignments`
- **Cuerpo de Solicitud:**
```json
{
  "grain_lot_id": "e9b1192e-5036-4078-a0e2-63b71eb26d30",
  "cattle_lot_id": "2d8f99e1-6712-4f32-8499-c89283920194",
  "quantity_kg": 2000,
  "period_start": "2026-10-01",
  "period_end": "2026-10-31"
}
```
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
    "blockchain_tx_hash": "0x...",
    "status": "confirmed"
  },
  "remaining_quantity_kg": 8000,
  "message": "Feed assignment verified and confirmed on blockchain"
}
```
- **Respuesta de Error por Saldo Insuficiente (400 Bad Request):**
```json
{
  "success": false,
  "error": "Insufficient grain inventory: Requested 9000 kg but only 8000 kg available"
}
```

---

### 2.4 Obtener Ficha / Expediente Digital para Código QR (Persona 4)
- **Método / Ruta:** `GET /api/traceability/[id]`
- **Parámetro:** `id` del lote de ganado o lote de grano (UUID)
- **Respuesta:**
```json
{
  "success": true,
  "data": {
    "grain_lot": { ... },
    "cattle_lot": { ... },
    "feed_assignments": [ ... ],
    "on_chain_verification": {
      "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "chain_id": 80002,
      "grain_lot_on_chain": {
        "id": 1001,
        "crop": "Maíz Picado Silo Grano Húmedo",
        "initial_quantity_kg": 10000,
        "remaining_quantity_kg": 8000,
        "exists": true
      },
      "cattle_lot_on_chain": {
        "id": 2001,
        "animal_count": 120,
        "exists": true
      },
      "verified_feed_assignments": [
        {
          "id": 3001,
          "quantity_kg": 2000,
          "period_start": "2026-10-01",
          "period_end": "2026-10-31",
          "tx_hash": "0x..."
        }
      ],
      "balance_integrity_verified": true
    }
  }
}
```

---

### 2.5 Diagnóstico y Salud del Sistema
- **Método / Ruta:** `GET /api/status`
- Retorna si el backend está en modo live testnet o en simulación local, la dirección del contrato y la wallet técnica.
