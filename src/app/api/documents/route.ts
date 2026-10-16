import { NextRequest, NextResponse } from "next/server";
import { CreateEvidenceDocumentSchema } from "@/lib/schemas/traceability";
import { traceabilityService } from "@/lib/services/traceabilityService";
import { authenticateRequest, authorizeOrganization } from "@/lib/auth/authHelper";
import { calculateSha256 } from "@/lib/utils/hash";

export const dynamic = "force-dynamic";

/**
 * POST /api/documents
 * Registra o sube un documento de evidencia (carta de porte, análisis de laboratorio, etc.)
 * y calcula/valida el hash SHA-256 exacto de los bytes.
 */
export async function POST(req: NextRequest) {
  try {
    const authCtx = await authenticateRequest(req);
    const contentType = req.headers.get("content-type") || "";

    let inputData: any;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const organizationId = (formData.get("organization_id") as string) || authCtx.organizationId;
      const establishmentId = formData.get("establishment_id") as string | null;
      const grainLotId = formData.get("grain_lot_id") as string | null;
      const cattleLotId = formData.get("cattle_lot_id") as string | null;
      const documentType = (formData.get("document_type") as string) || "documento_respaldo";

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file provided in form-data" },
          { status: 400 }
        );
      }

      // Calcular hash SHA-256 sobre los bytes exactos
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const sha256Hash = calculateSha256(buffer);

      inputData = {
        organization_id: organizationId,
        establishment_id: establishmentId,
        grain_lot_id: grainLotId,
        cattle_lot_id: cattleLotId,
        document_type: documentType,
        storage_path: `evidence-documents/${organizationId}/${file.name}`,
        sha256_hash: sha256Hash,
        is_simulated: true, // Archivos del MVP identificados como simulados
      };
    } else {
      const body = await req.json();
      if (!body.organization_id && authCtx.organizationId) {
        body.organization_id = authCtx.organizationId;
      }
      inputData = body;
    }

    const validatedData = CreateEvidenceDocumentSchema.parse(inputData);

    if (!authCtx.isDemoUser) {
      authorizeOrganization(authCtx, validatedData.organization_id);
    }

    const doc = await traceabilityService.createEvidenceDocument(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: doc,
        message: "Evidence document registered with cryptographic SHA-256 verification",
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
        error: error.message || "Failed to register evidence document",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents
 * Lista documentos de evidencia autorizados
 */
export async function GET(req: NextRequest) {
  try {
    const authCtx = await authenticateRequest(req);
    const searchParams = req.nextUrl.searchParams;
    const organizationId = searchParams.get("organization_id") || authCtx.organizationId;
    const lotId = searchParams.get("lot_id") || undefined;

    const documents = await traceabilityService.listEvidenceDocuments(organizationId, lotId);

    return NextResponse.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to list evidence documents",
      },
      { status: 500 }
    );
  }
}
