"use client";
import type { FeedView } from "@/components/ui/data/types";
import { EmptyState, StatusBadge, date, kg } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

// URL del explorador de la red usada (la define Persona 1). Ej: https://hashscan.io/testnet/transaction/
const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER_TX_URL || "";

export function FeedHistory({ items, emptyText = "Todavía no hay alimentación registrada." }: { items: FeedView[]; emptyText?: string }) {
  if (!items.length) return <EmptyState text={emptyText} />;
  return (
    <div className="list">
      {items.map((f) => (
        <div className="row" key={f.id}>
          <div className="row-main" style={{ flex: "1 1 240px" }}>
            <span className="row-title">
              {kg(f.kg)} de {f.crop.toLowerCase()}
            </span>
            <span className="row-meta">
              <span className="mono">{f.grainCode}</span> → <span className="mono">{f.cattleCode}</span> · {date(f.periodStart)} al{" "}
              {date(f.periodEnd)}
            </span>
          </div>
          <div className="row-side">
            <StatusBadge status={f.status} />
            {f.txHash && EXPLORER ? (
              <a className="small" href={EXPLORER + f.txHash} target="_blank" rel="noreferrer" style={{ display: "inline-flex", gap: 4, alignItems: "center", fontWeight: 600 }}>
                Comprobante <Icon name="external" size={16} />
              </a>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
