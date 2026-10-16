export type OrganizationType = 'producer' | 'feedlot' | 'supplier' | 'frigorifico';

export type EntityStatus = 'pending' | 'processing' | 'confirmed' | 'failed' | 'reconciliation_required';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  created_at: string;
}

export interface Establishment {
  id: string;
  organization_id: string;
  name: string;
  province: string;
  locality: string;
  geojson?: Record<string, any>;
  created_at: string;
}

export interface GrainLot {
  id: string;
  organization_id: string;
  establishment_id: string;
  external_code: string;
  crop: string;
  initial_quantity_kg: number;
  remaining_quantity_kg: number;
  origin_hash: string;
  blockchain_id?: number | null;
  blockchain_tx_hash?: string | null;
  status: EntityStatus;
  created_at: string;
}

export interface CattleLot {
  id: string;
  organization_id: string;
  establishment_id: string;
  external_code: string;
  animal_count: number;
  establishment_hash: string;
  blockchain_id?: number | null;
  blockchain_tx_hash?: string | null;
  status: EntityStatus;
  created_at: string;
}

export interface FeedAssignment {
  id: string;
  grain_lot_id: string;
  cattle_lot_id: string;
  quantity_kg: number;
  period_start: string;
  period_end: string;
  blockchain_assignment_id?: number | null;
  blockchain_tx_hash?: string | null;
  status: EntityStatus;
  error_message?: string | null;
  operation_id?: string | null;
  created_at: string;
}

export interface EvidenceDocument {
  id: string;
  organization_id: string;
  establishment_id?: string | null;
  grain_lot_id?: string | null;
  cattle_lot_id?: string | null;
  storage_path: string;
  sha256_hash: string;
  document_type: string;
  is_simulated: boolean;
  created_at: string;
}

export interface TraceabilityDossier {
  grain_lot: GrainLot;
  cattle_lot: CattleLot;
  feed_assignments: FeedAssignment[];
  evidence_documents: EvidenceDocument[];
  on_chain_verification: {
    contract_address: string;
    chain_id: number;
    grain_lot_on_chain: {
      id: number;
      crop: string;
      initial_quantity_kg: number;
      remaining_quantity_kg: number;
      origin_hash: string;
      exists: boolean;
    };
    cattle_lot_on_chain: {
      id: number;
      animal_count: number;
      establishment_hash: string;
      exists: boolean;
    };
    verified_feed_assignments: Array<{
      id: number;
      quantity_kg: number;
      period_start: string;
      period_end: string;
      tx_hash: string | null;
    }>;
    balance_integrity_verified: boolean;
  };
}

export interface DashboardMetrics {
  total_grain_lots: number;
  total_grain_initial_kg: number;
  total_grain_remaining_kg: number;
  total_cattle_lots: number;
  total_animals: number;
  total_assignments: number;
  total_assigned_kg: number;
  recent_assignments: FeedAssignment[];
  recent_grain_lots: GrainLot[];
  recent_cattle_lots: CattleLot[];
  blockchain_status: {
    connected: boolean;
    simulation_mode: boolean;
    contract_address: string;
    chain_id?: number;
    operator_address?: string;
  };
}

export interface FeedHistoryResponse {
  cattle_lot: CattleLot;
  feed_history: Array<FeedAssignment & { grain_lot?: GrainLot }>;
  total_consumed_kg: number;
}

export interface PassportPublicData {
  passport_id: string;
  generated_at: string;
  cattle_lot: {
    id: string;
    external_code: string;
    animal_count: number;
    establishment_hash: string;
    blockchain_id?: number | null;
    blockchain_tx_hash?: string | null;
    status: EntityStatus;
    establishment?: {
      name: string;
      province: string;
      locality: string;
    } | null;
  };
  feed_history: Array<{
    assignment_id: string;
    quantity_kg: number;
    period_start: string;
    period_end: string;
    blockchain_assignment_id?: number | null;
    blockchain_tx_hash?: string | null;
    status: EntityStatus;
    grain_lot: {
      id: string;
      external_code: string;
      crop: string;
      origin_hash: string;
      blockchain_id?: number | null;
      blockchain_tx_hash?: string | null;
    };
  }>;
  on_chain_verification: {
    contract_address: string;
    chain_id: number;
    verified: boolean;
    balance_integrity_verified: boolean;
  };
  evidence_documents: Array<{
    id: string;
    document_type: string;
    sha256_hash: string;
    created_at: string;
    is_simulated: boolean;
  }>;
}
