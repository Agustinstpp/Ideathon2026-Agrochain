"use client";
import Link from "next/link";
import type { CattleLotView, GrainLotView } from "@/components/ui/data/types";
import { Bar, StatusBadge, date, kg, num } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

export function GrainLotCard({ lot }: { lot: GrainLotView }) {
  return (
    <div className="row">
      <div className="row-main" style={{ flex: "1 1 220px" }}>
        <span className="row-title mono">{lot.code}</span>
        <span className="row-meta">
          {lot.crop} · {lot.establishmentName}
        </span>
      </div>
      <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: 6 }}>
        <Bar value={lot.remainingKg} total={lot.initialKg} />
        <span className="small">
          <strong>{kg(lot.remainingKg)}</strong> disponibles de {num(lot.initialKg)}
        </span>
      </div>
      <div className="row-side">
        <StatusBadge status={lot.status} />
      </div>
    </div>
  );
}

export function CattleLotCard({ lot }: { lot: CattleLotView }) {
  return (
    <div className="row">
      <div className="row-main" style={{ flex: "1 1 220px" }}>
        <span className="row-title mono">{lot.code}</span>
        <span className="row-meta">
          {num(lot.animals)} animales · {lot.establishmentName} · {date(lot.createdAt)}
        </span>
      </div>
      <div className="row-side">
        <StatusBadge status={lot.status} />
        <Link className="btn secondary small" href={`/alimentacion?lote=${lot.id}`}>
          Historial
        </Link>
        <Link className="btn small" href={`/pasaporte/${lot.id}`}>
          <Icon name="qr" size={18} />
          Pasaporte
        </Link>
      </div>
    </div>
  );
}
