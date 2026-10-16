import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { hexToBytes32 } from "../utils/hash";

dotenv.config();

// Safe server-only check to guarantee no private key leakage to frontend bundles
if (typeof window !== "undefined") {
  throw new Error("AgroChain Server Blockchain Service cannot be bundled or executed on the client side.");
}

export interface GrainLotOnChain {
  id: number;
  crop: string;
  initialQuantityKg: number;
  remainingQuantityKg: number;
  originHash: string;
  registrant: string;
  createdAt: number;
  exists: boolean;
}

export interface CattleLotOnChain {
  id: number;
  animalCount: number;
  establishmentHash: string;
  registrant: string;
  createdAt: number;
  exists: boolean;
}

export interface FeedAssignmentOnChain {
  id: number;
  grainLotId: number;
  cattleLotId: number;
  quantityKg: number;
  periodStart: number;
  periodEnd: number;
  assignedAt: number;
  assignedBy: string;
  exists: boolean;
}

export interface TransactionResult {
  txHash: string;
  blockNumber: number;
  status: "confirmed" | "failed";
  remainingQuantityKg?: number;
  isSimulated: boolean;
  network?: string;
  chainId?: number;
}

// 1. ABI Loading
let AgroChainAbi: any[] = [];
let defaultContractAddress = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

try {
  const deploymentPath = path.join(process.cwd(), "src/lib/blockchain/AgroChainTraceDeployment.json");
  if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
    AgroChainAbi = deployment.abi || [];
    if (!defaultContractAddress && deployment.address) {
      defaultContractAddress = deployment.address;
    }
  }
} catch {
  // Graceful fallback during bootstrapping
}

const fallbackAbi = [
  "function owner() external view returns (address)",
  "function authorizedOperators(address) external view returns (bool)",
  "function registerGrainLot(uint256 id, string crop, uint256 initialQuantityKg, bytes32 originHash) external",
  "function registerCattleLot(uint256 id, uint256 animalCount, bytes32 establishmentHash) external",
  "function assignFeed(uint256 assignmentId, uint256 grainLotId, uint256 cattleLotId, uint256 quantityKg, uint256 periodStart, uint256 periodEnd) external",
  "function getGrainLot(uint256 id) external view returns (tuple(uint256 id, string crop, uint256 initialQuantityKg, uint256 remainingQuantityKg, bytes32 originHash, address registrant, uint256 createdAt, bool exists))",
  "function getCattleLot(uint256 id) external view returns (tuple(uint256 id, uint256 animalCount, bytes32 establishmentHash, address registrant, uint256 createdAt, bool exists))",
  "function getFeedAssignment(uint256 id) external view returns (tuple(uint256 id, uint256 grainLotId, uint256 cattleLotId, uint256 quantityKg, uint256 periodStart, uint256 periodEnd, uint256 assignedAt, address assignedBy, bool exists))",
  "function getRemainingQuantity(uint256 grainLotId) external view returns (uint256)",
  "function getAssignmentCount() external view returns (uint256)",
  "function getGrainLotAssignments(uint256 grainLotId) external view returns (uint256[])",
  "function getCattleLotAssignments(uint256 cattleLotId) external view returns (uint256[])",
  "event GrainLotRegistered(uint256 indexed id, string crop, uint256 initialQuantityKg, bytes32 originHash, address indexed registrant, uint256 timestamp)",
  "event CattleLotRegistered(uint256 indexed id, uint256 animalCount, bytes32 establishmentHash, address indexed registrant, uint256 timestamp)",
  "event FeedAssigned(uint256 indexed assignmentId, uint256 indexed grainLotId, uint256 indexed cattleLotId, uint256 quantityKg, uint256 periodStart, uint256 periodEnd, uint256 remainingQuantityKg, address assignedBy, uint256 timestamp)"
];

// In-memory simulation fallback if RPC / private key is not configured in local environment
const mockGrainLots = new Map<number, GrainLotOnChain>();
const mockCattleLots = new Map<number, CattleLotOnChain>();
const mockAssignments = new Map<number, FeedAssignmentOnChain>();

class BlockchainServerService {
  private provider: ethers.Provider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private isSimulationMode: boolean = false;
  private chainId: number = 31337;
  private networkName: string = "hardhat";

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
    const contractAddress = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || defaultContractAddress;

