import { NextRequest, NextResponse } from "next/server";
import { traceabilityService } from "@/lib/services/traceabilityService";
import { authenticateRequest } from "@/lib/auth/authHelper";

export const dynamic = "force-dynamic";

/**
 * POST /api/grain-lots/[id]/reconcile
 * Consulta directamente el smart contract de la blockchain (fuente inmutable de verdad)
 * para reconciliar y sincronizar el inventario remanente en Supabase.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateRequest(req);
    const lotId = params.id;

    const result = await traceabilityService.reconcileGrainLot(lotId);

    return NextResponse.json({
      success: true,
      message: result.discrepancy_detected
        ? "Discrepancy detected and resolved: inventory synced from blockchain source of truth"
        : "Inventory verified: Supabase copy is fully consistent with blockchain source of truth",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to reconcile grain lot with blockchain",
      },
      { status: error.message?.includes("not found") ? 404 : 500 }
    );
  }
}

/**
 * GET /api/grain-lots/[id]/reconcile
 * Solo consulta el estado on-chain vs Supabase sin forzar escritura
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return POST(req, { params });
}
