import demoData from '@/data/demo-passports.json';
import { PassportData, PassportEvidenceDoc, PassportFeedingRecord } from './types';
import { TraceabilityDossier } from '../types';

/**
 * Servicio de Pasaporte Digital Ganadero (Persona 4).
 * Permite trabajar de forma autónoma con datos mock reproducibles para la demo
 * e integrarse con el endpoint de trazabilidad /api/traceability/[id]
 */
export class PassportService {
  /**
   * Obtiene los datos del pasaporte por identificador de lote (ej: GAN-001 o UUID)
   */
  public async getPassport(lotId: string, baseUrl?: string): Promise<PassportData | null> {
    const normalizedId = (lotId || '').trim();
    const upperId = normalizedId.toUpperCase();

    // 1. Verificar si coincide con datos de demostración predefinidos
    const demoPassports = demoData.passports as Record<string, PassportData>;
    if (demoPassports[upperId]) {
      return demoPassports[upperId];
    }

    // Buscar si algún demo passport tiene ese UUID
    const matchedByUuid = Object.values(demoPassports).find(
      (p) => p.uuid?.toLowerCase() === normalizedId.toLowerCase()
    );
    if (matchedByUuid) {
      return matchedByUuid;
    }

    // 2. Intentar consultar el backend de integración /api/traceability/[id]
    try {
      let url = `/api/traceability/${encodeURIComponent(normalizedId)}`;
      if (baseUrl && !url.startsWith('http')) {
        url = `${baseUrl.replace(/\/$/, '')}${url}`;
      }

      // Si se ejecuta en entorno servidor sin baseUrl, usar import dinámico del servicio si está disponible
      if (typeof window === 'undefined' && !baseUrl) {
        try {
          const { traceabilityService } = await import('@/lib/services/traceabilityService');
          const dossier = await traceabilityService.getTraceabilityDossier(normalizedId);
          if (dossier) {
            return this.transformDossierToPassport(dossier, normalizedId);
          }
        } catch {
          // Fallback a fetch o mock
        }
      }

      if (typeof window !== 'undefined' || baseUrl) {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return this.transformDossierToPassport(json.data, normalizedId);
          }
        }
      }
    } catch (e) {
      console.warn(`[PassportService] Could not fetch live dossier for ${normalizedId}:`, e);
    }

    return null;
  }

  /**
   * Transforma el TraceabilityDossier provisto por Persona 1 / Persona 3 a la interfaz de Pasaporte Digital
   */
  public transformDossierToPassport(dossier: TraceabilityDossier, queryId: string): PassportData {
    const cattle = dossier.cattle_lot;
    const grain = dossier.grain_lot;
    const onChain = dossier.on_chain_verification;

    const feedingHistory: PassportFeedingRecord[] = (dossier.feed_assignments || []).map((fa, idx) => ({
      assignment_id: `ASG-${fa.blockchain_assignment_id || idx + 1}`,
      blockchain_assignment_id: fa.blockchain_assignment_id,
      grain_lot_code: grain?.external_code || 'GRANO-REF',
      grain_lot_uuid: fa.grain_lot_id,
      crop: grain?.crop || 'Alimento balanceado',
      origin_farm: 'Establecimiento Agrícola Asociado',
      origin_location: 'Región NEA',
      quantity_kg: Number(fa.quantity_kg),
      initial_grain_lot_quantity_kg: Number(grain?.initial_quantity_kg || 0),
      remaining_grain_lot_quantity_kg: Number(grain?.remaining_quantity_kg || 0),
      period_start: fa.period_start,
      period_end: fa.period_end,
      registered_at: fa.created_at || new Date().toISOString(),
      status: fa.status === 'confirmed' ? 'confirmed' : 'pending',
      blockchain_tx_hash: fa.blockchain_tx_hash,
      verified_on_chain: !!fa.blockchain_assignment_id,
    }));

    // Filtrar estrictamente solo documentos públicos autorizados
    const evidenceDocs: PassportEvidenceDoc[] = (dossier.evidence_documents || [])
      .filter((doc) => doc.document_type !== 'private_contract' && doc.document_type !== 'confidential')
      .map((doc) => ({
        id: doc.id,
        title: doc.document_type.replace(/_/g, ' ').toUpperCase(),
        document_type: doc.document_type,
        scope: 'public',
        file_name: doc.storage_path.split('/').pop() || 'documento.pdf',
        sha256_hash: doc.sha256_hash,
        is_simulated: doc.is_simulated ?? true,
        created_at: doc.created_at,
        status: 'Comprobante técnico registrado',
      }));

    const txHash = cattle.blockchain_tx_hash || (feedingHistory[0]?.blockchain_tx_hash) || null;
    const isMock = !txHash || txHash.startsWith('0xmock') || txHash.length < 60;

    return {
      lot_id: cattle.external_code || queryId,
      uuid: cattle.id,
      status: cattle.status === 'confirmed' ? 'confirmed' : 'pending',
      is_simulated: isMock,
      updated_at: cattle.created_at || new Date().toISOString(),
      cattle: {
        external_code: cattle.external_code || queryId,
        animal_count: cattle.animal_count,
        species: 'Bovino para Producción de Carne',
        establishment_name: 'Establecimiento Registrado en AgroChain',
        renspa_declared: 'RENSPA Registrado',
        establishment_hash: cattle.establishment_hash,
        province: 'Corrientes',
        locality: 'NEA',
        declared_origin: 'Lote Ganadero Declarado',
        category: 'Invernada / Feedlot',
        blockchain_id: cattle.blockchain_id,
      },
      feeding_history: feedingHistory,
      evidence_documents: evidenceDocs,
      regulatory_compliance_notes: [
        {
          standard: 'Trazabilidad de Alimentación y Control Anti Double-Spending',
          status: onChain?.balance_integrity_verified ? 'Registro blockchain confirmado' : 'Pendiente',
          detail: 'Balance verificado en Smart Contract entre lote agrícola y lote ganadero.',
        },
        {
          standard: 'Verificación Satelital de Deforestación / EUDR',
          status: 'Pendiente de auditoría',
          detail: 'Nota de transparencia: Este lote no cuenta con certificación de libre de deforestación comprobada.',
        },
      ],
      blockchain_verification: {
        network: onChain?.chain_id === 80002 ? 'Polygon Amoy Testnet' : 'EVM Smart Contract',
        chain_id: onChain?.chain_id || 80002,
        contract_address: onChain?.contract_address || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        tx_hash: txHash,
        confirmation_status: cattle.status === 'confirmed' ? 'Confirmado on-chain' : 'Pendiente',
        block_number: 14920431,
        block_timestamp: cattle.created_at,
        explorer_url: txHash && !isMock ? `https://amoy.polygonscan.com/tx/${txHash}` : null,
        is_mock_network: isMock,
      },
    };
  }

  /**
   * Obtiene la lista de todos los pasaportes demo disponibles
   */
  public getAvailableDemoPassports(): PassportData[] {
    const demoPassports = demoData.passports as Record<string, PassportData>;
    return Object.values(demoPassports);
  }
}

export const passportService = new PassportService();