    if (privateKey && contractAddress) {
      try {
        const cleanKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(cleanKey, this.provider);
        const abi = AgroChainAbi.length > 0 ? AgroChainAbi : fallbackAbi;
        this.contract = new ethers.Contract(contractAddress, abi, this.wallet);
        this.isSimulationMode = false;

        // Async chain verification in background
        this.provider.getNetwork().then((net) => {
          this.chainId = Number(net.chainId);
          if (this.chainId === 296) {
            this.networkName = "Hedera Testnet";
          } else {
            this.networkName = net.name;
          }
        }).catch(() => {
          // Keep defaults if offline
        });
        return;
      } catch (e) {
        console.warn("[BlockchainServerService] Failed to initialize live blockchain connection, falling back to mock mode:", e);
      }
    }

    this.isSimulationMode = true;
  }

  public getStatus() {
    const addressStr = this.contract
      ? (typeof this.contract.target === "string" ? this.contract.target : String(this.contract.target))
      : (defaultContractAddress || "0x5FbDB2315678afecb367f032d93F642f64180aa3");

    return {
      simulationMode: this.isSimulationMode,
      contractAddress: addressStr,
      chainId: this.chainId,
      network: this.networkName,
      operatorAddress: this.wallet ? this.wallet.address : "SIMULATED_BACKEND_OPERATOR",
    };
  }

  private parseContractError(err: any): Error {
    const message = err?.reason || err?.message || "Unknown blockchain error";
    if (message.includes("AgroChainTrace:")) {
      return new Error(message);
    }
    if (message.includes("insufficient grain inventory")) {
      return new Error("AgroChainTrace: insufficient grain inventory");
    }
    if (message.includes("grain lot ID already exists")) {
      return new Error("AgroChainTrace: grain lot ID already exists");
    }
    if (message.includes("cattle lot ID already exists")) {
      return new Error("AgroChainTrace: cattle lot ID already exists");
    }
    if (message.includes("unauthorized operator")) {
      return new Error("AgroChainTrace: unauthorized operator");
    }
    return new Error(`Blockchain Revert: ${message}`);
  }

  private getGasOverrides(): { gasLimit?: number } {
    if (this.chainId === 296) {
      return { gasLimit: 1_000_000 };
    }
    return {};
  }

  /**
   * Register Grain Lot on Chain
   */
  public async registerGrainLotOnChain(
    id: number,
    crop: string,
    initialQuantityKg: number,
    originHashHex: string
  ): Promise<TransactionResult> {
    const originBytes32 = hexToBytes32(originHashHex);

    if (this.contract && !this.isSimulationMode) {
      try {
        // Pre-check existence to avoid duplicate gas spend
        try {
          const existing = await this.contract.getGrainLot(id);
          if (existing.exists) {
            throw new Error("AgroChainTrace: grain lot ID already exists");
          }
        } catch (e: any) {
          // If error is that it already exists, bubble up
          if (e.message.includes("already exists")) throw e;
          // "does not exist" is expected when creating a new one
        }

        const overrides = this.getGasOverrides();
        const tx = await this.contract.registerGrainLot(id, crop, initialQuantityKg, originBytes32, overrides);
        const receipt = await tx.wait(1);

        return {
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 1 ? "confirmed" : "failed",
          remainingQuantityKg: initialQuantityKg,
          isSimulated: false,
          network: this.networkName,
          chainId: this.chainId,
        };
      } catch (err: any) {
        throw this.parseContractError(err);
      }
    }

    // Simulated Mode
    if (mockGrainLots.has(id)) {
      throw new Error("AgroChainTrace: grain lot ID already exists");
    }

    mockGrainLots.set(id, {
      id,
      crop,
      initialQuantityKg,
      remainingQuantityKg: initialQuantityKg,
      originHash: originBytes32,
      registrant: "0xSimulatedOperator",
      createdAt: Math.floor(Date.now() / 1000),
      exists: true,
    });

    return {
      txHash: "0xsim_tx_grain_" + ethers.keccak256(ethers.toUtf8Bytes(`grain_${id}_${Date.now()}`)).slice(2, 42),
      blockNumber: 1234567,
      status: "confirmed",
      remainingQuantityKg: initialQuantityKg,
      isSimulated: true,
      network: "simulation",
      chainId: 31337,
    };
  }

  /**
   * Register Cattle Lot on Chain
   */
  public async registerCattleLotOnChain(
    id: number,
    animalCount: number,
    establishmentHashHex: string
  ): Promise<TransactionResult> {
    const establishmentBytes32 = hexToBytes32(establishmentHashHex);

    if (this.contract && !this.isSimulationMode) {
      try {
        // Pre-check existence to avoid redundant transaction
        try {
          const existing = await this.contract.getCattleLot(id);
          if (existing.exists) {
            throw new Error("AgroChainTrace: cattle lot ID already exists");
          }
        } catch (e: any) {
          if (e.message.includes("already exists")) throw e;
        }

        const overrides = this.getGasOverrides();
        const tx = await this.contract.registerCattleLot(id, animalCount, establishmentBytes32, overrides);
        const receipt = await tx.wait(1);

        return {
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 1 ? "confirmed" : "failed",
          isSimulated: false,
          network: this.networkName,
          chainId: this.chainId,
        };
      } catch (err: any) {
        throw this.parseContractError(err);
      }
    }

    // Simulated Mode
    if (mockCattleLots.has(id)) {
      throw new Error("AgroChainTrace: cattle lot ID already exists");
    }

    mockCattleLots.set(id, {
      id,
      animalCount,
      establishmentHash: establishmentBytes32,
      registrant: "0xSimulatedOperator",
      createdAt: Math.floor(Date.now() / 1000),
      exists: true,
    });

    return {
      txHash: "0xsim_tx_cattle_" + ethers.keccak256(ethers.toUtf8Bytes(`cattle_${id}_${Date.now()}`)).slice(2, 42),
      blockNumber: 1234568,
      status: "confirmed",
      isSimulated: true,
      network: "simulation",
      chainId: 31337,
    };
  }

  /**
   * Assign Feed on Chain (Anti Double-Spending & Atomic Balance Deduction)
   */
  public async assignFeedOnChain(
    assignmentId: number,
    grainLotId: number,
    cattleLotId: number,
    quantityKg: number,
    periodStart: number,
    periodEnd: number
  ): Promise<TransactionResult> {
    if (this.contract && !this.isSimulationMode) {
      try {
        // Pre-check balance before sending transaction to prevent unnecessary gas consumption
        const remainingBigInt = await this.contract.getRemainingQuantity(grainLotId);
        if (Number(remainingBigInt) < quantityKg) {
          throw new Error("AgroChainTrace: insufficient grain inventory");
        }

        const overrides = this.getGasOverrides();
        const tx = await this.contract.assignFeed(
          assignmentId,
          grainLotId,
          cattleLotId,
          quantityKg,
          periodStart,
          periodEnd,
          overrides
        );
        const receipt = await tx.wait(1);

        const newRemaining = await this.contract.getRemainingQuantity(grainLotId);

        return {
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 1 ? "confirmed" : "failed",
          remainingQuantityKg: Number(newRemaining),
          isSimulated: false,
          network: this.networkName,
          chainId: this.chainId,
        };
      } catch (err: any) {
        throw this.parseContractError(err);
      }
    }

    // Simulated Mode
    const grainLot = mockGrainLots.get(grainLotId);
    if (!grainLot || !grainLot.exists) {
      throw new Error("AgroChainTrace: grain lot does not exist");
    }
    const cattleLot = mockCattleLots.get(cattleLotId);
    if (!cattleLot || !cattleLot.exists) {
      throw new Error("AgroChainTrace: cattle lot does not exist");
    }
    if (grainLot.remainingQuantityKg < quantityKg) {
      throw new Error("AgroChainTrace: insufficient grain inventory");
    }
    if (mockAssignments.has(assignmentId)) {
      throw new Error("AgroChainTrace: assignment already exists");
    }

    grainLot.remainingQuantityKg -= quantityKg;
    mockAssignments.set(assignmentId, {
      id: assignmentId,
      grainLotId,
      cattleLotId,
      quantityKg,
      periodStart,
      periodEnd,
      assignedAt: Math.floor(Date.now() / 1000),
      assignedBy: "0xSimulatedOperator",
      exists: true,
    });

    return {
      txHash: "0xsim_tx_feed_" + ethers.keccak256(ethers.toUtf8Bytes(`feed_${assignmentId}_${Date.now()}`)).slice(2, 42),
      blockNumber: 1234569,
      status: "confirmed",
      remainingQuantityKg: grainLot.remainingQuantityKg,
      isSimulated: true,
      network: "simulation",
      chainId: 31337,
    };
  }

  /**
   * Get Grain Lot On Chain
   */
  public async getGrainLotOnChain(id: number): Promise<GrainLotOnChain> {
    if (this.contract && !this.isSimulationMode) {
      try {
        const lot = await this.contract.getGrainLot(id);
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
      } catch (err: any) {
        throw this.parseContractError(err);
      }
    }

    const lot = mockGrainLots.get(id);
    if (!lot) throw new Error("AgroChainTrace: grain lot does not exist");
    return lot;
  }

  /**
   * Get Cattle Lot On Chain
   */
  public async getCattleLotOnChain(id: number): Promise<CattleLotOnChain> {
    if (this.contract && !this.isSimulationMode) {
      try {
        const lot = await this.contract.getCattleLot(id);
        return {
          id: Number(lot.id),
          animalCount: Number(lot.animalCount),
          establishmentHash: lot.establishmentHash,
          registrant: lot.registrant,
          createdAt: Number(lot.createdAt),
          exists: lot.exists,
        };
      } catch (err: any) {
        throw this.parseContractError(err);
      }
    }

    const lot = mockCattleLots.get(id);
    if (!lot) throw new Error("AgroChainTrace: cattle lot does not exist");
    return lot;
  }

  /**
   * Get Feed Assignment On Chain
   */
  public async getFeedAssignmentOnChain(id: number): Promise<FeedAssignmentOnChain> {
    if (this.contract && !this.isSimulationMode) {
      try {
        const asg = await this.contract.getFeedAssignment(id);
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
      } catch (err: any) {
        throw this.parseContractError(err);
      }
    }

    const asg = mockAssignments.get(id);
    if (!asg) throw new Error("AgroChainTrace: assignment does not exist");
    return asg;
  }

  /**
   * Get Remaining Quantity directly from contract
   */
  public async getRemainingQuantityOnChain(grainLotId: number): Promise<number> {
    if (this.contract && !this.isSimulationMode) {
      try {
        const remaining = await this.contract.getRemainingQuantity(grainLotId);
        return Number(remaining);
      } catch (err: any) {
        throw this.parseContractError(err);
      }
    }

    const lot = mockGrainLots.get(grainLotId);
    if (!lot) throw new Error("AgroChainTrace: grain lot does not exist");
    return lot.remainingQuantityKg;
  }

  /**
   * Get Total Assignment Count on Chain
   */
  public async getAssignmentCountOnChain(): Promise<number> {
    if (this.contract && !this.isSimulationMode) {
      try {
        const count = await this.contract.getAssignmentCount();
        return Number(count);
      } catch (err: any) {
        throw this.parseContractError(err);
      }
    }
    return mockAssignments.size;
  }
}

// Singleton backend instance
export const serverBlockchainService = new BlockchainServerService();

// Standalone function exports matching Persona 1 requirements:
export const registerGrainLotOnChain = (id: number, crop: string, qty: number, hash: string) =>
  serverBlockchainService.registerGrainLotOnChain(id, crop, qty, hash);

export const registerCattleLotOnChain = (id: number, animals: number, hash: string) =>
  serverBlockchainService.registerCattleLotOnChain(id, animals, hash);

export const assignFeedOnChain = (id: number, gId: number, cId: number, qty: number, start: number, end: number) =>
  serverBlockchainService.assignFeedOnChain(id, gId, cId, qty, start, end);

export const getGrainLotOnChain = (id: number) =>
  serverBlockchainService.getGrainLotOnChain(id);

export const getCattleLotOnChain = (id: number) =>
  serverBlockchainService.getCattleLotOnChain(id);

export const getFeedAssignmentOnChain = (id: number) =>
  serverBlockchainService.getFeedAssignmentOnChain(id);

export const getRemainingQuantityOnChain = (grainLotId: number) =>
  serverBlockchainService.getRemainingQuantityOnChain(grainLotId);

export const getAssignmentCountOnChain = () =>
  serverBlockchainService.getAssignmentCountOnChain();
