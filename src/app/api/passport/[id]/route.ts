import { NextRequest, NextResponse } from "next/server";
import { traceabilityService } from "@/lib/services/traceabilityService";

export const dynamic = "force-dynamic";

/**
 * GET /api/passport/[id]
 * Endpoint público para generación y lectura del Pasaporte Digital de Trazabilidad.
 * Diseñado específicamente para Persona 4 y consumidores que escanean el código QR.
 *
 * Filtra y devuelve EXCLUSIVAMENTE información autorizada para consulta pública:
 * - Identificación y conteo del rodeo
 * - Ubicación del establecimiento (provincia, localidad) sin coordenadas privadas sensibles
 * - Cadena completa de raciones de grano consumidas (cultivo, fechas, kg)
 * - Referencias criptográficas on-chain (txHash, blockchain ID, contrato, chainId)
 * - Hashes SHA-256 de certificados de calidad y cartas de porte
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const passportId = params.id;
    if (!passportId) {
      return NextResponse.json(
        { success: false, error: "Missing passport ID parameter" },
        { status: 400 }
      );
    }

    const passport = await traceabilityService.getPassport(passportId);

    return NextResponse.json({
      success: true,
      data: passport,
      disclaimer: "Información verificada matemáticamente en la blockchain EVM de AgroChain FeedTrace. Las evidencias físicas corresponden a documentos auditados con hash SHA-256.",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve passport",
      },
      { status: error.message?.includes("not found") ? 404 : 500 }
    );
  }
}
