import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/authHelper";
import { traceabilityService } from "@/lib/services/traceabilityService";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard
 * Devuelve métricas resumidas del usuario y organización autorizada:
 * - Inventario de granos (kg iniciales vs remanentes)
 * - Población ganadera
 * - Asignaciones realizadas
 * - Estado de conexión a la blockchain
 * - Actividad reciente
 */
export async function GET(req: NextRequest) {
  try {
    const authCtx = await authenticateRequest(req);
    const searchParams = req.nextUrl.searchParams;
    const organizationId = searchParams.get("organization_id") || authCtx.organizationId;

    const metrics = await traceabilityService.getDashboardMetrics(organizationId);

    return NextResponse.json({
      success: true,
      data: metrics,
      organization_id: organizationId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve dashboard metrics",
      },
      { status: 500 }
    );
  }
}
