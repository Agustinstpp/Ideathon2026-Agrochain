import { NextRequest, NextResponse } from "next/server";
import { traceabilityService } from "@/lib/services/traceabilityService";

export const dynamic = "force-dynamic";

/**
 * GET /api/cattle-lots/[id]
 * Consulta un lote ganadero específico
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lotId = params.id;
    const lot = await traceabilityService.getCattleLotById(lotId);

    if (!lot) {
      return NextResponse.json(
        { success: false, error: `Cattle lot not found with ID ${lotId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lot,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve cattle lot" },
      { status: 500 }
    );
  }
}
