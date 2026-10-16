import { NextRequest, NextResponse } from "next/server";
import { traceabilityService } from "@/lib/services/traceabilityService";

export const dynamic = "force-dynamic";

/**
 * GET /api/cattle-lots/[id]/feed-history
 * Devuelve el historial cronológico de asignaciones de alimento que recibió este lote ganadero,
 * incluyendo datos del lote agrícola (cultivo, hash de origen) y hashes de transacciones blockchain.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cattleLotId = params.id;
    if (!cattleLotId) {
      return NextResponse.json(
        { success: false, error: "Missing cattle lot ID parameter" },
        { status: 400 }
      );
    }

    const history = await traceabilityService.getCattleLotFeedHistory(cattleLotId);

    return NextResponse.json({
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve cattle lot feed history",
      },
      { status: error.message?.includes("not found") ? 404 : 500 }
    );
  }
}
