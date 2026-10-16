import { NextRequest, NextResponse } from "next/server";
import { traceabilityService } from "@/lib/services/traceabilityService";

export const dynamic = "force-dynamic";

/**
 * GET /api/grain-lots/[id]
 * Consulta un lote agrícola específico
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lotId = params.id;
    const lot = await traceabilityService.getGrainLotById(lotId);

    if (!lot) {
      return NextResponse.json(
        { success: false, error: `Grain lot not found with ID ${lotId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lot,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve grain lot" },
      { status: 500 }
    );
  }
}
