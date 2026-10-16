// Datos de demostración (simulados). Se usan solo si la API real no responde.
import type { CattleLotView, Establishment, FeedView, GrainLotView } from "@/components/ui/data/types";

export const DEMO_ORG_ID = "00000000-0000-4000-8000-000000000001";

export const DEMO_ESTABLISHMENTS: Establishment[] = [
  {
    id: "00000000-0000-4000-8000-0000000000e1",
    name: "Establecimiento Demo Corrientes",
    province: "Corrientes",
    locality: "Mercedes",
    kind: "ganadero",
  },
  {
    id: "00000000-0000-4000-8000-0000000000e2",
    name: "Campo Agrícola Demo",
    province: "Chaco",
    locality: "Charata",
    kind: "agricola",
  },
];

const now = new Date().toISOString();

export const DEMO_GRAIN: GrainLotView[] = [
  {
    id: "00000000-0000-4000-8000-0000000000a1",
    code: "AGR-001",
    crop: "Maíz",
    initialKg: 10000,
    remainingKg: 10000,
    establishmentId: DEMO_ESTABLISHMENTS[1].id,
    establishmentName: DEMO_ESTABLISHMENTS[1].name,
    status: "simulated",
    txHash: null,
    createdAt: now,
  },
];

export const DEMO_CATTLE: CattleLotView[] = [
  {
    id: "00000000-0000-4000-8000-0000000000b1",
    code: "GAN-001",
    animals: 20,
    establishmentId: DEMO_ESTABLISHMENTS[0].id,
    establishmentName: DEMO_ESTABLISHMENTS[0].name,
    status: "simulated",
    txHash: null,
    createdAt: now,
  },
];

export const DEMO_FEED: FeedView[] = [];
