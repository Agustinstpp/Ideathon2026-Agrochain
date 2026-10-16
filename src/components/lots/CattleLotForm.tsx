"use client";
import { useEffect, useState } from "react";
import { createCattleLot, listEstablishments } from "@/components/ui/data/client";
import { ApiError, type CattleLotView, type Establishment } from "@/components/ui/data/types";
import { ErrorMessage } from "@/components/ui";

export function CattleLotForm({ onCreated }: { onCreated: (lot: CattleLotView) => void }) {
  const [ests, setEsts] = useState<Establishment[]>([]);
  const [code, setCode] = useState("");
  const [animalsText, setAnimals] = useState("");
  const [establishmentId, setEst] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    listEstablishments().then((l) => {
      setEsts(l);
      const first = l.find((e) => e.kind === "ganadero") || l[0];
      if (first) setEst(first.id);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const animals = Number(animalsText);
    const errs: Record<string, string> = {};
    if (code.trim().length < 2) errs.code = "Ingresá un código (ej. GAN-002).";
    if (!Number.isInteger(animals) || animals <= 0) errs.animals = "Ingresá una cantidad entera mayor a cero.";
    if (!establishmentId) errs.est = "Elegí un establecimiento.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    setApiError(null);
    try {
      const lot = await createCattleLot({ code: code.trim().toUpperCase(), animals, establishmentId });
      onCreated(lot);
      setCode("");
      setAnimals("");
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "No pudimos registrar el lote.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <label className={`field ${errors.code ? "invalid" : ""}`}>
          Código del lote
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="GAN-002" className="mono" />
          {errors.code && <span className="field-hint">{errors.code}</span>}
        </label>
        <label className={`field ${errors.animals ? "invalid" : ""}`}>
          Cantidad de animales
          <input inputMode="numeric" value={animalsText} onChange={(e) => setAnimals(e.target.value)} placeholder="20" />
          {errors.animals && <span className="field-hint">{errors.animals}</span>}
        </label>
      </div>
      <label className={`field ${errors.est ? "invalid" : ""}`}>
        Establecimiento
        <select value={establishmentId} onChange={(e) => setEst(e.target.value)}>
          {ests.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} · {e.locality}
            </option>
          ))}
        </select>
        {errors.est && <span className="field-hint">{errors.est}</span>}
      </label>
      {apiError && <ErrorMessage text={apiError} />}
      <button className="btn block" type="submit" disabled={sending}>
        {sending ? "Registrando…" : "Registrar lote"}
      </button>
    </form>
  );
}
