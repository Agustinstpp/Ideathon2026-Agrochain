"use client";
// Cliente de la API para la interfaz.
// - Modo "live": usa los endpoints de Next (Persona 3).
// - Modo "demo": si la API no responde, usa datos simulados en el navegador
//   y todo se marca como "Simulado" en pantalla.
import {
  ApiError,
  type ApiMode,
  type CattleLotView,
  type DashboardData,
  type Establishment,
  type FeedView,
  type GrainLotView,
  type NewCattleLot,
  type NewFeed,
  type NewGrainLot,
  type OpStatus,
} from "@/components/ui/data/types";
import { DEMO_CATTLE, DEMO_ESTABLISHMENTS, DEMO_FEED, DEMO_GRAIN, DEMO_ORG_ID } from "./demoData";

const ORG_ID = process.env.NEXT_PUBLIC_DEMO_ORG_ID || DEMO_ORG_ID;

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

type Json = Record<string, any>;

async function request(path: string, init?: RequestInit): Promise<{ res: Response; body: Json | null }> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("offline", "Sin conexión. Revisá internet y volvé a intentar.");
  }
  let body: Json | null = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { res, body };
}

function toError(res: Response, body: Json | null): ApiError {
  const raw = String(body?.error || body?.message || "");
  if (/insufficient|saldo|inventory/i.test(raw)) {
    return new ApiError("insufficient", "La cantidad supera el alimento disponible.");
  }
  if (res.status === 401 || res.status === 403 || /unauthori/i.test(raw)) {
    return new ApiError("unauthorized", "No tenés permiso para esta operación.");
  }
  if (res.status === 404 || /does not exist|not found/i.test(raw)) {
    return new ApiError("not_found", "El lote no existe.");
  }
  if (res.status === 400) {
    return new ApiError("validation", "Revisá los datos cargados.");
  }
  return new ApiError("unknown", "No pudimos completar la operación.");
}

// Si el backend firma en modo simulado, nada se muestra como "Registrado".
let chainSimulated = false;

