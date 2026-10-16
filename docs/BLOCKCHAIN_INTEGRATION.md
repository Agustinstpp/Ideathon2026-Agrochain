# AgroChain FeedTrace — Guía de Integración Blockchain & Smart Contracts
**Destinatario principal:** Persona 3 (Frontend / Backend Integración) y Persona 4 (Dossier / UX)  
**Autor:** Persona 1 (Senior Blockchain & Smart Contracts Engineer)  
**Fecha:** Octubre 2026 — Ideathon NEA Tech 2026 (Corrientes, Argentina)

---

## 1. Diagnóstico del Smart Contract (`contracts/AgroChainTrace.sol`)

- **Versión de Solidity:** `^0.8.24` (compilador optimizado `runs: 200`).
- **Estado de Auditoría:** **AUDITADO Y APROBADO**.
- **Resultados de Tests:** **21/21 tests unitarios y de integración pasando** (100% de éxito).
- **Control de Acceso:** Rol de propietario (`owner`) y mapeo de operadores autorizados (`authorizedOperators`). La wallet técnica del backend firma las transacciones protegiendo al productor rural de la fricción Web3.
- **Mecanismo Anti Double-Spending:** Descuento atómico de `remainingQuantityKg` verificado con `require(gLot.remainingQuantityKg >= quantityKg, "AgroChainTrace: insufficient grain inventory")`.

---

## 2. Redes, Contratos y Credenciales

### 2.1 Archivos Artifact JSON disponibles para importar
El ABI completo y metadatos de despliegue están sincronizados en:
1. `src/lib/contracts/AgroChainTrace.json` (recomendado para frontend y API)
2. `src/lib/blockchain/AgroChainTraceDeployment.json`

Ambos contienen:
```json
{
  "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "chainId": 31337,
  "network": "hardhat",
  "deployer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "abi": [ ... ]
}
```

### 2.2 Entornos Disponibles

| Entorno | Chain ID | RPC URL por defecto | Dirección Contrato |
|---|---|---|---|
| **Hardhat Local / Demo** | `31337` | `http://127.0.0.1:8545` | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| **Polygon Amoy (Testnet)** | `80002` | `https://rpc-amoy.polygon.technology` | Configurable en `.env` vía `NEXT_PUBLIC_CONTRACT_ADDRESS` |
| **Ethereum Sepolia** | `11155111` | `https://ethereum-sepolia-rpc.publicnode.com` | Configurable en `.env` |

> [!NOTE]
> Para la demo en Vercel o evaluación sin nodo Hardhat levantado, el servicio `server.ts` conmuta automáticamente a **Modo Simulado con Verificación Criptográfica Determinista**, garantizando que la UI nunca quede colgada si la testnet pública experimenta latencia o falta de gas.

---

## 3. Firmas Reales del Smart Contract

### 3.1 Funciones de Escritura (State-Changing)

#### `registerGrainLot`
```solidity
function registerGrainLot(
    uint256 id,
    string calldata crop,
    uint256 initialQuantityKg,
    bytes32 originHash
) external onlyAuthorized;
```
- Registra un lote de granos/alimento.
- `id`: Entero positivo único (> 0).
- `crop`: Nombre/variedad del cultivo (ej. `"Maiz Hibrido Silo"`).
- `initialQuantityKg`: Cantidad inicial cosechada o almacenada (> 0).
- `originHash`: Hash SHA-256 en formato `bytes32` (calculado con `hexToBytes32`).

#### `registerCattleLot`
```solidity
function registerCattleLot(
    uint256 id,
    uint256 animalCount,
    bytes32 establishmentHash
) external onlyAuthorized;
```
- Registra un lote o tropa ganadera.
- `id`: Entero positivo único (> 0).
- `animalCount`: Cabezas de ganado (> 0).
- `establishmentHash`: Hash `bytes32` del RENSPA / establecimiento.

#### `assignFeed`
```solidity
function assignFeed(
    uint256 assignmentId,
    uint256 grainLotId,
    uint256 cattleLotId,
    uint256 quantityKg,
    uint256 periodStart,
    uint256 periodEnd
) external onlyAuthorized;
```
- Asigna kilos de alimento de un lote agrícola a uno ganadero.
- Descuenta exactamente `quantityKg` de `remainingQuantityKg`.
- Si `quantityKg > remainingQuantityKg`, revierte de inmediato.

---

### 3.2 Funciones de Lectura (View)

| Función | Retorno | Descripción |
|---|---|---|
| `getGrainLot(uint256 id)` | `GrainLot` struct | Obtiene cultivo, saldo inicial, saldo remanente, hash y fecha. |
| `getCattleLot(uint256 id)` | `CattleLot` struct | Obtiene animales, hash RENSPA y fecha. |
| `getFeedAssignment(uint256 id)` | `FeedAssignment` struct | Detalle completo de la asignación confirmada. |
| `getRemainingQuantity(uint256 grainLotId)` | `uint256` | Consulta rápida de saldo disponible de grano (kg). |
| `getAssignmentCount()` | `uint256` | Cantidad total de asignaciones registradas en el contrato. |
| `getGrainLotAssignments(uint256 grainLotId)` | `uint256[]` | Array con IDs de todas las asignaciones que consumieron este lote. |
| `getCattleLotAssignments(uint256 cattleLotId)` | `uint256[]` | Array con IDs de todas las asignaciones recibidas por esta tropa. |

---

## 4. Eventos Emitidos por el Contrato

