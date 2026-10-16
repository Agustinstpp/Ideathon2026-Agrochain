import { NextRequest, NextResponse } from "next/server";
import { traceabilityService } from "@/lib/services/traceabilityService";

export const dynamic = "force-dynamic";

/**
 * GET /api/feed-assignments/[id]
 * Consulta los datos de una asignación específica por ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    const assignment = await traceabilityService.getFeedAssignmentById(assignmentId);

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: `Feed assignment not found with ID ${assignmentId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assignment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve feed assignment" },
      { status: 500 }
    );
  }
}
