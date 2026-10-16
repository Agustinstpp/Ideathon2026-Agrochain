import { ethers } from "ethers";
import { hexToBytes32 } from "../utils/hash";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

// Cargar ABI y metadatos del contrato desplegado
let AgroChainAbi: any[] = [];
let defaultContractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS || "";
let defaultChainId = 296; // Hedera Testnet por defecto
let defaultNetwork = "hederaTestnet";

try {
  const deploymentPath = path.join(process.cwd(), "src/lib/blockchain/AgroChainTraceDeployment.json");
  if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
    AgroChainAbi = deployment.abi || [];
    if (!defaultContractAddress && deployment.address) {
      defaultContractAddress = deployment.address;
    }
    if (deployment.chainId) {
      defaultChainId = Number(deployment.chainId);
    }
    if (deployment.network) {
      defaultNetwork = deployment.network;
    }
  }
} catch {
  // Ignorar en tiempo de inicialización si aún no se ha desplegado
}

// ABI mínimo fallback de AgroChainTrace en caso de no haberse exportado todavía el JSON
const fallbackAbi = [
  "function registerGrainLot(uint256 id, string crop, uint256 initialQuantityKg, bytes32 originHash) external",
  "function registerCattleLot(uint256 id, uint256 animalCount, bytes32 establishmentHash) external",
  "function assignFeed(uint256 assignmentId, uint256 grainLotId, uint256 cattleLotId, uint256 quantityKg, uint256 periodStart, uint256 periodEnd) external",
  "function getGrainLot(uint256 id) external view returns (tuple(uint256 id, string crop, uint256 initialQuantityKg, uint256 remainingQuantityKg, bytes32 originHash, address registrant, uint256 createdAt, bool exists))",
  "function getCattleLot(uint256 id) external view returns (tuple(uint256 id, uint256 animalCount, bytes32 establishmentHash, address registrant, uint256 createdAt, bool exists))",
  "function getFeedAssignment(uint256 id) external view returns (tuple(uint256 id, uint256 grainLotId, uint256 cattleLotId, uint256 quantityKg, uint256 periodStart, uint256 periodEnd, uint256 assignedAt, address assignedBy, bool exists))",
  "function getRemainingQuantity(uint256 grainLotId) external view returns (uint256)",
  "function getGrainLotAssignments(uint256 grainLotId) external view returns (uint256[])",
  "function getCattleLotAssignments(uint256 cattleLotId) external view returns (uint256[])",
  "event GrainLotRegistered(uint256 indexed id, string crop, uint256 initialQuantityKg, bytes32 originHash, address indexed registrant, uint256 timestamp)",
  "event CattleLotRegistered(uint256 indexed id, uint256 animalCount, bytes32 establishmentHash, address indexed registrant, uint256 timestamp)",
  "event FeedAssigned(uint256 indexed assignmentId, uint256 indexed grainLotId, uint256 indexed cattleLotId, uint256 quantityKg, uint256 periodStart, uint256 periodEnd, uint256 remainingQuantityKg, address assignedBy, uint256 timestamp)"
];

export class BlockchainService {
  private provider: ethers.Provider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private isSimulationMode: boolean = false;
  private chainId: number = defaultChainId;
  private networkName: string = defaultNetwork;

  // Estado en memoria para simulación offline o fallback si la testnet no responde
  private mockGrainLots: Map<number, any> = new Map();
  private mockCattleLots: Map<number, any> = new Map();
  private mockAssignments: Map<number, any> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    const rpcUrl =
      process.env.BLOCKCHAIN_RPC_URL ||
      process.env.HEDERA_RPC_URL ||
      process.env.POLYGON_AMOY_RPC_URL ||
      process.env.SEPOLIA_RPC_URL ||
      "https://testnet.hashio.io/api";

    const privateKey = process.env.OPERATOR_PRIVATE_KEY;
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || defaultContractAddress;

    if (privateKey && contractAddress) {
      try {
        const cleanKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(cleanKey, this.provider);
        const abi = AgroChainAbi.length > 0 ? AgroChainAbi : fallbackAbi;
        this.contract = new ethers.Contract(contractAddress, abi, this.wallet);
        this.isSimulationMode = false;

        this.provider.getNetwork().then((net) => {
          this.chainId = Number(net.chainId);
          if (this.chainId === 296) {
            this.networkName = "Hedera Testnet";
          } else {
            this.networkName = net.name || defaultNetwork;
          }
        }).catch(() => {
          // Mantener defaults si la red no responde de inmediato
        });
        return;
      } catch (e) {
        console.warn("Failed to initialize real blockchain connection, falling back to simulated mode:", e);
      }
    }

