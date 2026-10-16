import { NextRequest, NextResponse } from "next/server";
import { CreateCattleLotSchema } from "@/lib/schemas/traceability";
import { traceabilityService } from "@/lib/services/traceabilityService";
import { authenticateRequest, authorizeOrganization } from "@/lib/auth/authHelper";

export const dynamic = "force-dynamic";

/**
 * POST /api/cattle-lots
 * Registra un nuevo lote de ganado en la blockchain y en Supabase
 */
export async function POST(req: NextRequest) {
  try {
    const authCtx = await authenticateRequest(req);
    const body = await req.json();

    if (!body.organization_id && authCtx.organizationId) {
      body.organization_id = authCtx.organizationId;
    }

    const validatedData = CreateCattleLotSchema.parse(body);

    if (!authCtx.isDemoUser) {
      authorizeOrganization(authCtx, validatedData.organization_id);
    }

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

    const isUnauthorized = error.message?.toLowerCase().includes("unauthorized");
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to register cattle lot",
      },
      { status: isUnauthorized ? 403 : 500 }
    );
  }
}

/**
 * GET /api/cattle-lots
 * Lista los lotes de ganado
 */
export async function GET(req: NextRequest) {
  try {
    const authCtx = await authenticateRequest(req);
    const searchParams = req.nextUrl.searchParams;
    const organizationId = searchParams.get("organization_id") || authCtx.organizationId;

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
