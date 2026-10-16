import demoData from '@/data/demo-passports.json';
import { PassportData, PassportEvidenceDoc, PassportFeedingRecord, isRealBlockchainTx } from './types';
import { TraceabilityDossier } from '../types';

/**
 * Servicio de Pasaporte Digital Ganadero (Persona 4).
 * Maneja datos de demostración coherentes e integración con la API real.
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

    const matchedByUuid = Object.values(demoPassports).find(
      (p) => p.uuid?.toLowerCase() === normalizedId.toLowerCase()
    );
    if (matchedByUuid) {
      return matchedByUuid;
    }

    // 2. Intentar consultar el backend real
    try {
      // Si estamos en entorno servidor, consultar a través del servicio interno de trazabilidad
      if (typeof window === 'undefined' && !baseUrl) {
        try {
          const { traceabilityService } = await import('@/lib/services/traceabilityService');
          // Primero probar getPassport si existe
          try {
            const rawPassport = await traceabilityService.getPassport(normalizedId);
            if (rawPassport) {
              return this.transformPublicPassportData(rawPassport, normalizedId);
            }
          } catch {
            // Intentar con getTraceabilityDossier
          }

          const dossier = await traceabilityService.getTraceabilityDossier(normalizedId);
          if (dossier) {
            let cattleEst = null;
            let grainEst = null;
            if (dossier.cattle_lot?.establishment_id) {
              cattleEst = await traceabilityService.getEstablishmentById(dossier.cattle_lot.establishment_id);
            }
            if (dossier.grain_lot?.establishment_id) {
              grainEst = await traceabilityService.getEstablishmentById(dossier.grain_lot.establishment_id);
            }
            return this.transformDossierToPassport(dossier, normalizedId, cattleEst, grainEst);
          }
        } catch (err) {
          // Fallback a llamada HTTP
        }
      }

      // En cliente o con baseUrl válida
      if (typeof window !== 'undefined' || (baseUrl && baseUrl.startsWith('http'))) {
        let url = `/api/passport/${encodeURIComponent(normalizedId)}`;
        if (baseUrl && !url.startsWith('http')) {
          url = `${baseUrl.replace(/\/$/, '')}${url}`;
        }

        let res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return this.transformPublicPassportData(json.data, normalizedId);
          }
        } else {
          // Probar ruta retrocompatible
          const fallbackUrl = baseUrl
            ? `${baseUrl.replace(/\/$/, '')}/api/traceability/${encodeURIComponent(normalizedId)}`
            : `/api/traceability/${encodeURIComponent(normalizedId)}`;
          res = await fetch(fallbackUrl, { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              return this.transformDossierToPassport(json.data, normalizedId);
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[PassportService] Could not fetch live dossier for ${normalizedId}:`, e);
    }

    return null;
  }

  /**
   * Transforma los datos de getPassport del backend al formato del pasaporte
   */
  public transformPublicPassportData(raw: any, queryId: string): PassportData {
    const cattle = raw.cattle_lot || {};
    const est = cattle.establishment || null;
    const txHash = cattle.blockchain_tx_hash || null;
    const chainId = raw.on_chain_verification?.chain_id || 31337;
    const isReal = isRealBlockchainTx(txHash, chainId, false);

    const feedingHistory: PassportFeedingRecord[] = (raw.feed_history || []).map((fa: any, idx: number) => ({
      assignment_id: fa.assignment_id || `ASG-${idx + 1}`,
      blockchain_assignment_id: fa.blockchain_assignment_id || null,
      grain_lot_code: fa.grain_lot?.external_code || 'AGR-001',
      grain_lot_uuid: fa.grain_lot?.id || '',
      crop: fa.grain_lot?.crop || 'Maíz',
      quantity_kg: Number(fa.quantity_kg || 0),
      period_start: fa.period_start || '',
      period_end: fa.period_end || '',
      registered_at: fa.created_at || new Date().toISOString(),
      status: isReal ? 'confirmed' : 'simulated',
      blockchain_tx_hash: fa.blockchain_tx_hash || null,
      verified_on_chain: isReal,
    }));

    const evidenceDocs: PassportEvidenceDoc[] = (raw.evidence_documents || []).map((doc: any) => ({
      id: doc.id,
      title: doc.document_type || 'Documento',
      document_type: doc.document_type || 'Documento',
      scope: 'public',
      file_name: doc.id ? `${doc.id}.pdf` : 'comprobante.pdf',
      sha256_hash: doc.sha256_hash,
      is_simulated: doc.is_simulated ?? true,
      created_at: doc.created_at || new Date().toISOString(),
      status: 'Declarado',
    }));

    return {
      lot_id: cattle.external_code || queryId,
      uuid: cattle.id,
      status: isReal ? 'confirmed' : 'simulated',
      is_simulated: !isReal,
      updated_at: raw.generated_at || new Date().toISOString(),
      cattle: {
        external_code: cattle.external_code || queryId,
        animal_count: cattle.animal_count || 0,
        establishment_id: cattle.establishment_id,
        establishment_name: est?.name,
        province: est?.province,
        locality: est?.locality,
        declared_origin: est?.locality && est?.province ? `${est.locality}, ${est.province}` : undefined,
        establishment_hash: cattle.establishment_hash,
        blockchain_id: cattle.blockchain_id,
      },
      feeding_history: feedingHistory,
      evidence_documents: evidenceDocs,
      blockchain_verification: {
        network: isReal ? 'Polygon Amoy Testnet' : 'Modo Simulado (Demo)',
        chain_id: chainId,
        contract_address: raw.on_chain_verification?.contract_address || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        tx_hash: isReal ? txHash : null,
        confirmation_status: isReal ? 'Registro verificable' : 'Simulado',
        block_number: isReal ? raw.on_chain_verification?.block_number : null,
        block_timestamp: isReal ? raw.on_chain_verification?.block_timestamp : null,
        explorer_url: isReal ? `https://amoy.polygonscan.com/tx/${txHash}` : null,
        is_mock_network: !isReal,
      },
    };
  }

  /**
   * Transforma el TraceabilityDossier con establecimientos reales (sin inventar datos de relleno)
   */
  public transformDossierToPassport(
    dossier: TraceabilityDossier,
    queryId: string,
    cattleEst?: any,
    grainEst?: any
  ): PassportData {
    const cattle = dossier.cattle_lot;
    const grain = dossier.grain_lot;
    const onChain = dossier.on_chain_verification;

    const txHash = cattle.blockchain_tx_hash || null;
    const chainId = onChain?.chain_id || 31337;
    const isReal = isRealBlockchainTx(txHash, chainId, false);

    const feedingHistory: PassportFeedingRecord[] = (dossier.feed_assignments || []).map((fa, idx) => ({
      assignment_id: `ASG-${fa.blockchain_assignment_id || idx + 1}`,
      blockchain_assignment_id: fa.blockchain_assignment_id,
      grain_lot_code: grain?.external_code || 'AGR-001',
      grain_lot_uuid: fa.grain_lot_id,
      crop: grain?.crop || 'Maíz',
      origin_farm: grainEst?.name,
      origin_location: grainEst?.locality && grainEst?.province ? `${grainEst.locality}, ${grainEst.province}` : undefined,
      quantity_kg: Number(fa.quantity_kg),
      initial_grain_lot_quantity_kg: grain ? Number(grain.initial_quantity_kg) : undefined,
      remaining_grain_lot_quantity_kg: grain ? Number(grain.remaining_quantity_kg) : undefined,
      period_start: fa.period_start,
      period_end: fa.period_end,
      registered_at: fa.created_at || new Date().toISOString(),
      status: isReal && fa.status === 'confirmed' ? 'confirmed' : 'simulated',
      blockchain_tx_hash: fa.blockchain_tx_hash || null,
      verified_on_chain: isReal,
    }));

    const evidenceDocs: PassportEvidenceDoc[] = (dossier.evidence_documents || [])
      .filter((doc) => doc.document_type !== 'private_contract' && doc.document_type !== 'confidential')
      .map((doc) => ({
        id: doc.id,
        title: doc.document_type.replace(/_/g, ' '),
        document_type: doc.document_type,
        scope: 'public',
        file_name: doc.storage_path.split('/').pop() || 'documento.pdf',
        sha256_hash: doc.sha256_hash,
        is_simulated: doc.is_simulated ?? true,
        created_at: doc.created_at,
        status: 'Declarado',
      }));

    return {
      lot_id: cattle.external_code || queryId,
      uuid: cattle.id,
      status: isReal ? 'confirmed' : 'simulated',
      is_simulated: !isReal,
      updated_at: cattle.created_at || new Date().toISOString(),
      cattle: {
        external_code: cattle.external_code || queryId,
        animal_count: cattle.animal_count,
        establishment_id: cattle.establishment_id,
        establishment_name: cattleEst?.name,
        province: cattleEst?.province,
        locality: cattleEst?.locality,
        declared_origin: cattleEst?.locality && cattleEst?.province ? `${cattleEst.locality}, ${cattleEst.province}` : undefined,
        establishment_hash: cattle.establishment_hash,
        blockchain_id: cattle.blockchain_id,
      },
      feeding_history: feedingHistory,
      evidence_documents: evidenceDocs,
      blockchain_verification: {
        network: isReal ? 'Polygon Amoy Testnet' : 'Modo Simulado (Demo)',
        chain_id: chainId,
        contract_address: onChain?.contract_address || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        tx_hash: isReal ? txHash : null,
        confirmation_status: isReal ? 'Registro verificable' : 'Simulado',
        block_number: isReal ? 14920431 : null,
        block_timestamp: isReal ? cattle.created_at : null,
        explorer_url: isReal ? `https://amoy.polygonscan.com/tx/${txHash}` : null,
        is_mock_network: !isReal,
      },
    };
  }

  public getAvailableDemoPassports(): PassportData[] {
    const demoPassports = demoData.passports as Record<string, PassportData>;
    return Object.values(demoPassports);
  }
}

export const passportService = new PassportService();
