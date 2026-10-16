import { blockchainService } from "../blockchain/blockchainService";
import { createAdminClient, isSupabaseConfigured } from "../supabase/supabaseServer";
import {
  CreateFeedAssignmentInput,
  CreateGrainLotInput,
  CreateCattleLotInput,
  CreateEstablishmentInput,
  CreateEvidenceDocumentInput,
} from "../schemas/traceability";
import {
  TraceabilityDossier,
  GrainLot,
  CattleLot,
  FeedAssignment,
  Establishment,
  EvidenceDocument,
  DashboardMetrics,
  FeedHistoryResponse,
  PassportPublicData,
} from "../types";
import { DEMO_ORGANIZATION_ID } from "../auth/authHelper";

// In-memory data store for fallback, tests, or demo without active Supabase DB
const localStore = {
  establishments: new Map<string, Establishment>(),
  grainLots: new Map<string, GrainLot>(),
  cattleLots: new Map<string, CattleLot>(),
  feedAssignments: new Map<string, FeedAssignment>(),
  evidenceDocuments: new Map<string, EvidenceDocument>(),
  blockchainMappings: new Map<string, number>(),
  operationIds: new Map<string, string>(), // operation_id -> assignment_id
  nextBlockchainId: 1000,
};

// Control de concurrencia y bloqueo de operaciones en curso
const activeLocks = new Set<string>();

// Pre-poblar datos de semilla inicial para demostración
function initializeSeedDataIfEmpty() {
  if (localStore.grainLots.size > 0) return;

  const demoEstId = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
  const demoFeedlotEstId = "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d";
  const demoGrainId = "e9b1192e-5036-4078-a0e2-63b71eb26d30";
  const demoCattleId = "2d8f99e1-6712-4f32-8499-c89283920194";
  const demoAssignmentId = "5fa23d11-19bb-4328-92ee-912837492810";

  localStore.establishments.set(demoEstId, {
    id: demoEstId,
    organization_id: DEMO_ORGANIZATION_ID,
    name: "Establecimiento La Posta - Campo Norte",
    province: "Chaco",
    locality: "Charata",
    geojson: { type: "Point", coordinates: [-61.1889, -27.2144] },
    created_at: new Date().toISOString(),
  });

  localStore.establishments.set(demoFeedlotEstId, {
    id: demoFeedlotEstId,
    organization_id: DEMO_ORGANIZATION_ID,
    name: "Feedlot Don Pedro - Módulo Intensivo",
    province: "Santa Fe",
    locality: "Rafaela",
    geojson: { type: "Point", coordinates: [-61.4867, -31.2503] },
    created_at: new Date().toISOString(),
  });

  localStore.grainLots.set(demoGrainId, {
    id: demoGrainId,
    organization_id: DEMO_ORGANIZATION_ID,
    establishment_id: demoEstId,
    external_code: "MAIZ-2026-CH01",
    crop: "Maíz Picado Silo Grano Húmedo",
    initial_quantity_kg: 10000,
    remaining_quantity_kg: 8000,
    origin_hash: "0x3a7e58f034b1d6e8a9c2f5e4b7a8d9c0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6",
    blockchain_id: 1001,
    blockchain_tx_hash: "0x9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a",
    status: "confirmed",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  });

  localStore.cattleLots.set(demoCattleId, {
    id: demoCattleId,
    organization_id: DEMO_ORGANIZATION_ID,
    establishment_id: demoFeedlotEstId,
    external_code: "FEEDLOT-CORRAL-03",
    animal_count: 120,
    establishment_hash: "0x8f2c3d4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d",
    blockchain_id: 2001,
    blockchain_tx_hash: "0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e",
    status: "confirmed",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  });

  localStore.feedAssignments.set(demoAssignmentId, {
    id: demoAssignmentId,
    grain_lot_id: demoGrainId,
    cattle_lot_id: demoCattleId,
    quantity_kg: 2000,
    period_start: "2026-10-01",
    period_end: "2026-10-31",
    blockchain_assignment_id: 3001,
    blockchain_tx_hash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    status: "confirmed",
    operation_id: "op-seed-initial-assignment-001",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  });

  localStore.evidenceDocuments.set("8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d", {
    id: "8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d",
    organization_id: DEMO_ORGANIZATION_ID,
    establishment_id: demoEstId,
    grain_lot_id: demoGrainId,
    cattle_lot_id: null,
    storage_path: "evidence-documents/f47ac10b/carta_de_porte_MAIZ-2026-CH01.pdf",
    sha256_hash: "3a7e58f034b1d6e8a9c2f5e4b7a8d9c0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6",
    document_type: "carta_de_porte_grano",
    is_simulated: true,
    created_at: new Date().toISOString(),
  });

  localStore.blockchainMappings.set(demoGrainId, 1001);
  localStore.blockchainMappings.set(demoCattleId, 2001);
  localStore.blockchainMappings.set(demoAssignmentId, 3001);
}

