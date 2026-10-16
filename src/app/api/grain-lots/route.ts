import { NextRequest, NextResponse } from "next/server";
import { CreateGrainLotSchema } from "@/lib/schemas/traceability";
import { traceabilityService } from "@/lib/services/traceabilityService";
import { authenticateRequest, authorizeOrganization } from "@/lib/auth/authHelper";

export const dynamic = "force-dynamic";

/**
 * POST /api/grain-lots
 * Valida la carga, registra el lote en la blockchain para inmutabilidad
 * y coordina el registro en Supabase con su blockchain_id correspondiente.
 */
export async function POST(req: NextRequest) {
  try {
    const authCtx = await authenticateRequest(req);
    const body = await req.json();

    // Inyectar organization_id del usuario si no vino explícito
    if (!body.organization_id && authCtx.organizationId) {
      body.organization_id = authCtx.organizationId;
    }

    const validatedData = CreateGrainLotSchema.parse(body);

    // Validar autorización multi-tenant
    if (!authCtx.isDemoUser) {
      authorizeOrganization(authCtx, validatedData.organization_id);
    }

    const authHeader = req.headers.get("Authorization");
    const grainLot = await traceabilityService.createGrainLot(validatedData, authHeader);

    return NextResponse.json(
      {
        success: true,
        data: grainLot,
        message: "Grain lot registered and confirmed on-chain",
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
        error: error.message || "Failed to register grain lot",
      },
      { status: isUnauthorized ? 403 : 500 }
    );
  }
}

/**
 * GET /api/grain-lots
 * Lista los lotes de grano del usuario autorizado u organización
 */
export async function GET(req: NextRequest) {
  try {
    const authCtx = await authenticateRequest(req);
    const searchParams = req.nextUrl.searchParams;
    const organizationId = searchParams.get("organization_id") || authCtx.organizationId;

    const lots = await traceabilityService.listGrainLots(organizationId);

    return NextResponse.json({
      success: true,
      data: lots,
      count: lots.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to list grain lots",
      },
      { status: 500 }
    );
  }
}