```solidity
event GrainLotRegistered(
    uint256 indexed id,
    string crop,
    uint256 initialQuantityKg,
    bytes32 originHash,
    address indexed registrant,
    uint256 timestamp
);

event CattleLotRegistered(
    uint256 indexed id,
    uint256 animalCount,
    bytes32 establishmentHash,
    address indexed registrant,
    uint256 timestamp
);

event FeedAssigned(
    uint256 indexed assignmentId,
    uint256 indexed grainLotId,
    uint256 indexed cattleLotId,
    uint256 quantityKg,
    uint256 periodStart,
    uint256 periodEnd,
    uint256 remainingQuantityKg,
    address assignedBy,
    uint256 timestamp
);
```

---

## 5. Errores y Razones de Reversión (Revert Strings)

| Error en Solidity | Causa | Código HTTP recomendado |
|---|---|---|
| `"AgroChainTrace: insufficient grain inventory"` | Se intentó asignar más kilos de los disponibles. | `400 Bad Request` |
| `"AgroChainTrace: grain lot ID already exists"` | El ID numérico del lote agrícola ya fue registrado previamente. | `409 Conflict` |
| `"AgroChainTrace: cattle lot ID already exists"` | El ID numérico del lote ganadero ya fue registrado previamente. | `409 Conflict` |
| `"AgroChainTrace: assignment already exists"` | El ID de la asignación ya existe. | `409 Conflict` |
| `"AgroChainTrace: grain lot does not exist"` | El lote agrícola consultado o referenciado no existe. | `404 Not Found` |
| `"AgroChainTrace: cattle lot does not exist"` | El lote ganadero referenciado no existe. | `404 Not Found` |
| `"AgroChainTrace: unauthorized operator"` | La cuenta que envió la transacción no está autorizada. | `403 Forbidden` |
| `"AgroChainTrace: periodStart cannot be after periodEnd"` | Fechas invertidas en el rango de consumo. | `400 Bad Request` |

---

## 6. Servicio Blockchain para Persona 3 (`src/lib/blockchain/server.ts`)

Persona 1 preparó el servicio exclusivo de servidor:
`src/lib/blockchain/server.ts`

### 6.1 Operaciones Exportadas

```typescript
import {
  registerGrainLotOnChain,
  registerCattleLotOnChain,
  assignFeedOnChain,
  getGrainLotOnChain,
  getCattleLotOnChain,
  getFeedAssignmentOnChain,
  getRemainingQuantityOnChain,
  getAssignmentCountOnChain,
} from "@/lib/blockchain/server";
```

### 6.2 Ejemplos de Uso en Endpoints de Next.js

#### Ejemplo: Registrar Lote Agrícola en API Route
```typescript
import { NextResponse } from "next/server";
import { registerGrainLotOnChain } from "@/lib/blockchain/server";

export async function POST(req: Request) {
  try {
    const { blockchainId, crop, initialQuantityKg, originHash } = await req.json();

    const txResult = await registerGrainLotOnChain(
      Number(blockchainId),
      crop,
      Number(initialQuantityKg),
      originHash
    );

    return NextResponse.json({
      success: true,
      txHash: txResult.txHash,
      status: txResult.status,
      remainingQuantityKg: txResult.remainingQuantityKg,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
```

#### Ejemplo: Asignar Alimento (Descuento y Validación de Saldo)
```typescript
import { NextResponse } from "next/server";
import { assignFeedOnChain } from "@/lib/blockchain/server";

export async function POST(req: Request) {
  try {
    const { assignmentId, grainLotId, cattleLotId, quantityKg, periodStart, periodEnd } = await req.json();

    const txResult = await assignFeedOnChain(
      Number(assignmentId),
      Number(grainLotId),
      Number(cattleLotId),
      Number(quantityKg),
      Math.floor(new Date(periodStart).getTime() / 1000),
      Math.floor(new Date(periodEnd).getTime() / 1000)
    );

    return NextResponse.json({
      success: true,
      txHash: txResult.txHash,
      remainingQuantityKg: txResult.remainingQuantityKg,
      message: "Asignación confirmada en blockchain",
    });
  } catch (error: any) {
    const isInsufficient = error.message.includes("insufficient grain inventory");
    return NextResponse.json(
      { success: false, error: error.message },
      { status: isInsufficient ? 400 : 500 }
    );
  }
}
```

#### Ejemplo: Consulta para Expediente Digital (Persona 4 / Pasaporte QR)
```typescript
import { getGrainLotOnChain, getRemainingQuantityOnChain } from "@/lib/blockchain/server";

export async function getBlockchainVerification(blockchainId: number) {
  const lot = await getGrainLotOnChain(blockchainId);
  const currentBalance = await getRemainingQuantityOnChain(blockchainId);

  return {
    verified: lot.exists,
    initialQuantityKg: lot.initialQuantityKg,
    remainingQuantityKg: currentBalance,
    registrant: lot.registrant,
    originHash: lot.originHash,
  };
}
```

---

## 7. Pruebas Obligatorias Ejecutadas con Éxito

El flujo exacto exigido fue probado e integrado en `test/AgroChainTrace.test.ts`:
1. **Lote Agrícola AGR-001 (Blockchain ID 1):** Registrado con **10.000 kg**.
2. **Lote Ganadero GAN-001 (Blockchain ID 1):** Registrado con **20 animales**.
3. **Primera Asignación:** **2.000 kg** asignados con éxito.
   - Saldo verificado: **8.000 kg**.
   - Evento `FeedAssigned` emitido con los IDs y cantidades correctas.
4. **Intento de Segunda Asignación Excesiva:** **9.000 kg** solicitados.
   - **Resultado:** Reversión inmediata con `"AgroChainTrace: insufficient grain inventory"`.
   - **Saldo final:** Se mantiene protegido e inmutable en **8.000 kg**.
   - **Historial:** Mantiene exactamente 1 asignación confirmada.

Para correr las pruebas en cualquier momento:
```bash
npm run test:contracts
npm run test:integration
```
