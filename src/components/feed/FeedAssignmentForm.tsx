"use client";
import { useEffect, useRef, useState } from "react";
import { createFeed, newOperationId } from "@/components/ui/data/client";
import { ApiError, type CattleLotView, type FeedView, type GrainLotView } from "@/components/ui/data/types";
import { Bar, kg, num } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

type Phase =
  | { k: "idle" }
  | { k: "sending"; text: string }
  | { k: "ok"; feed: FeedView; remaining: number | null }
  | { k: "error"; code: ApiError["code"]; text: string };

const today = () => new Date().toISOString().slice(0, 10);

export function FeedAssignmentForm({
  grainLots,
  cattleLots,
  initialCattleId,
  onDone,
}: {
  grainLots: GrainLotView[];
  cattleLots: CattleLotView[];
  initialCattleId?: string;
  onDone: () => void;
}) {
  const [grainId, setGrainId] = useState(grainLots[0]?.id || "");
  const [cattleId, setCattleId] = useState(initialCattleId || cattleLots[0]?.id || "");
  const [kgText, setKg] = useState("");
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>({ k: "idle" });
  const opId = useRef<string | null>(null);

  useEffect(() => {
    if (!grainId && grainLots[0]) setGrainId(grainLots[0].id);
  }, [grainLots, grainId]);
  useEffect(() => {
    if (initialCattleId) setCattleId(initialCattleId);
    else if (!cattleId && cattleLots[0]) setCattleId(cattleLots[0].id);
  }, [cattleLots, cattleId, initialCattleId]);

  const grain = grainLots.find((g) => g.id === grainId);
  const amount = Number(kgText.replace(/\./g, ""));
  const over = grain && Number.isFinite(amount) && amount > grain.remainingKg;
  const sending = phase.k === "sending";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!grainId) errs.grain = "Elegí un lote de alimento.";
    if (!cattleId) errs.cattle = "Elegí un lote de animales.";
    if (!Number.isInteger(amount) || amount <= 0) errs.kg = "Ingresá una cantidad entera mayor a cero.";
    if (!from || !to) errs.period = "Completá las dos fechas.";
    else if (from > to) errs.period = "La fecha de inicio es posterior a la de fin.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // Misma clave si el intento anterior quedó sin confirmar: evita duplicar.
    if (!opId.current) opId.current = newOperationId();
    setPhase({ k: "sending", text: "Registrando operación…" });
    const t = setTimeout(() => setPhase({ k: "sending", text: "Esperando confirmación…" }), 900);
    try {
      const r = await createFeed({
        grainLotId: grainId,
        cattleLotId: cattleId,
        kg: amount,
        periodStart: from,
        periodEnd: to,
        operationId: opId.current,
      });
      opId.current = null;
      setPhase({ k: "ok", feed: r.feed, remaining: r.remainingKg });
      setKg("");
      onDone();
    } catch (err) {
      const e2 = err instanceof ApiError ? err : new ApiError("unknown", "No pudimos completar la operación.");
      if (e2.code !== "uncertain" && e2.code !== "offline") opId.current = null;
      setPhase({ k: "error", code: e2.code, text: e2.message });
    } finally {
      clearTimeout(t);
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <label className={`field ${errors.grain ? "invalid" : ""}`}>
        Lote de alimento
        <select value={grainId} onChange={(e) => setGrainId(e.target.value)} disabled={sending}>
          {grainLots.map((g) => (
            <option key={g.id} value={g.id}>
              {g.code} · {g.crop}
            </option>
          ))}
        </select>
      </label>
      {grain && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: -8 }}>
          <Bar value={grain.remainingKg} total={grain.initialKg} />
          <span className="small muted">
            Disponible: <strong style={{ color: "var(--text)" }}>{kg(grain.remainingKg)}</strong> de {num(grain.initialKg)}
          </span>
        </div>
      )}

      <label className={`field ${errors.cattle ? "invalid" : ""}`}>
        Lote de animales
        <select value={cattleId} onChange={(e) => setCattleId(e.target.value)} disabled={sending}>
          {cattleLots.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · {num(c.animals)} animales
            </option>
          ))}
        </select>
      </label>

      <label className={`field ${errors.kg || over ? "invalid" : ""}`}>
        Cantidad (kg)
        <input
          inputMode="numeric"
          value={kgText}
          onChange={(e) => setKg(e.target.value)}
          placeholder="2000"
          disabled={sending}
          aria-invalid={Boolean(errors.kg || over)}
        />
        {errors.kg ? (
          <span className="field-hint">{errors.kg}</span>
        ) : over && grain ? (
          <span className="field-hint">Supera lo disponible ({kg(grain.remainingKg)}).</span>
        ) : grain && amount > 0 ? (
          <span className="field-hint">Quedarían {kg(grain.remainingKg - amount)}.</span>
        ) : null}
      </label>

      <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
        <legend className="small" style={{ fontWeight: 600, padding: 0, marginBottom: 6 }}>
          Período
        </legend>
        <div className="form-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <label className={`field ${errors.period ? "invalid" : ""}`} style={{ fontWeight: 400 }}>
            Desde
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} disabled={sending} />
          </label>
          <label className={`field ${errors.period ? "invalid" : ""}`} style={{ fontWeight: 400 }}>
            Hasta
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} disabled={sending} />
          </label>
        </div>
        {errors.period && (
          <span className="small" style={{ color: "var(--red)", fontWeight: 500 }}>
            {errors.period}
          </span>
        )}
      </fieldset>

      <div aria-live="polite">
        {phase.k === "sending" && (
          <div className="alert info">
            <Icon name="clock" />
            <span>{phase.text}</span>
          </div>
        )}
        {phase.k === "ok" && (
          <div className="alert success">
            <Icon name="check" />
            <span>
              <strong>Alimentación registrada</strong>
              {kg(phase.feed.kg)} a {phase.feed.cattleCode}
              {phase.remaining !== null && <> · quedan {kg(phase.remaining)} en {phase.feed.grainCode}</>}
              {phase.feed.status === "simulated" && " · simulado"}
            </span>
          </div>
        )}
        {phase.k === "error" && (
          <div className="alert error" role="alert">
            <Icon name={phase.code === "offline" ? "wifiOff" : "alert"} />
            <span>
              <strong>
                {phase.code === "insufficient"
                  ? "No se registró"
                  : phase.code === "uncertain"
                  ? "Operación sin confirmar"
                  : "No se registró"}
              </strong>
              {phase.code === "insufficient" && grain
                ? `Pediste ${kg(amount)} y hay ${kg(grain.remainingKg)} disponibles.`
                : phase.text}
            </span>
          </div>
        )}
      </div>

      <button className="btn block" type="submit" disabled={sending || !grainLots.length || !cattleLots.length}>
        {sending ? "Registrando…" : "Registrar alimentación"}
      </button>
    </form>
  );
}
