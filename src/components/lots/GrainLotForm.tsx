"use client";
import { useEffect, useState } from "react";
import { createGrainLot, listEstablishments, sha256File } from "@/components/ui/data/client";
import { ApiError, type Establishment, type GrainLotView } from "@/components/ui/data/types";
import { ErrorMessage } from "@/components/ui";

const CROPS = ["Maíz", "Soja", "Sorgo", "Trigo", "Alimento balanceado"];

export function GrainLotForm({ onCreated }: { onCreated: (lot: GrainLotView) => void }) {
  const [ests, setEsts] = useState<Establishment[]>([]);
  const [code, setCode] = useState("");
  const [crop, setCrop] = useState(CROPS[0]);
  const [establishmentId, setEst] = useState("");
  const [kgText, setKg] = useState("");
  const [doc, setDoc] = useState<{ name: string; hash: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    listEstablishments().then((l) => {
      setEsts(l);
      const first = l.find((e) => e.kind === "agricola") || l[0];
      if (first) setEst(first.id);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const kg = Number(kgText.replace(/\./g, ""));
    const errs: Record<string, string> = {};
    if (code.trim().length < 2) errs.code = "Ingresá un código (ej. AGR-002).";
    if (!establishmentId) errs.est = "Elegí un establecimiento.";
    if (!Number.isInteger(kg) || kg <= 0) errs.kg = "Ingresá una cantidad entera mayor a cero.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    setApiError(null);
    try {
      const lot = await createGrainLot({ code: code.trim().toUpperCase(), crop, establishmentId, kg, docHash: doc?.hash });
      onCreated(lot);
      setCode("");
      setKg("");
      setDoc(null);
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
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="AGR-002" className="mono" />
          {errors.code && <span className="field-hint">{errors.code}</span>}
        </label>
        <label className="field">
          Cultivo
          <select value={crop} onChange={(e) => setCrop(e.target.value)}>
            {CROPS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className={`field ${errors.kg ? "invalid" : ""}`}>
          Cantidad (kg)
          <input inputMode="numeric" value={kgText} onChange={(e) => setKg(e.target.value)} placeholder="10000" />
          {errors.kg && <span className="field-hint">{errors.kg}</span>}
        </label>
        <label className={`field ${errors.est ? "invalid" : ""}`}>
          Establecimiento de origen
          <select value={establishmentId} onChange={(e) => setEst(e.target.value)}>
            {ests.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} · {e.locality}
              </option>
            ))}
          </select>
          {errors.est && <span className="field-hint">{errors.est}</span>}
        </label>
      </div>
      <label className="field">
        Documento de origen (opcional)
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            setDoc(f ? { name: f.name, hash: await sha256File(f) } : null);
          }}
          style={{ height: "auto", padding: "12px 14px" }}
        />
        <span className="field-hint">
          {doc ? `${doc.name} · huella ${doc.hash.slice(0, 10)}…` : "Remito o carta de porte. Solo se guarda su huella digital."}
        </span>
      </label>
      {apiError && <ErrorMessage text={apiError} />}
      <button className="btn block" type="submit" disabled={sending}>
        {sending ? "Registrando…" : "Registrar alimento"}
      </button>
    </form>
  );
}
