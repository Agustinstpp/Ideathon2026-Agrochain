"use client";
import { useCallback, useEffect, useState } from "react";
import type { OpStatus } from "@/components/ui/data/types";
import { ApiError } from "@/components/ui/data/types";
import { Icon } from "./Icon";

/* ---------- Formato ---------- */
export const kg = (n: number) => `${n.toLocaleString("es-AR")} kg`;
export const num = (n: number) => n.toLocaleString("es-AR");
export function date(iso: string) {
  if (!iso) return "—";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + "T12:00:00") : new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ---------- Carga de datos ---------- */
export function useData<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos cargar los datos.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, error, loading, reload };
}

/* ---------- Componentes ---------- */
export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "brown" | "dark";
}) {
  return (
    <div className={`card stat ${tone === "dark" ? "dark" : ""}`}>
      <span className="stat-label">{label}</span>
      <strong className={`stat-value ${tone === "brown" ? "brown" : ""}`}>{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

const STATUS: Record<OpStatus, { text: string; cls: string }> = {
  confirmed: { text: "Registrado", cls: "ok" },
  pending: { text: "Pendiente", cls: "wait" },
  processing: { text: "Confirmando", cls: "wait" },
  reconciliation_required: { text: "En revisión", cls: "wait" },
  failed: { text: "Falló", cls: "bad" },
  simulated: { text: "Simulado", cls: "sim" },
};

export function StatusBadge({ status }: { status: OpStatus }) {
  const s = STATUS[status] || STATUS.pending;
  return <span className={`badge ${s.cls}`}>{s.text}</span>;
}

export function LoadingState({ text = "Cargando…" }: { text?: string }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {text}
    </div>
  );
}

export function EmptyState({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <p>{text}</p>
      {children}
    </div>
  );
}

export function ErrorMessage({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="alert error" role="alert">
      <Icon name="alert" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span>{text}</span>
        {onRetry && (
          <button type="button" className="btn secondary small" onClick={onRetry} style={{ alignSelf: "flex-start" }}>
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

export function Bar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
  return (
    <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}>
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}
