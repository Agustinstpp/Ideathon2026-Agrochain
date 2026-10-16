import { NextResponse } from "next/server";
import { blockchainService } from "@/lib/blockchain/blockchainService";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = blockchainService.getStatus();

  return NextResponse.json({
    status: "online",
    system: "AgroChain FeedTrace — Core Backend & Blockchain Engine",
    personas: {
      persona1_blockchain: "ready",
      persona2_frontend_contract: "ready",
      persona3_backend_supabase: "ready",
      persona4_passport_endpoint: "ready",
    },
    blockchain: {
      ...status,
      network: process.env.NODE_ENV === "production" ? "Polygon Amoy / Sepolia" : "Polygon Amoy (80002) / Local",
      supported_chains: [80002, 11155111, 31337],
    },
    storage: {
      evidence_bucket: "evidence-documents",
      status: "active",
    },
    endpoints: {
      dashboard: "GET /api/dashboard",
      establishments: "GET, POST /api/establishments",
      grain_lots: "GET, POST /api/grain-lots",
      grain_lot_reconcile: "POST /api/grain-lots/[id]/reconcile",
      cattle_lots: "GET, POST /api/cattle-lots",
      feed_history: "GET /api/cattle-lots/[id]/feed-history",
      feed_assignments: "GET, POST /api/feed-assignments",
      passport: "GET /api/passport/[id]",
      documents: "GET, POST /api/documents",
      status: "GET /api/status",
    },
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
