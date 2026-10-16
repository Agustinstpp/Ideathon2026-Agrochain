import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("====================================================");
  console.log(`Starting AgroChainTrace deployment on: ${network.name}`);
  console.log("====================================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer signer available. Check OPERATOR_PRIVATE_KEY or local network.");
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH / POL / HBAR`);

  const currentNetwork = await ethers.provider.getNetwork();
  const chainId = currentNetwork.chainId.toString();
  const isHedera = network.name === "hederaTestnet" || chainId === "296";

  const AgroChainTraceFactory = await ethers.getContractFactory("AgroChainTrace");
  // Hedera EVM uses custom gas estimation; providing explicit gasLimit ensures smooth deployment
  const deployOverrides = isHedera ? { gasLimit: 2_500_000 } : {};
  const contract = await AgroChainTraceFactory.deploy(deployOverrides);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  const txHash = deployTx ? deployTx.hash : "";

  console.log("----------------------------------------------------");
  console.log(`AgroChainTrace deployed successfully!`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Chain ID:         ${chainId}`);
  console.log(`Network Name:     ${network.name}`);
  if (txHash) {
    console.log(`Deploy Tx Hash:   ${txHash}`);
  }
  if (isHedera) {
    console.log(`HashScan Contract: https://hashscan.io/testnet/contract/${contractAddress}`);
    if (txHash) {
      console.log(`HashScan Deploy Tx: https://hashscan.io/testnet/transaction/${txHash}`);
    }
  }
  console.log("----------------------------------------------------");

  // Read ABI from Hardhat artifact
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/AgroChainTrace.sol/AgroChainTrace.json"
  );

  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    abi = artifact.abi;
  }

  // Export metadata for Next.js backend & Persona 3 integration
  const deploymentInfo = {
    address: contractAddress,
    chainId: Number(chainId),
    network: network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: abi,
  };

  const outputDir = path.join(__dirname, "../src/lib/blockchain");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "AgroChainTraceDeployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment metadata written to: ${outputPath}`);

  const contractsDir = path.join(__dirname, "../src/lib/contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  const contractsPath = path.join(contractsDir, "AgroChainTrace.json");
  fs.writeFileSync(contractsPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment metadata written to: ${contractsPath}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