    // Modo simulado activo si faltan variables o no hay red
    this.isSimulationMode = true;
  }

  public getStatus() {
    const addressStr = this.contract
      ? (typeof this.contract.target === "string" ? this.contract.target : String(this.contract.target))
      : (defaultContractAddress || "SIMULATED_CONTRACT");

    const explorerUrl =
      this.chainId === 296
        ? `https://hashscan.io/testnet/contract/${addressStr}`
        : `https://amoy.polygonscan.com/address/${addressStr}`;

    return {
      simulationMode: this.isSimulationMode,
      contractAddress: addressStr,
      chainId: this.chainId,
      network: this.networkName,
      explorerUrl: !this.isSimulationMode ? explorerUrl : undefined,
      operatorAddress: this.wallet ? this.wallet.address : "SIMULATED_OPERATOR_0xAgrochain",
    };
  }

  public getExplorerTxUrl(txHash: string): string | null {
    if (!txHash || txHash.includes("simulat")) return null;
    if (this.chainId === 296) {
      return `https://hashscan.io/testnet/transaction/${txHash}`;
    }
    if (this.chainId === 80002) {
      return `https://amoy.polygonscan.com/tx/${txHash}`;
    }
    return `https://hashscan.io/testnet/transaction/${txHash}`;
  }

  private getGasOverrides(): { gasLimit?: number } {
    // Hedera EVM se beneficia de un gasLimit explícito para evitar fallas de estimación
    if (this.chainId === 296 || defaultChainId === 296) {
      return { gasLimit: 1_000_000 };
    }
    return {};
  }

  /**
   * Registra un Lote Agrícola en la blockchain
   */
  public async registerGrainLot(
    id: number,
    crop: string,
    initialQuantityKg: number,
    originHashHex: string
  ): Promise<{ txHash: string; remainingQuantityKg: number; isSimulated: boolean; explorerUrl?: string }> {
    const originBytes32 = hexToBytes32(originHashHex);

    if (this.contract && !this.isSimulationMode) {
      try {
        const overrides = this.getGasOverrides();
        const tx = await this.contract.registerGrainLot(id, crop, initialQuantityKg, originBytes32, overrides);
        const receipt = await tx.wait();
        const txHash = receipt.hash;
        return {
          txHash,
          remainingQuantityKg: initialQuantityKg,
          isSimulated: false,
          explorerUrl: this.getExplorerTxUrl(txHash) || undefined,
        };
      } catch (err: any) {
        console.error("On-chain registerGrainLot error:", err.message);
        throw new Error(`Blockchain Revert: ${err.reason || err.message}`);
      }
    }

    // Modo Simulado
    if (this.mockGrainLots.has(id)) {
      throw new Error("AgroChainTrace: grain lot ID already exists");
    }
    this.mockGrainLots.set(id, {
      id,
      crop,
      initialQuantityKg,
      remainingQuantityKg: initialQuantityKg,
      originHash: originBytes32,
      createdAt: Math.floor(Date.now() / 1000),
      exists: true,
    });

    return {
      txHash: "0xsimulated_tx_" + ethers.keccak256(ethers.toUtf8Bytes(`grain_${id}_${Date.now()}`)).slice(2),
      remainingQuantityKg: initialQuantityKg,
      isSimulated: true,
    };
  }

  /**
   * Registra un Lote Ganadero en la blockchain
   */
  public async registerCattleLot(
    id: number,
    animalCount: number,
    establishmentHashHex: string
  ): Promise<{ txHash: string; isSimulated: boolean; explorerUrl?: string }> {
    const establishmentBytes32 = hexToBytes32(establishmentHashHex);

    if (this.contract && !this.isSimulationMode) {
      try {
        const overrides = this.getGasOverrides();
        const tx = await this.contract.registerCattleLot(id, animalCount, establishmentBytes32, overrides);
        const receipt = await tx.wait();
        const txHash = receipt.hash;
        return {
          txHash,
          isSimulated: false,
          explorerUrl: this.getExplorerTxUrl(txHash) || undefined,
        };
      } catch (err: any) {
        console.error("On-chain registerCattleLot error:", err.message);
        throw new Error(`Blockchain Revert: ${err.reason || err.message}`);
      }
    }

    // Modo Simulado
    if (this.mockCattleLots.has(id)) {
      throw new Error("AgroChainTrace: cattle lot ID already exists");
    }
    this.mockCattleLots.set(id, {
      id,
      animalCount,
      establishmentHash: establishmentBytes32,
      createdAt: Math.floor(Date.now() / 1000),
      exists: true,
    });

    return {
      txHash: "0xsimulated_tx_" + ethers.keccak256(ethers.toUtf8Bytes(`cattle_${id}_${Date.now()}`)).slice(2),
      isSimulated: true,
    };
  }

  /**
   * Asignación de Alimento (Core Anti Double-Spending)
   */
  public async assignFeed(
    assignmentId: number,
    grainLotId: number,
    cattleLotId: number,
    quantityKg: number,
    periodStartTimestamp: number,
    periodEndTimestamp: number
  ): Promise<{ txHash: string; remainingQuantityKg: number; isSimulated: boolean; explorerUrl?: string }> {
    if (this.contract && !this.isSimulationMode) {
      try {
        const overrides = this.getGasOverrides();
        const tx = await this.contract.assignFeed(
          assignmentId,
          grainLotId,
          cattleLotId,
          quantityKg,
          periodStartTimestamp,
          periodEndTimestamp,
          overrides
        );
        const receipt = await tx.wait();
        const remainingBigInt = await this.contract.getRemainingQuantity(grainLotId);
        const txHash = receipt.hash;
        return {
          txHash,
          remainingQuantityKg: Number(remainingBigInt),
          isSimulated: false,
          explorerUrl: this.getExplorerTxUrl(txHash) || undefined,
        };
      } catch (err: any) {
        console.error("On-chain assignFeed error:", err.message);
        throw new Error(`Blockchain Revert: ${err.reason || err.message}`);
      }
    }

    // Modo Simulado
    const grainLot = this.mockGrainLots.get(grainLotId);
    if (!grainLot || !grainLot.exists) {
      throw new Error("AgroChainTrace: grain lot does not exist");
    }
    const cattleLot = this.mockCattleLots.get(cattleLotId);
    if (!cattleLot || !cattleLot.exists) {
      throw new Error("AgroChainTrace: cattle lot does not exist");
    }
    if (grainLot.remainingQuantityKg < quantityKg) {
      throw new Error("AgroChainTrace: insufficient grain inventory");
    }
    if (this.mockAssignments.has(assignmentId)) {
      throw new Error("AgroChainTrace: assignment already exists");
    }

    // Descontar inventario de forma inmutable
    grainLot.remainingQuantityKg -= quantityKg;
    this.mockAssignments.set(assignmentId, {
      id: assignmentId,
      grainLotId,
      cattleLotId,
      quantityKg,
      periodStart: periodStartTimestamp,
      periodEnd: periodEndTimestamp,
      assignedAt: Math.floor(Date.now() / 1000),
      exists: true,
    });

    return {
      txHash: "0xsimulated_tx_" + ethers.keccak256(ethers.toUtf8Bytes(`feed_${assignmentId}_${Date.now()}`)).slice(2),
      remainingQuantityKg: grainLot.remainingQuantityKg,
      isSimulated: true,
    };
  }

  /**
   * Consulta el saldo remanente verificado en la blockchain
   */
  public async getRemainingQuantity(grainLotId: number): Promise<number> {
    if (this.contract && !this.isSimulationMode) {
      const remaining = await this.contract.getRemainingQuantity(grainLotId);
      return Number(remaining);
    }
    const lot = this.mockGrainLots.get(grainLotId);
    if (!lot) throw new Error("AgroChainTrace: grain lot does not exist");
    return lot.remainingQuantityKg;
  }

  /**
   * Consulta lote de grano
   */
  public async getGrainLot(grainLotId: number): Promise<any> {
    if (this.contract && !this.isSimulationMode) {
      const lot = await this.contract.getGrainLot(grainLotId);
      return {
        id: Number(lot.id),
        crop: lot.crop,
        initialQuantityKg: Number(lot.initialQuantityKg),
        remainingQuantityKg: Number(lot.remainingQuantityKg),
        originHash: lot.originHash,
        registrant: lot.registrant,
        createdAt: Number(lot.createdAt),
        exists: lot.exists,
      };
    }
    const lot = this.mockGrainLots.get(grainLotId);
    if (!lot) throw new Error("AgroChainTrace: grain lot does not exist");
    return lot;
  }

  /**
   * Consulta lote de ganado
   */
  public async getCattleLot(cattleLotId: number): Promise<any> {
    if (this.contract && !this.isSimulationMode) {
      const lot = await this.contract.getCattleLot(cattleLotId);
      return {
        id: Number(lot.id),
        animalCount: Number(lot.animalCount),
        establishmentHash: lot.establishmentHash,
        registrant: lot.registrant,
        createdAt: Number(lot.createdAt),
        exists: lot.exists,
      };
    }
    const lot = this.mockCattleLots.get(cattleLotId);
    if (!lot) throw new Error("AgroChainTrace: cattle lot does not exist");
    return lot;
  }

  /**
   * Consulta asignación de alimento
   */
  public async getFeedAssignment(assignmentId: number): Promise<any> {
    if (this.contract && !this.isSimulationMode) {
      const asg = await this.contract.getFeedAssignment(assignmentId);
      return {
        id: Number(asg.id),
        grainLotId: Number(asg.grainLotId),
        cattleLotId: Number(asg.cattleLotId),
        quantityKg: Number(asg.quantityKg),
        periodStart: Number(asg.periodStart),
        periodEnd: Number(asg.periodEnd),
        assignedAt: Number(asg.assignedAt),
        assignedBy: asg.assignedBy,
        exists: asg.exists,
      };
    }
    const asg = this.mockAssignments.get(assignmentId);
    if (!asg) throw new Error("AgroChainTrace: assignment does not exist");
    return asg;
  }
}

// Instancia singleton para el backend
export const blockchainService = new BlockchainService();
