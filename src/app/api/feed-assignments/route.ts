import { NextRequest, NextResponse } from "next/server";
import { CreateFeedAssignmentSchema } from "@/lib/schemas/traceability";
import { traceabilityService } from "@/lib/services/traceabilityService";
import { authenticateRequest } from "@/lib/auth/authHelper";

export const dynamic = "force-dynamic";

/**
 * POST /api/feed-assignments
 * Endpoint crítico: Realiza la asignación atómica de alimento con:
 * - Autenticación y autorización multi-tenant
 * - Idempotencia (operation_id / idempotency_key)
 * - Control de concurrencia y prevención de doble clic
 * - Descuento inmutable en Smart Contract
 * - Reconciliación si ocurre fallo de red intermedio
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Autenticar
    const authCtx = await authenticateRequest(req);

    // 2. Leer payload
    const body = await req.json();

    // 3. Validar payload con schema (soporta camelCase y snake_case)
    const validatedData = CreateFeedAssignmentSchema.parse(body);

    const authHeader = req.headers.get("Authorization");
    const userOrgId = authCtx.isDemoUser ? undefined : authCtx.organizationId;

    // 4 a 12. Ejecutar flujo seguro en TraceabilityService
    const result = await traceabilityService.assignFeed(validatedData, authHeader, userOrgId);

    return NextResponse.json(
      {
        success: true,
        data: result.assignment,
        remaining_quantity_kg: result.remainingQuantityKg,
        is_duplicate: !!result.isDuplicate,
        message: result.isDuplicate
          ? "Idempotent response: assignment was already confirmed"
          : "Feed assignment verified and confirmed on blockchain",
      },
      { status: result.isDuplicate ? 200 : 201 }
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

    const message = error.message || "";
    const isInventoryError = message.toLowerCase().includes("insufficient");
    const isUnauthorized = message.toLowerCase().includes("unauthorized");
    const isConflict = message.toLowerCase().includes("conflict") || message.toLowerCase().includes("in progress");
    const isNotFound = message.toLowerCase().includes("not found");

    let statusCode = 500;
    if (isInventoryError) statusCode = 400;
    else if (isUnauthorized) statusCode = 403;
    else if (isConflict) statusCode = 409;
    else if (isNotFound) statusCode = 404;

    return NextResponse.json(
      {
        success: false,
        error: message || "Failed to process feed assignment",
      },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/feed-assignments
 * Lista las asignaciones de alimento con filtros opcionales
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const grainLotId = searchParams.get("grain_lot_id") || undefined;
    const cattleLotId = searchParams.get("cattle_lot_id") || undefined;

    const assignments = await traceabilityService.listFeedAssignments({
      grainLotId,
      cattleLotId,
    });

    return NextResponse.json({
      success: true,
      data: assignments,
      count: assignments.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to list feed assignments",
      },
      { status: 500 }
    );
  }
}