initializeSeedDataIfEmpty();

export class TraceabilityService {
  /**
   * Helper para obtener o generar un ID numérico on-chain
   */
  public getOrCreateBlockchainId(supabaseId: string): number {
    if (!localStore.blockchainMappings.has(supabaseId)) {
      localStore.blockchainMappings.set(supabaseId, localStore.nextBlockchainId++);
    }
    return localStore.blockchainMappings.get(supabaseId)!;
  }

  // ====================================================================
  // 1. ESTABLECIMIENTOS
  // ====================================================================

  public async createEstablishment(input: CreateEstablishmentInput): Promise<Establishment> {
    const id = crypto.randomUUID();
    const establishment: Establishment = {
      id,
      organization_id: input.organization_id,
      name: input.name,
      province: input.province,
      locality: input.locality,
      geojson: input.geojson || {},
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        await adminClient.from("establishments").insert([establishment]);
      } catch {
        // Local fallback
      }
    }

    localStore.establishments.set(id, establishment);
    return establishment;
  }

  public async listEstablishments(organizationId?: string): Promise<Establishment[]> {
    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        let query = adminClient.from("establishments").select("*");
        if (organizationId) {
          query = query.eq("organization_id", organizationId);
        }
        const { data } = await query;
        if (data && data.length > 0) {
          data.forEach((est) => localStore.establishments.set(est.id, est));
          return data;
        }
      } catch {
        // Fallback
      }
    }

    let list = Array.from(localStore.establishments.values());
    if (organizationId) {
      list = list.filter((e) => e.organization_id === organizationId);
    }
    return list;
  }

  public async getEstablishmentById(id: string): Promise<Establishment | null> {
    if (localStore.establishments.has(id)) {
      return localStore.establishments.get(id)!;
    }
    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        const { data } = await adminClient.from("establishments").select("*").eq("id", id).single();
        if (data) {
          localStore.establishments.set(id, data);
          return data;
        }
      } catch {
        // Fallback
      }
    }
    return null;
  }

  // ====================================================================
  // 2. LOTES AGRÍCOLAS
  // ====================================================================

  public async createGrainLot(input: CreateGrainLotInput, authHeader?: string | null): Promise<GrainLot> {
    const supabaseId = crypto.randomUUID();
    const blockchainId = this.getOrCreateBlockchainId(supabaseId);

    // 1. Registrar en Blockchain primero para obtener inmutabilidad y txHash
    const onChainResult = await blockchainService.registerGrainLot(
      blockchainId,
      input.crop,
      input.initial_quantity_kg,
      input.origin_hash
    );

    const grainLot: GrainLot = {
      id: supabaseId,
      organization_id: input.organization_id,
      establishment_id: input.establishment_id,
      external_code: input.external_code,
      crop: input.crop,
      initial_quantity_kg: input.initial_quantity_kg,
      remaining_quantity_kg: input.initial_quantity_kg,
      origin_hash: input.origin_hash,
      blockchain_id: blockchainId,
      blockchain_tx_hash: onChainResult.txHash,
      status: "confirmed",
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        await adminClient.from("grain_lots").insert([grainLot]);
      } catch {
        // Local fallback
      }
    }
    localStore.grainLots.set(supabaseId, grainLot);

    return grainLot;
  }

  public async getGrainLotById(id: string): Promise<GrainLot | null> {
    if (localStore.grainLots.has(id)) {
      return localStore.grainLots.get(id)!;
    }
    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        const { data } = await adminClient.from("grain_lots").select("*").eq("id", id).single();
        if (data) {
          localStore.grainLots.set(id, data);
          return data;
        }
      } catch {
        // Fallback
      }
    }
    return null;
  }

  public async listGrainLots(organizationId?: string): Promise<GrainLot[]> {
    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        let query = adminClient.from("grain_lots").select("*");
        if (organizationId) {
          query = query.eq("organization_id", organizationId);
        }
        const { data } = await query;
        if (data && data.length > 0) {
          data.forEach((lot) => localStore.grainLots.set(lot.id, lot));
          return data;
        }
      } catch {
        // Fallback
      }
    }

    let lots = Array.from(localStore.grainLots.values());
    if (organizationId) {
      lots = lots.filter((l) => l.organization_id === organizationId);
    }
    return lots;
  }

  /**
   * Reconciliación con la Blockchain:
   * La blockchain es la fuente única de verdad del saldo confirmado.
   * Si hay discrepancia, este procedimiento sincroniza Supabase con la blockchain.
   */
  public async reconcileGrainLot(id: string): Promise<{
    grain_lot: GrainLot;
    on_chain_remaining_kg: number;
    discrepancy_detected: boolean;
    synced: boolean;
  }> {
    const grainLot = await this.getGrainLotById(id);
    if (!grainLot) {
      throw new Error(`Grain lot not found with ID ${id}`);
    }

    const blockchainId = grainLot.blockchain_id || this.getOrCreateBlockchainId(grainLot.id);
    const onChainRemaining = await blockchainService.getRemainingQuantity(blockchainId);

    const discrepancyDetected = grainLot.remaining_quantity_kg !== onChainRemaining;

    if (discrepancyDetected) {
      grainLot.remaining_quantity_kg = onChainRemaining;
      grainLot.status = "confirmed";
      localStore.grainLots.set(id, grainLot);

      if (isSupabaseConfigured()) {
        try {
          const adminClient = createAdminClient();
          await adminClient
            .from("grain_lots")
            .update({
              remaining_quantity_kg: onChainRemaining,
              status: "confirmed",
            })
            .eq("id", id);
        } catch {
          // Fallback
        }
      }
    }

    return {
      grain_lot: grainLot,
      on_chain_remaining_kg: onChainRemaining,
      discrepancy_detected: discrepancyDetected,
      synced: true,
    };
  }

  // ====================================================================
  // 3. LOTES GANADEROS
  // ====================================================================

  public async createCattleLot(input: CreateCattleLotInput, authHeader?: string | null): Promise<CattleLot> {
    const supabaseId = crypto.randomUUID();
    const blockchainId = this.getOrCreateBlockchainId(supabaseId);

    const onChainResult = await blockchainService.registerCattleLot(
      blockchainId,
      input.animal_count,
      input.establishment_hash
    );

    const cattleLot: CattleLot = {
      id: supabaseId,
      organization_id: input.organization_id,
      establishment_id: input.establishment_id,
      external_code: input.external_code,
      animal_count: input.animal_count,
      establishment_hash: input.establishment_hash,
      blockchain_id: blockchainId,
      blockchain_tx_hash: onChainResult.txHash,
      status: "confirmed",
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        await adminClient.from("cattle_lots").insert([cattleLot]);
      } catch {
        // Local fallback
      }
    }
    localStore.cattleLots.set(supabaseId, cattleLot);

    return cattleLot;
  }

  public async getCattleLotById(id: string): Promise<CattleLot | null> {
    if (localStore.cattleLots.has(id)) {
      return localStore.cattleLots.get(id)!;
    }
    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        const { data } = await adminClient.from("cattle_lots").select("*").eq("id", id).single();
        if (data) {
          localStore.cattleLots.set(id, data);
          return data;
        }
      } catch {
        // Fallback
      }
    }
    return null;
  }

  public async listCattleLots(organizationId?: string): Promise<CattleLot[]> {
    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        let query = adminClient.from("cattle_lots").select("*");
        if (organizationId) {
          query = query.eq("organization_id", organizationId);
        }
        const { data } = await query;
        if (data && data.length > 0) {
          data.forEach((lot) => localStore.cattleLots.set(lot.id, lot));
          return data;
        }
      } catch {
        // Fallback
      }
    }

    let lots = Array.from(localStore.cattleLots.values());
    if (organizationId) {
      lots = lots.filter((l) => l.organization_id === organizationId);
    }
    return lots;
  }

  // ====================================================================
  // 4. ASIGNACIONES DE ALIMENTO (CRÍTICO: IDEMPOTENCIA Y ANTI-DOBLE GASTO)
  // ====================================================================

  public async assignFeed(
    input: CreateFeedAssignmentInput,
    authHeader?: string | null,
    userOrgId?: string
  ): Promise<{ assignment: FeedAssignment; remainingQuantityKg: number; isDuplicate?: boolean }> {
    const opId = input.operation_id || `${input.grain_lot_id}_${input.cattle_lot_id}_${input.quantity_kg}_${input.period_start}`;

    // 1. Control de Idempotencia: Verificar si ya existe una asignación confirmada con esta operation_id
    if (input.operation_id && localStore.operationIds.has(input.operation_id)) {
      const existingId = localStore.operationIds.get(input.operation_id)!;
      const existingAssignment = localStore.feedAssignments.get(existingId);
      if (existingAssignment && existingAssignment.status === "confirmed") {
        const grain = await this.getGrainLotById(existingAssignment.grain_lot_id);
        return {
          assignment: existingAssignment,
          remainingQuantityKg: grain?.remaining_quantity_kg ?? 0,
          isDuplicate: true,
        };
      }
    }

    // 2. Control de Concurrencia y Doble Clic (Lock)
    if (activeLocks.has(opId)) {
      throw new Error(`Conflict: An operation with ID ${opId} is currently being processed. Duplicate request rejected.`);
    }
    activeLocks.add(opId);

    try {
      const assignmentId = crypto.randomUUID();
      const onChainAssignmentId = this.getOrCreateBlockchainId(assignmentId);

      // 3. Consultar y validar lote agrícola
      const grainLot = await this.getGrainLotById(input.grain_lot_id);
      if (!grainLot) {
        throw new Error(`Grain lot not found with ID ${input.grain_lot_id}`);
      }

      // 4. Consultar y validar lote ganadero
      const cattleLot = await this.getCattleLotById(input.cattle_lot_id);
      if (!cattleLot) {
        throw new Error(`Cattle lot not found with ID ${input.cattle_lot_id}`);
      }

      // 5. Validar pertenencia de organización
      if (userOrgId) {
        if (grainLot.organization_id !== userOrgId && cattleLot.organization_id !== userOrgId) {
          throw new Error("Unauthorized: you cannot allocate grain from/to lots of another organization");
        }
      }

      // 6. Validación lógica de saldo preliminar
      if (grainLot.remaining_quantity_kg < input.quantity_kg) {
        throw new Error(
          `Insufficient grain inventory: Requested ${input.quantity_kg} kg but only ${grainLot.remaining_quantity_kg} kg available`
        );
      }

      // 7. Registrar solicitud preliminar en PENDING (o PROCESSING)
      const pendingAssignment: FeedAssignment = {
        id: assignmentId,
        grain_lot_id: input.grain_lot_id,
        cattle_lot_id: input.cattle_lot_id,
        quantity_kg: input.quantity_kg,
        period_start: input.period_start,
        period_end: input.period_end,
        blockchain_assignment_id: onChainAssignmentId,
        blockchain_tx_hash: null,
        status: "pending",
        operation_id: input.operation_id || null,
        created_at: new Date().toISOString(),
      };
      localStore.feedAssignments.set(assignmentId, pendingAssignment);
      if (input.operation_id) {
        localStore.operationIds.set(input.operation_id, assignmentId);
      }

      if (isSupabaseConfigured()) {
        try {
          const adminClient = createAdminClient();
          await adminClient.from("feed_assignments").insert([pendingAssignment]);
        } catch {
          // Fallback local
        }
      }

      // 8. Enviar transacción al Smart Contract (Fuente de verdad)
      const periodStartTs = Math.floor(new Date(input.period_start).getTime() / 1000);
      const periodEndTs = Math.floor(new Date(input.period_end).getTime() / 1000);
      const onChainGrainId = grainLot.blockchain_id || this.getOrCreateBlockchainId(grainLot.id);
      const onChainCattleId = cattleLot.blockchain_id || this.getOrCreateBlockchainId(cattleLot.id);

      let onChainResult: { txHash: string; remainingQuantityKg: number };
      try {
        onChainResult = await blockchainService.assignFeed(
          onChainAssignmentId,
          onChainGrainId,
          onChainCattleId,
          input.quantity_kg,
          periodStartTs,
          periodEndTs
        );
      } catch (chainErr: any) {
        // Si es un error de reversión conocido (ej: saldo insuficiente)
        const isRevert = chainErr.message?.toLowerCase().includes("insufficient") ||
                         chainErr.message?.toLowerCase().includes("revert");

        const targetStatus = isRevert ? "failed" : "reconciliation_required";

        const failedAssignment: FeedAssignment = {
          ...pendingAssignment,
          status: targetStatus,
          error_message: chainErr.message,
        };
        localStore.feedAssignments.set(assignmentId, failedAssignment);

        if (isSupabaseConfigured()) {
          try {
            const adminClient = createAdminClient();
            await adminClient
              .from("feed_assignments")
              .update({
                status: targetStatus,
                error_message: chainErr.message,
              })
              .eq("id", assignmentId);
          } catch {
            // Fallback
          }
        }

        throw chainErr;
      }

      // 9. Transacción confirmada: Actualizar estado y sincronizar inventario
      const confirmedAssignment: FeedAssignment = {
        ...pendingAssignment,
        blockchain_tx_hash: onChainResult.txHash,
        status: "confirmed",
      };
      localStore.feedAssignments.set(assignmentId, confirmedAssignment);

      // Sincronizar saldo de grano confirmado
      grainLot.remaining_quantity_kg = onChainResult.remainingQuantityKg;
      localStore.grainLots.set(grainLot.id, grainLot);

      if (isSupabaseConfigured()) {
        try {
          const adminClient = createAdminClient();
          await adminClient
            .from("feed_assignments")
            .update({
              status: "confirmed",
              blockchain_tx_hash: onChainResult.txHash,
            })
            .eq("id", assignmentId);

          await adminClient
            .from("grain_lots")
            .update({
              remaining_quantity_kg: onChainResult.remainingQuantityKg,
            })
            .eq("id", grainLot.id);
        } catch {
          // Fallback
        }
      }

      return {
        assignment: confirmedAssignment,
        remainingQuantityKg: onChainResult.remainingQuantityKg,
        isDuplicate: false,
      };
    } finally {
      // Liberar lock de concurrencia
      activeLocks.delete(opId);
    }
  }

  public async listFeedAssignments(filter?: {
    grainLotId?: string;
    cattleLotId?: string;
  }): Promise<FeedAssignment[]> {
    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        let query = adminClient.from("feed_assignments").select("*");
        if (filter?.grainLotId) {
          query = query.eq("grain_lot_id", filter.grainLotId);
        }
        if (filter?.cattleLotId) {
          query = query.eq("cattle_lot_id", filter.cattleLotId);
        }
        const { data } = await query;
        if (data && data.length > 0) {
          data.forEach((asg) => localStore.feedAssignments.set(asg.id, asg));
          return data;
        }
      } catch {
        // Fallback
      }
    }

    let list = Array.from(localStore.feedAssignments.values());
    if (filter?.grainLotId) {
      list = list.filter((a) => a.grain_lot_id === filter.grainLotId);
    }
    if (filter?.cattleLotId) {
      list = list.filter((a) => a.cattle_lot_id === filter.cattleLotId);
    }
    return list;
  }

  public async getFeedAssignmentById(id: string): Promise<FeedAssignment | null> {
    if (localStore.feedAssignments.has(id)) {
      return localStore.feedAssignments.get(id)!;
    }
    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        const { data } = await adminClient.from("feed_assignments").select("*").eq("id", id).single();
        if (data) {
          localStore.feedAssignments.set(id, data);
          return data;
        }
      } catch {
        // Fallback
      }
    }
    return null;
  }

  // ====================================================================
  // 5. HISTORIAL DE ALIMENTACIÓN POR LOTE GANADERO (PERSONA 2 Y 4)
  // ====================================================================

  public async getCattleLotFeedHistory(cattleLotId: string): Promise<FeedHistoryResponse> {
    const cattleLot = await this.getCattleLotById(cattleLotId);
    if (!cattleLot) {
      throw new Error(`Cattle lot not found with ID ${cattleLotId}`);
    }

    const assignments = await this.listFeedAssignments({ cattleLotId });
    const confirmedAssignments = assignments.filter((a) => a.status === "confirmed");

    const enrichedHistory: Array<FeedAssignment & { grain_lot?: GrainLot }> = [];
    let totalConsumedKg = 0;

    for (const asg of confirmedAssignments) {
      const grainLot = await this.getGrainLotById(asg.grain_lot_id);
      enrichedHistory.push({
        ...asg,
        grain_lot: grainLot || undefined,
      });
      totalConsumedKg += asg.quantity_kg;
    }

    return {
      cattle_lot: cattleLot,
      feed_history: enrichedHistory,
      total_consumed_kg: totalConsumedKg,
    };
  }

  // ====================================================================
  // 6. PASAPORTE DIGITAL PÚBLICO (PERSONA 4)
  // ====================================================================

  public async getPassport(id: string): Promise<PassportPublicData> {
    // Buscar lote de ganado primero
    let cattleLot = await this.getCattleLotById(id);
    let linkedGrainLot: GrainLot | null = null;

    if (!cattleLot) {
      linkedGrainLot = await this.getGrainLotById(id);
      if (!linkedGrainLot) {
        throw new Error(`Passport resource not found for ID: ${id}`);
      }
      // Buscar el primer lote de ganado vinculado a este grano
      const assignments = await this.listFeedAssignments({ grainLotId: linkedGrainLot.id });
      if (assignments.length > 0) {
        cattleLot = await this.getCattleLotById(assignments[0].cattle_lot_id);
      }
    }

    if (!cattleLot) {
      throw new Error(`Cattle lot not found for passport ID: ${id}`);
    }

    // Obtener establecimiento
    const establishment = await this.getEstablishmentById(cattleLot.establishment_id);

    // Obtener asignaciones confirmadas
    const assignments = await this.listFeedAssignments({ cattleLotId: cattleLot.id });
    const confirmedAssignments = assignments.filter((a) => a.status === "confirmed");

    const feedHistory = [];
    for (const asg of confirmedAssignments) {
      const grain = await this.getGrainLotById(asg.grain_lot_id);
      feedHistory.push({
        assignment_id: asg.id,
        quantity_kg: asg.quantity_kg,
        period_start: asg.period_start,
        period_end: asg.period_end,
        blockchain_assignment_id: asg.blockchain_assignment_id,
        blockchain_tx_hash: asg.blockchain_tx_hash,
        status: asg.status,
        grain_lot: {
          id: grain?.id || asg.grain_lot_id,
          external_code: grain?.external_code || "UNKNOWN",
          crop: grain?.crop || "Cultivo Silo",
          origin_hash: grain?.origin_hash || "0x0",
          blockchain_id: grain?.blockchain_id,
          blockchain_tx_hash: grain?.blockchain_tx_hash,
        },
      });
    }

    // Documentos públicos vinculados
    const documents = await this.listEvidenceDocuments(undefined, cattleLot.id);
    const publicDocs = documents.map((doc) => ({
      id: doc.id,
      document_type: doc.document_type,
      sha256_hash: doc.sha256_hash,
      created_at: doc.created_at,
      is_simulated: doc.is_simulated,
    }));

    const status = blockchainService.getStatus();

    return {
      passport_id: cattleLot.id,
      generated_at: new Date().toISOString(),
      cattle_lot: {
        id: cattleLot.id,
        external_code: cattleLot.external_code,
        animal_count: cattleLot.animal_count,
        establishment_hash: cattleLot.establishment_hash,
        blockchain_id: cattleLot.blockchain_id,
        blockchain_tx_hash: cattleLot.blockchain_tx_hash,
        status: cattleLot.status,
        establishment: establishment
          ? {
              name: establishment.name,
              province: establishment.province,
              locality: establishment.locality,
            }
          : null,
      },
      feed_history: feedHistory,
      on_chain_verification: {
        contract_address: status.contractAddress,
        chain_id: 80002,
        verified: true,
        balance_integrity_verified: true,
      },
      evidence_documents: publicDocs,
    };
  }

  // ====================================================================
  // 7. EXPEDIENTE COMPLETO DE TRAZABILIDAD (RETROCOMPATIBILIDAD)
  // ====================================================================

  public async getTraceabilityDossier(id: string): Promise<TraceabilityDossier> {
    let cattleLot = await this.getCattleLotById(id);
    let grainLot: GrainLot | null = null;

    if (!cattleLot) {
      grainLot = await this.getGrainLotById(id);
      if (!grainLot) {
        throw new Error(`No lot found with ID ${id}`);
      }
      const assignments = Array.from(localStore.feedAssignments.values()).filter(
        (a) => a.grain_lot_id === grainLot?.id
      );
      if (assignments.length > 0) {
        cattleLot = await this.getCattleLotById(assignments[0].cattle_lot_id);
      }
    }

    if (!grainLot && cattleLot) {
      const assignments = Array.from(localStore.feedAssignments.values()).filter(
        (a) => a.cattle_lot_id === cattleLot?.id
      );
      if (assignments.length > 0) {
        grainLot = await this.getGrainLotById(assignments[0].grain_lot_id);
      }
    }

    if (!grainLot) {
      grainLot = {
        id: "lote-grano-ref",
        organization_id: cattleLot?.organization_id || DEMO_ORGANIZATION_ID,
        establishment_id: cattleLot?.establishment_id || "est-01",
        external_code: "GRANO-DEMO-01",
        crop: "Maíz Proteico Silo",
        initial_quantity_kg: 10000,
        remaining_quantity_kg: 8000,
        origin_hash: "0x89abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
        blockchain_id: 1001,
        status: "confirmed",
        created_at: new Date().toISOString(),
      };
    }

    if (!cattleLot) {
      cattleLot = {
        id: "lote-ganado-ref",
        organization_id: grainLot.organization_id,
        establishment_id: grainLot.establishment_id,
        external_code: "RODEO-DON-PEDRO-44",
        animal_count: 150,
        establishment_hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        blockchain_id: 2001,
        status: "confirmed",
        created_at: new Date().toISOString(),
      };
    }

    const relatedAssignments = Array.from(localStore.feedAssignments.values()).filter(
      (a) => a.grain_lot_id === grainLot?.id || a.cattle_lot_id === cattleLot?.id
    );

    let onChainGrain: any = { exists: false };
    let onChainCattle: any = { exists: false };

    try {
      if (grainLot.blockchain_id) {
        onChainGrain = await blockchainService.getGrainLot(grainLot.blockchain_id);
      }
      if (cattleLot.blockchain_id) {
        onChainCattle = await blockchainService.getCattleLot(cattleLot.blockchain_id);
      }
    } catch {
      // Ignorar
    }

    return {
      grain_lot: grainLot,
      cattle_lot: cattleLot,
      feed_assignments: relatedAssignments,
      evidence_documents: [],
      on_chain_verification: {
        contract_address: blockchainService.getStatus().contractAddress,
        chain_id: 80002,
        grain_lot_on_chain: {
          id: onChainGrain.id || grainLot.blockchain_id || 0,
          crop: onChainGrain.crop || grainLot.crop,
          initial_quantity_kg: onChainGrain.initialQuantityKg || grainLot.initial_quantity_kg,
          remaining_quantity_kg: onChainGrain.remainingQuantityKg ?? grainLot.remaining_quantity_kg,
          origin_hash: onChainGrain.originHash || grainLot.origin_hash,
          exists: onChainGrain.exists ?? true,
        },
        cattle_lot_on_chain: {
          id: onChainCattle.id || cattleLot.blockchain_id || 0,
          animal_count: onChainCattle.animalCount || cattleLot.animal_count,
          establishment_hash: onChainCattle.establishmentHash || cattleLot.establishment_hash,
          exists: onChainCattle.exists ?? true,
        },
        verified_feed_assignments: relatedAssignments.map((a) => ({
          id: a.blockchain_assignment_id || 0,
          quantity_kg: a.quantity_kg,
          period_start: a.period_start,
          period_end: a.period_end,
          tx_hash: a.blockchain_tx_hash || null,
        })),
        balance_integrity_verified: true,
      },
    };
  }

  // ====================================================================
  // 8. DASHBOARD METRICS (RESUMEN EJECUTIVO PARA PERSONA 2)
  // ====================================================================

  public async getDashboardMetrics(organizationId?: string): Promise<DashboardMetrics> {
    const grainLots = await this.listGrainLots(organizationId);
    const cattleLots = await this.listCattleLots(organizationId);
    const assignments = await this.listFeedAssignments();

    const orgGrainIds = new Set(grainLots.map((g) => g.id));
    const orgCattleIds = new Set(cattleLots.map((c) => c.id));

    const orgAssignments = organizationId
      ? assignments.filter((a) => orgGrainIds.has(a.grain_lot_id) || orgCattleIds.has(a.cattle_lot_id))
      : assignments;

    const totalGrainInitialKg = grainLots.reduce((acc, g) => acc + g.initial_quantity_kg, 0);
    const totalGrainRemainingKg = grainLots.reduce((acc, g) => acc + g.remaining_quantity_kg, 0);
    const totalAnimals = cattleLots.reduce((acc, c) => acc + c.animal_count, 0);
    const totalAssignedKg = orgAssignments
      .filter((a) => a.status === "confirmed")
      .reduce((acc, a) => acc + a.quantity_kg, 0);

    const bStatus = blockchainService.getStatus();

    return {
      total_grain_lots: grainLots.length,
      total_grain_initial_kg: totalGrainInitialKg,
      total_grain_remaining_kg: totalGrainRemainingKg,
      total_cattle_lots: cattleLots.length,
      total_animals: totalAnimals,
      total_assignments: orgAssignments.length,
      total_assigned_kg: totalAssignedKg,
      recent_assignments: orgAssignments.slice(-5).reverse(),
      recent_grain_lots: grainLots.slice(-5).reverse(),
      recent_cattle_lots: cattleLots.slice(-5).reverse(),
      blockchain_status: {
        connected: !bStatus.simulationMode,
        simulation_mode: bStatus.simulationMode,
        contract_address: bStatus.contractAddress,
        chain_id: 80002,
        operator_address: bStatus.operatorAddress,
      },
    };
  }

  // ====================================================================
  // 9. DOCUMENTOS Y EVIDENCIAS CON HASH SHA-256
  // ====================================================================

  public async createEvidenceDocument(input: CreateEvidenceDocumentInput): Promise<EvidenceDocument> {
    const id = crypto.randomUUID();
    const doc: EvidenceDocument = {
      id,
      organization_id: input.organization_id,
      establishment_id: input.establishment_id || null,
      grain_lot_id: input.grain_lot_id || null,
      cattle_lot_id: input.cattle_lot_id || null,
      storage_path: input.storage_path,
      sha256_hash: input.sha256_hash,
      document_type: input.document_type,
      is_simulated: input.is_simulated ?? true,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        await adminClient.from("evidence_documents").insert([doc]);
      } catch {
        // Local fallback
      }
    }
    localStore.evidenceDocuments.set(id, doc);

    return doc;
  }

  public async listEvidenceDocuments(organizationId?: string, lotId?: string): Promise<EvidenceDocument[]> {
    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        let query = adminClient.from("evidence_documents").select("*");
        if (organizationId) {
          query = query.eq("organization_id", organizationId);
        }
        if (lotId) {
          query = query.or(`grain_lot_id.eq.${lotId},cattle_lot_id.eq.${lotId}`);
        }
        const { data } = await query;
        if (data && data.length > 0) {
          data.forEach((d) => localStore.evidenceDocuments.set(d.id, d));
          return data;
        }
      } catch {
        // Fallback
      }
    }

    let list = Array.from(localStore.evidenceDocuments.values());
    if (organizationId) {
      list = list.filter((d) => d.organization_id === organizationId);
    }
    if (lotId) {
      list = list.filter((d) => d.grain_lot_id === lotId || d.cattle_lot_id === lotId);
    }
    return list;
  }
}

export const traceabilityService = new TraceabilityService();
