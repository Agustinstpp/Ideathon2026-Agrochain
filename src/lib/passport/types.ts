export type PassportVerificationStatus =
  | 'confirmed'
  | 'pending'
  | 'declared'
  | 'simulated'
  | 'failed';

export interface PassportCattleInfo {
  external_code: string;
  animal_count: number;
  species?: string;
  establishment_name: string;
  renspa_declared?: string;
  establishment_hash: string;
  province: string;
  locality: string;
  declared_origin: string;
  category?: string;
  blockchain_id?: number | null;
}

export interface PassportFeedingRecord {
  assignment_id: string;
  blockchain_assignment_id?: number | null;
  grain_lot_code: string;
  grain_lot_uuid?: string;
  crop: string;
  origin_farm?: string;
  origin_location?: string;
  quantity_kg: number;
  initial_grain_lot_quantity_kg?: number;
  remaining_grain_lot_quantity_kg?: number;
  period_start: string;
  period_end: string;
  registered_at: string;
  status: PassportVerificationStatus;
  blockchain_tx_hash?: string | null;
  verified_on_chain: boolean;
}

export interface PassportEvidenceDoc {
  id: string;
  title: string;
  document_type: string;
  scope: 'public' | 'private';
  file_name: string;
  sha256_hash: string;
  is_simulated: boolean;
  created_at: string;
  status: string;
  download_url?: string;
}

export interface PassportComplianceNote {
  standard: string;
  status: string;
  detail: string;
}

export interface PassportBlockchainInfo {
  network: string;
  chain_id: number;
  contract_address: string;
  tx_hash: string | null;
  confirmation_status: string;
  block_number: number | null;
  block_timestamp: string | null;
  explorer_url: string | null;
  is_mock_network?: boolean;
}

export interface PassportData {
  lot_id: string;
  uuid?: string;
  status: PassportVerificationStatus;
  is_simulated: boolean;
  updated_at: string;
  cattle: PassportCattleInfo;
  feeding_history: PassportFeedingRecord[];
  evidence_documents: PassportEvidenceDoc[];
  regulatory_compliance_notes: PassportComplianceNote[];
  blockchain_verification: PassportBlockchainInfo;
}
