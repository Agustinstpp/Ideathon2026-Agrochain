import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Seeding AgroChainTrace demo data...");

  const deploymentPath = path.join(__dirname, "../src/lib/blockchain/AgroChainTraceDeployment.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("AgroChainTraceDeployment.json not found. Run deploy script first!");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  const contractAddress = deployment.address;
  const [operator] = await ethers.getSigners();

  console.log(`Connecting to contract at: ${contractAddress} with operator ${operator.address}`);
  const AgroChainTrace = await ethers.getContractFactory("AgroChainTrace");
  const contract = AgroChainTrace.attach(contractAddress) as any;

  // 1. Seed Grain Lot: 10,000 kg of Silo Maiz
  const grainLotId = 1001n;
  const originHash = ethers.keccak256(ethers.toUtf8Bytes("ESTANCIA_SAN_CARLOS_CHACO_LOTE_04"));
  console.log(`Registering Grain Lot ${grainLotId} (10,000 kg)...`);
  try {
    const tx1 = await contract.registerGrainLot(grainLotId, "Silo Maiz Picado Fino", 10000n, originHash);
    await tx1.wait();
    console.log(`Grain Lot registered! Tx: ${tx1.hash}`);
  } catch (err: any) {
    console.log(`Grain Lot already exists or error: ${err.message}`);
  }

  // 2. Seed Cattle Lot: 120 animals in Feedlot Don Pedro
  const cattleLotId = 2001n;
  const establishmentHash = ethers.keccak256(ethers.toUtf8Bytes("RENSPA_06.012.0.12345/00_CORRAL_3"));
  console.log(`Registering Cattle Lot ${cattleLotId} (120 animals)...`);
  try {
    const tx2 = await contract.registerCattleLot(cattleLotId, 120n, establishmentHash);
    await tx2.wait();
    console.log(`Cattle Lot registered! Tx: ${tx2.hash}`);
  } catch (err: any) {
    console.log(`Cattle Lot already exists or error: ${err.message}`);
  }

  // 3. Seed Feed Assignment: 2,000 kg
  const assignmentId = 3001n;
  const now = Math.floor(Date.now() / 1000);
  console.log(`Assigning 2,000 kg of feed from lot ${grainLotId} to cattle lot ${cattleLotId}...`);
  try {
    const tx3 = await contract.assignFeed(assignmentId, grainLotId, cattleLotId, 2000n, now - 86400 * 7, now);
    await tx3.wait();
    console.log(`Feed assignment confirmed! Tx: ${tx3.hash}`);
  } catch (err: any) {
    console.log(`Feed assignment already exists or error: ${err.message}`);
  }

  const remaining = await contract.getRemainingQuantity(grainLotId);
  console.log(`----------------------------------------------------`);
  console.log(`CONFIRMED REMAINING GRAIN INVENTORY: ${remaining.toString()} kg`);
  console.log(`----------------------------------------------------`);
}

main().catch((err) => {
  console.error("Seeding error:", err);
  process.exitCode = 1;
});
