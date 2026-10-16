import { NextRequest, NextResponse } from "next/server";
import { CreateEstablishmentSchema } from "@/lib/schemas/traceability";
import { traceabilityService } from "@/lib/services/traceabilityService";
import { authenticateRequest, authorizeOrganization } from "@/lib/auth/authHelper";

export const dynamic = "force-dynamic";

/**
 * POST /api/establishments
 * Registra un nuevo establecimiento agropecuario o feedlot
 */
export async function POST(req: NextRequest) {
  try {
    const authCtx = await authenticateRequest(req);
    const body = await req.json();

    if (!body.organization_id && authCtx.organizationId) {
      body.organization_id = authCtx.organizationId;
    }

    const validatedData = CreateEstablishmentSchema.parse(body);

    if (!authCtx.isDemoUser) {
      authorizeOrganization(authCtx, validatedData.organization_id);
    }

    const establishment = await traceabilityService.createEstablishment(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: establishment,
        message: "Establishment registered successfully",
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
        error: error.message || "Failed to register establishment",
      },
      { status: isUnauthorized ? 403 : 500 }
    );
  }
}

/**
 * GET /api/establishments
 * Lista los establecimientos de la organización
 */
export async function GET(req: NextRequest) {
  try {
    const authCtx = await authenticateRequest(req);
    const searchParams = req.nextUrl.searchParams;
    const organizationId = searchParams.get("organization_id") || authCtx.organizationId;

    const establishments = await traceabilityService.listEstablishments(organizationId);

    return NextResponse.json({
      success: true,
      data: establishments,
      count: establishments.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to list establishments",
      },
      { status: 500 }
    );
  }
}
