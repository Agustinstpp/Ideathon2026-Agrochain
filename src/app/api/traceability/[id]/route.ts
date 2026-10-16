import { NextRequest, NextResponse } from "next/server";
import { traceabilityService } from "@/lib/services/traceabilityService";

export const dynamic = "force-dynamic";

/**
 * GET /api/traceability/[id]
 * Retorna el expediente digital completo de trazabilidad verificable on-chain.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lotId = params.id;
    if (!lotId) {
      return NextResponse.json(
        { success: false, error: "Missing lot ID parameter" },
        { status: 400 }
      );
    }

    const dossier = await traceabilityService.getTraceabilityDossier(lotId);

    return NextResponse.json({
      success: true,
      data: dossier,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve traceability dossier",
      },
      { status: error.message?.includes("not found") ? 404 : 500 }
    );
  }
}
