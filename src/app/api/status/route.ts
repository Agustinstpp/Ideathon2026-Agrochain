import { NextResponse } from "next/server";
import { blockchainService } from "@/lib/blockchain/blockchainService";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = blockchainService.getStatus();

  return NextResponse.json({
    status: "online",
    system: "AgroChain FeedTrace - Persona 1 Core",
    blockchain: {
      ...status,
      network: process.env.NODE_ENV === "production" ? "Polygon Amoy / Sepolia" : "Hardhat / Localhost",
      supported_chains: [80002, 11155111, 31337],
    },
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