function mapStatus(s: unknown): OpStatus {
  const v = String(s || "");
  if (v === "confirmed" && chainSimulated) return "simulated";
  if (["pending", "processing", "confirmed", "failed", "reconciliation_required"].includes(v)) return v as OpStatus;
  return "pending";
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return "0x" + Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256File(file: File): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return "0x" + Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function newOperationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `op-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/* ------------------------------------------------------------------ */
/* Detección de modo                                                   */
/* ------------------------------------------------------------------ */

let modePromise: Promise<ApiMode> | null = null;

export function getMode(): Promise<ApiMode> {
  if (!modePromise) {
    modePromise = (async () => {
      // NEXT_PUBLIC_USE_MOCKS=1 en .env.local fuerza los datos de demo (para ver el front en seco).
      if (process.env.NEXT_PUBLIC_USE_MOCKS === "1") return "demo";
      try {
        const { res, body } = await request("/api/grain-lots");
        if (!(res.ok && body?.success)) return "demo";
        try {
          const st = await request("/api/status");
          chainSimulated = st.body?.blockchain?.simulationMode !== false;
        } catch {
          chainSimulated = true;
        }
        return "live";
      } catch {
        return "demo";
      }
    })();
  }
  return modePromise;
}

/** true si los datos no tienen registro verificable real (demo local o backend simulado). */
export async function isSimulated(): Promise<boolean> {
  return (await getMode()) === "demo" || chainSimulated;
}

/* ------------------------------------------------------------------ */
/* Almacén de demostración (navegador)                                 */
/* ------------------------------------------------------------------ */

const STORE_KEY = "agrochain-demo-v1";
type Store = { grain: GrainLotView[]; cattle: CattleLotView[]; feed: FeedView[] };
let store: Store | null = null;

function demoStore(): Store {
  if (store) return store;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) store = JSON.parse(raw);
  } catch {
    /* sin storage: queda en memoria */
  }
  if (!store) store = { grain: [...DEMO_GRAIN], cattle: [...DEMO_CATTLE], feed: [...DEMO_FEED] };
  return store;
}

function saveDemo() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* ignorar */
  }
}

export function resetDemo() {
  store = { grain: [...DEMO_GRAIN], cattle: [...DEMO_CATTLE], feed: [...DEMO_FEED] };
  saveDemo();
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Establecimientos                                                    */
/* ------------------------------------------------------------------ */

let estCache: Establishment[] | null = null;

export async function listEstablishments(): Promise<Establishment[]> {
  if (estCache) return estCache;
  if ((await getMode()) === "live") {
    try {
      const { res, body } = await request("/api/establishments");
      if (res.ok && Array.isArray(body?.data)) {
        estCache = body!.data.map((e: Json) => ({
          id: e.id,
          name: e.name,
          province: e.province,
          locality: e.locality,
          kind: e.kind === "agricola" ? "agricola" : "ganadero",
        }));
        return estCache!;
      }
    } catch {
      /* endpoint todavía no disponible */
    }
  }
  estCache = DEMO_ESTABLISHMENTS;
  return estCache;
}

function estName(list: Establishment[], id: string) {
  return list.find((e) => e.id === id)?.name || "—";
}

/* ------------------------------------------------------------------ */
/* Lotes agrícolas                                                     */
/* ------------------------------------------------------------------ */

export async function listGrainLots(): Promise<GrainLotView[]> {
  if ((await getMode()) === "demo") return [...demoStore().grain];
  const [{ res, body }, ests] = await Promise.all([request("/api/grain-lots"), listEstablishments()]);
  if (!res.ok) throw toError(res, body);
  return (body?.data || []).map((g: Json) => ({
    id: g.id,
    code: g.external_code,
    crop: g.crop,
    initialKg: Number(g.initial_quantity_kg),
    remainingKg: Number(g.remaining_quantity_kg),
    establishmentId: g.establishment_id,
    establishmentName: estName(ests, g.establishment_id),
    status: mapStatus(g.status),
    txHash: g.blockchain_tx_hash || null,
    createdAt: g.created_at,
  }));
}

export async function createGrainLot(input: NewGrainLot): Promise<GrainLotView> {
  const ests = await listEstablishments();
  if ((await getMode()) === "demo") {
    await delay(600);
    const s = demoStore();
    if (s.grain.some((g) => g.code === input.code)) throw new ApiError("validation", "Ya existe un lote con ese código.");
    const lot: GrainLotView = {
      id: newOperationId(),
      code: input.code,
      crop: input.crop,
      initialKg: input.kg,
      remainingKg: input.kg,
      establishmentId: input.establishmentId,
      establishmentName: estName(ests, input.establishmentId),
      status: "simulated",
      txHash: null,
      createdAt: new Date().toISOString(),
    };
    s.grain.unshift(lot);
    saveDemo();
    return lot;
  }
  const origin_hash = input.docHash || (await sha256Hex(JSON.stringify({ ...input, org: ORG_ID })));
  const { res, body } = await request("/api/grain-lots", {
    method: "POST",
    body: JSON.stringify({
      organization_id: ORG_ID,
      establishment_id: input.establishmentId,
      external_code: input.code,
      crop: input.crop,
      initial_quantity_kg: input.kg,
      origin_hash,
    }),
  });
  if (!res.ok || !body?.success) throw toError(res, body);
  const g = body.data;
  return {
    id: g.id,
    code: g.external_code,
    crop: g.crop,
    initialKg: Number(g.initial_quantity_kg),
    remainingKg: Number(g.remaining_quantity_kg),
    establishmentId: input.establishmentId,
    establishmentName: estName(ests, input.establishmentId),
    status: mapStatus(g.status),
    txHash: g.blockchain_tx_hash || null,
    createdAt: g.created_at,
  };
}

/* ------------------------------------------------------------------ */
/* Lotes ganaderos                                                     */
/* ------------------------------------------------------------------ */

export async function listCattleLots(): Promise<CattleLotView[]> {
  if ((await getMode()) === "demo") return [...demoStore().cattle];
  const [{ res, body }, ests] = await Promise.all([request("/api/cattle-lots"), listEstablishments()]);
  if (!res.ok) throw toError(res, body);
  return (body?.data || []).map((c: Json) => ({
    id: c.id,
    code: c.external_code,
    animals: Number(c.animal_count),
    establishmentId: c.establishment_id,
    establishmentName: estName(ests, c.establishment_id),
    status: mapStatus(c.status),
    txHash: c.blockchain_tx_hash || null,
    createdAt: c.created_at,
  }));
}

export async function createCattleLot(input: NewCattleLot): Promise<CattleLotView> {
  const ests = await listEstablishments();
  if ((await getMode()) === "demo") {
    await delay(600);
    const s = demoStore();
    if (s.cattle.some((c) => c.code === input.code)) throw new ApiError("validation", "Ya existe un lote con ese código.");
    const lot: CattleLotView = {
      id: newOperationId(),
      code: input.code,
      animals: input.animals,
      establishmentId: input.establishmentId,
      establishmentName: estName(ests, input.establishmentId),
      status: "simulated",
      txHash: null,
      createdAt: new Date().toISOString(),
    };
    s.cattle.unshift(lot);
    saveDemo();
    return lot;
  }
  const establishment_hash = await sha256Hex(JSON.stringify({ est: input.establishmentId, org: ORG_ID }));
  const { res, body } = await request("/api/cattle-lots", {
    method: "POST",
    body: JSON.stringify({
      organization_id: ORG_ID,
      establishment_id: input.establishmentId,
      external_code: input.code,
      animal_count: input.animals,
      establishment_hash,
    }),
  });
  if (!res.ok || !body?.success) throw toError(res, body);
  const c = body.data;
  return {
    id: c.id,
    code: c.external_code,
    animals: Number(c.animal_count),
    establishmentId: input.establishmentId,
    establishmentName: estName(ests, input.establishmentId),
    status: mapStatus(c.status),
    txHash: c.blockchain_tx_hash || null,
    createdAt: c.created_at,
  };
}

/* ------------------------------------------------------------------ */
/* Alimentación                                                        */
/* ------------------------------------------------------------------ */

function decorateFeed(f: Json, grain: GrainLotView[], cattle: CattleLotView[]): FeedView {
  const g = grain.find((x) => x.id === f.grain_lot_id);
  const c = cattle.find((x) => x.id === f.cattle_lot_id);
  return {
    id: f.id,
    grainLotId: f.grain_lot_id,
    cattleLotId: f.cattle_lot_id,
    grainCode: g?.code || "—",
    crop: g?.crop || "—",
    cattleCode: c?.code || "—",
    kg: Number(f.quantity_kg),
    periodStart: f.period_start,
    periodEnd: f.period_end,
    status: mapStatus(f.status),
    txHash: f.blockchain_tx_hash || null,
    createdAt: f.created_at,
  };
}

export async function listFeed(cattleLotId?: string): Promise<FeedView[]> {
  if ((await getMode()) === "demo") {
    const all = demoStore().feed;
    return cattleLotId ? all.filter((f) => f.cattleLotId === cattleLotId) : [...all];
  }
  const [grain, cattle] = await Promise.all([listGrainLots(), listCattleLots()]);
  if (cattleLotId) {
    const { res, body } = await request(`/api/cattle-lots/${cattleLotId}/feed-history`);
    if (res.ok && Array.isArray(body?.data)) return body!.data.map((f: Json) => decorateFeed(f, grain, cattle));
  }
  const { res, body } = await request("/api/feed-assignments");
  if (!res.ok) throw toError(res, body);
  const list: FeedView[] = (body?.data || []).map((f: Json) => decorateFeed(f, grain, cattle));
  const filtered = cattleLotId ? list.filter((f) => f.cattleLotId === cattleLotId) : list;
  return filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createFeed(input: NewFeed): Promise<{ feed: FeedView; remainingKg: number | null }> {
  if ((await getMode()) === "demo") {
    await delay(1200);
    const s = demoStore();
    const g = s.grain.find((x) => x.id === input.grainLotId);
    const c = s.cattle.find((x) => x.id === input.cattleLotId);
    if (!g || !c) throw new ApiError("not_found", "El lote no existe.");
    const existing = s.feed.find((f) => f.id === input.operationId);
    if (existing) return { feed: existing, remainingKg: g.remainingKg };
    if (input.kg > g.remainingKg) throw new ApiError("insufficient", "La cantidad supera el alimento disponible.");
    g.remainingKg -= input.kg;
    const feed: FeedView = {
      id: input.operationId,
      grainLotId: g.id,
      cattleLotId: c.id,
      grainCode: g.code,
      crop: g.crop,
      cattleCode: c.code,
      kg: input.kg,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      status: "simulated",
      txHash: null,
      createdAt: new Date().toISOString(),
    };
    s.feed.unshift(feed);
    saveDemo();
    return { feed, remainingKg: g.remainingKg };
  }

  let res: Response;
  let body: Json | null;
  try {
    ({ res, body } = await request("/api/feed-assignments", {
      method: "POST",
      headers: { "Idempotency-Key": input.operationId },
      body: JSON.stringify({
        grain_lot_id: input.grainLotId,
        cattle_lot_id: input.cattleLotId,
        quantity_kg: input.kg,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        idempotency_key: input.operationId,
      }),
    }));
  } catch (e) {
    // Se perdió la conexión después de enviar: no sabemos si llegó.
    throw new ApiError("uncertain", "No pudimos confirmar la operación. Revisá el historial antes de reintentar.");
  }
  if (!res.ok || !body?.success) {
    if (res.status >= 500 && !/insufficient/i.test(String(body?.error || ""))) {
      throw new ApiError("uncertain", "No pudimos confirmar la operación. Revisá el historial antes de reintentar.");
    }
    throw toError(res, body);
  }
  const [grain, cattle] = await Promise.all([listGrainLots(), listCattleLots()]);
  return {
    feed: decorateFeed(body.data, grain, cattle),
    remainingKg: typeof body.remaining_quantity_kg === "number" ? body.remaining_quantity_kg : null,
  };
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export async function getDashboard(): Promise<DashboardData> {
  const [grain, cattle, feed] = await Promise.all([listGrainLots(), listCattleLots(), listFeed()]);
  return {
    cattleLots: cattle.length,
    animals: cattle.reduce((s, c) => s + c.animals, 0),
    grainLots: grain.length,
    assignedKg: feed
      .filter((f) => f.status === "confirmed" || f.status === "simulated")
      .reduce((s, f) => s + f.kg, 0),
    recent: feed.slice(0, 5),
  };
}
