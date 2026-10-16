import { NextRequest, NextResponse } from "next/server";
import { CreateCattleLotSchema } from "@/lib/schemas/traceability";
import { traceabilityService } from "@/lib/services/traceabilityService";

export const dynamic = "force-dynamic";

/**
 * POST /api/cattle-lots
 * Registra un nuevo lote de ganado y emite la transacción on-chain
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CreateCattleLotSchema.parse(body);

    const authHeader = req.headers.get("Authorization");
    const cattleLot = await traceabilityService.createCattleLot(validatedData, authHeader);

    return NextResponse.json(
      {
        success: true,
        data: cattleLot,
        message: "Cattle lot registered and confirmed on-chain",
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to register cattle lot",
      },
      { status: error.message?.includes("unauthorized") ? 403 : 500 }
    );
  }
}

/**
 * GET /api/cattle-lots
 * Lista los lotes de ganado
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const organizationId = searchParams.get("organization_id") || undefined;

    const lots = await traceabilityService.listCattleLots(organizationId);

    return NextResponse.json({
      success: true,
      data: lots,
      count: lots.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to list cattle lots",
      },
      { status: 500 }
    );
  }
}
