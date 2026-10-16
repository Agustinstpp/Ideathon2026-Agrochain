import { NextRequest, NextResponse } from "next/server";
import { CreateFeedAssignmentSchema } from "@/lib/schemas/traceability";
import { traceabilityService } from "@/lib/services/traceabilityService";

export const dynamic = "force-dynamic";

/**
 * POST /api/feed-assignments
 * Asigna alimento de un lote agrícola a un lote ganadero de forma verificable on-chain.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CreateFeedAssignmentSchema.parse(body);

    const authHeader = req.headers.get("Authorization");
    const userOrgId = req.headers.get("x-organization-id") || undefined;

    const result = await traceabilityService.assignFeed(validatedData, authHeader, userOrgId);

    return NextResponse.json(
      {
        success: true,
        data: result.assignment,
        remaining_quantity_kg: result.remainingQuantityKg,
        message: "Feed assignment verified and confirmed on blockchain",
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

    const isInventoryError = error.message?.toLowerCase().includes("insufficient");
    const isUnauthorized = error.message?.toLowerCase().includes("unauthorized");

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process feed assignment",
      },
      { status: isInventoryError ? 400 : isUnauthorized ? 403 : 500 }
    );
  }
}

/**
 * GET /api/feed-assignments
 * Lista el historial de asignaciones de alimento
 */
export async function GET(req: NextRequest) {
  try {
    const assignments = await traceabilityService.listFeedAssignments();

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
