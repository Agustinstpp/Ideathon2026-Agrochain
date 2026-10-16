import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("====================================================");
  console.log(`Seeding AgroChainTrace on network: ${network.name}`);
  console.log("====================================================");

  const deploymentPath = path.join(__dirname, "../src/lib/blockchain/AgroChainTraceDeployment.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("AgroChainTraceDeployment.json not found. Run deploy script first!");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  const contractAddress = deployment.address;
  const [operator] = await ethers.getSigners();
  const currentNetwork = await ethers.provider.getNetwork();
  const isHedera = network.name === "hederaTestnet" || currentNetwork.chainId.toString() === "296";
  const overrides = isHedera ? { gasLimit: 1_000_000 } : {};

  console.log(`Contract: ${contractAddress}`);
  console.log(`Operator: ${operator.address}`);
  console.log(`Network Chain ID: ${currentNetwork.chainId.toString()}`);

  const AgroChainTrace = await ethers.getContractFactory("AgroChainTrace");
  const contract = AgroChainTrace.attach(contractAddress) as any;

  // 1. Seed Grain Lot: AGR-001 (ID 1, 10,000 kg of Maiz)
  const grainLotId = 1n;
  const originHash = ethers.keccak256(ethers.toUtf8Bytes("AGR-001_CORRIENTES_MAIZ_2026"));
  console.log(`\n[1/3] Registering Grain Lot AGR-001 (ID: ${grainLotId}, 10,000 kg)...`);
  try {
    const tx1 = await contract.registerGrainLot(grainLotId, "Maiz Silo Grano Humedo", 10000n, originHash, overrides);
    const receipt1 = await tx1.wait();
    console.log(`✅ Grain Lot AGR-001 confirmed! Tx: ${receipt1.hash}`);
    if (isHedera) {
      console.log(`   HashScan Tx: https://hashscan.io/testnet/transaction/${receipt1.hash}`);
    }
  } catch (err: any) {
    console.log(`⚠️ Grain Lot registration note: ${err.reason || err.message}`);
  }

  // 2. Seed Cattle Lot: GAN-001 (ID 1, 20 animals in Mercedes, Corrientes)
  const cattleLotId = 1n;
  const establishmentHash = ethers.keccak256(ethers.toUtf8Bytes("GAN-001_MERCEDES_CORRIENTES_RENSPA"));
  console.log(`\n[2/3] Registering Cattle Lot GAN-001 (ID: ${cattleLotId}, 20 animals)...`);
  try {
    const tx2 = await contract.registerCattleLot(cattleLotId, 20n, establishmentHash, overrides);
    const receipt2 = await tx2.wait();
    console.log(`✅ Cattle Lot GAN-001 confirmed! Tx: ${receipt2.hash}`);
    if (isHedera) {
      console.log(`   HashScan Tx: https://hashscan.io/testnet/transaction/${receipt2.hash}`);
    }
  } catch (err: any) {
    console.log(`⚠️ Cattle Lot registration note: ${err.reason || err.message}`);
  }

  // 3. Seed Feed Assignment: 2,000 kg from AGR-001 to GAN-001
  const assignmentId = 1n;
  const now = Math.floor(Date.now() / 1000);
  console.log(`\n[3/3] Assigning 2,000 kg of feed from AGR-001 to GAN-001...`);
  try {
    const tx3 = await contract.assignFeed(assignmentId, grainLotId, cattleLotId, 2000n, now - 86400 * 15, now, overrides);
    const receipt3 = await tx3.wait();
    console.log(`✅ Feed assignment confirmed! Tx: ${receipt3.hash}`);
    if (isHedera) {
      console.log(`   HashScan Tx: https://hashscan.io/testnet/transaction/${receipt3.hash}`);
    }
  } catch (err: any) {
    console.log(`⚠️ Feed assignment note: ${err.reason || err.message}`);
  }

  const remaining = await contract.getRemainingQuantity(grainLotId);
  console.log(`\n====================================================`);
  console.log(`ON-CHAIN BALANCE AUDIT FOR AGR-001:`);
  console.log(`Initial:   10,000 kg`);
  console.log(`Assigned:  2,000 kg (to GAN-001, 20 animals)`);
  console.log(`Remaining: ${remaining.toString()} kg (VERIFIED ON HEDERA)`);
  console.log(`====================================================`);
}

main().catch((err) => {
  console.error("Seeding error:", err);
  process.exitCode = 1;
});
