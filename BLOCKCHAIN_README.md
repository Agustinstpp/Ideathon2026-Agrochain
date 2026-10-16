# AgroChain FeedTrace — Arquitectura Blockchain & Smart Contracts

Documentación técnica generada por **Persona 1 (Blockchain, Supabase y Backend de Integración)** para el equipo de desarrollo.

---

## 1. Visión General del Contrato

El contrato `contracts/AgroChainTrace.sol` constituye la **fuente de verdad criptográfica e inmutable** para:
1. El registro de lotes de grano con su huella digital de origen (`originHash` / `bytes32`).
2. El registro de tropas o lotes ganaderos con su hash de establecimiento / RENSPA (`establishmentHash` / `bytes32`).
3. La asignación verificable de alimento (`assignFeed`), que descuenta matemáticamente del inventario de grano y vincula de forma irrevocable el lote agrícola con el lote ganadero.

---

## 2. Estructuras de Datos On-Chain

### `GrainLot`
```solidity
struct GrainLot {
    uint256 id;
    string crop;
    uint256 initialQuantityKg;
    uint256 remainingQuantityKg;
    bytes32 originHash;
    address registrant;
    uint256 createdAt;
    bool exists;
}
```

### `CattleLot`
```solidity
struct CattleLot {
    uint256 id;
    uint256 animalCount;
    bytes32 establishmentHash;
    address registrant;
    uint256 createdAt;
    bool exists;
}
```

### `FeedAssignment`
```solidity
struct FeedAssignment {
    uint256 id;
    uint256 grainLotId;
    uint256 cattleLotId;
    uint256 quantityKg;
    uint256 periodStart;
    uint256 periodEnd;
    uint256 assignedAt;
    address assignedBy;
    bool exists;
}
```

---

## 3. Firmas de Funciones (Interfaz Estable)

| Función | Parámetros | Visibilidad / Modificador | Descripción |
|---|---|---|---|
| `registerGrainLot` | `(uint256 id, string crop, uint256 initialQuantityKg, bytes32 originHash)` | `external onlyAuthorized` | Registra un lote agrícola con inventario inicial. |
| `registerCattleLot` | `(uint256 id, uint256 animalCount, bytes32 establishmentHash)` | `external onlyAuthorized` | Registra un lote ganadero. |
| `assignFeed` | `(uint256 assignmentId, uint256 grainLotId, uint256 cattleLotId, uint256 quantityKg, uint256 periodStart, uint256 periodEnd)` | `external onlyAuthorized` | Realiza el descuento atómico de inventario y crea el vínculo. |
| `getGrainLot` | `(uint256 id)` | `external view returns (GrainLot)` | Retorna los detalles del lote de grano. |
| `getCattleLot` | `(uint256 id)` | `external view returns (CattleLot)` | Retorna los detalles del lote ganadero. |
| `getFeedAssignment` | `(uint256 id)` | `external view returns (FeedAssignment)` | Retorna la asignación de alimento. |
| `getRemainingQuantity` | `(uint256 grainLotId)` | `external view returns (uint256)` | Consulta directa del saldo remanente verificado. |
| `getAssignmentCount` | `()` | `external view returns (uint256)` | Retorna el total de asignaciones realizadas. |
| `getGrainLotAssignments` | `(uint256 grainLotId)` | `external view returns (uint256[])` | IDs de asignaciones que consumieron este grano. |
| `getCattleLotAssignments`| `(uint256 cattleLotId)` | `external view returns (uint256[])` | IDs de asignaciones recibidas por este ganado. |

---

## 4. Control de Acceso y Modelo de Operador Técnico

Para permitir que productores de entre 30 y 60 años utilicen la plataforma sin instalar MetaMask ni lidiar con gas:
- Las transacciones son firmadas y enviadas por una **wallet técnica de backend** (`OPERATOR_PRIVATE_KEY`).
- El contrato incluye un mapeo `authorizedOperators(address => bool)` administrado por el propietario (`owner`).
- El backend valida previamente en PostgreSQL la identidad, sesión y pertenencia a la organización del usuario antes de emitir la transacción con la wallet técnica.

> [!WARNING]
> **Limitación de Centralización del MVP:**
> En esta fase de hackathon, la wallet técnica actúa como custodio y relayer de transacciones. En una versión productiva empresarial, este esquema evolucionará hacia un sistema de *Account Abstraction (ERC-4337)* con Session Keys o firmas delegadas (EIP-712) para que cada organización tenga su propia custodia descentralizada.

> [!NOTE]
> **Aclaración sobre la Verificación Física:**
> Una transacción válida en la blockchain demuestra formalmente la consistencia matemática, inmutabilidad y existencia de los registros digitales ingresados. No certifica por sí sola el consumo físico de los granos por los animales en el campo, el cual depende de inspecciones agronómicas, telemetría o auditorías complementarias.

---

## 5. Instrucciones de Despliegue y Pruebas

### 5.1 Ejecución de Pruebas Unitarias
```bash
npm run test:contracts
```
Ejecuta los 20 tests automatizados en Hardhat con validaciones de saldo, errores de reversión y control de acceso.

### 5.2 Despliegue en Red Local Hardhat
```bash
npm run deploy:local
```

### 5.3 Despliegue en Polygon Amoy (Testnet)
1. Obtener fondos POL de prueba en el [Polygon Faucet](https://faucet.polygon.technology/) seleccionando la red **Polygon PoS (Amoy)**.
2. Configurar `OPERATOR_PRIVATE_KEY` en `.env`.
3. Ejecutar:
```bash
npm run deploy:amoy
```

### 5.4 Despliegue en Sepolia (Ethereum Testnet)
1. Obtener fondos de prueba en [Sepolia Faucet](https://sepoliafaucet.com/) o [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).
2. Ejecutar:
```bash
npm run deploy:sepolia
```

### 5.5 Carga de Datos de Demostración (Seed)
```bash
npm run seed
```
Registra automáticamente un lote agrícola de 10.000 kg, un lote ganadero de 120 animales y realiza una primera asignación de 2.000 kg, dejando 8.000 kg confirmados.

---

## 6. Archivos Exportados para el Frontend y Persona 3

Tras la compilación o despliegue, los metadatos se exportan a:
- [AgroChainTraceDeployment.json](file:///e:/Github/Ideathon2026-Agrochain/src/lib/blockchain/AgroChainTraceDeployment.json): Contiene `address`, `chainId`, `network` y el `abi` completo.
