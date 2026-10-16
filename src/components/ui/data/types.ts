// Tipos que usa la interfaz. Los tipos del backend viven en "@/lib/types" (Persona 3).
export type OpStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "failed"
  | "reconciliation_required"
  | "simulated";

export type ApiMode = "live" | "demo";

export interface Establishment {
  id: string;
  name: string;
  province: string;
  locality: string;
  kind: "ganadero" | "agricola";
}

export interface GrainLotView {
  id: string;
  code: string;
  crop: string;
  initialKg: number;
  remainingKg: number;
  establishmentId: string;
  establishmentName: string;
  status: OpStatus;
  txHash: string | null;
  createdAt: string;
}

export interface CattleLotView {
  id: string;
  code: string;
  animals: number;
  establishmentId: string;
  establishmentName: string;
  status: OpStatus;
  txHash: string | null;
  createdAt: string;
}

export interface FeedView {
  id: string;
  grainLotId: string;
  cattleLotId: string;
  grainCode: string;
  crop: string;
  cattleCode: string;
  kg: number;
  periodStart: string;
  periodEnd: string;
  status: OpStatus;
  txHash: string | null;
  createdAt: string;
}

export interface DashboardData {
  cattleLots: number;
  animals: number;
  grainLots: number;
  assignedKg: number;
  recent: FeedView[];
}

export interface NewGrainLot {
  code: string;
  crop: string;
  establishmentId: string;
  kg: number;
  docHash?: string; // SHA-256 del documento de origen, calculado en el navegador
}

export interface NewCattleLot {
  code: string;
  animals: number;
  establishmentId: string;
}

export interface NewFeed {
  grainLotId: string;
  cattleLotId: string;
  kg: number;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;
  operationId: string; // clave de idempotencia
}

export type ApiErrorCode =
  | "insufficient"
  | "not_found"
  | "validation"
  | "unauthorized"
  | "offline"
  | "uncertain"
  | "unknown";

export class ApiError extends Error {
  constructor(public code: ApiErrorCode, message: string) {
    super(message);
  }
}
