"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCattleLot, listFeed, listGrainLots } from "@/components/ui/data/client";
import { EmptyState, ErrorMessage, LoadingState, StatCard, StatusBadge, date, kg, num, useData } from "@/components/ui";
import { FeedHistory } from "@/components/feed/FeedHistory";
import { Icon } from "@/components/ui/Icon";
import { QrSvg, publicUrl } from "@/components/ui/QrSvg";

export default function CattleLotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const load = useCallback(async () => {
    const [lot, feed, grain] = await Promise.all([getCattleLot(id), listFeed(id), listGrainLots()]);
    return { lot, feed, grain };
  }, [id]);
  const { data, error, loading, reload } = useData(load);
  const [copied, setCopied] = useState(false);

  const lot = data?.lot;
  const feed = data?.feed || [];
  const passportPath = `/pasaporte/${id}`;
  const url = typeof window !== "undefined" ? publicUrl(passportPath) : passportPath;
  const isLocal = /localhost|127\.0\.0\.1/.test(url);

  const totalKg = feed.filter((f) => f.status !== "failed").reduce((s, f) => s + f.kg, 0);
  const crops = Array.from(new Set(feed.map((f) => f.crop)));
  const grainCodes = Array.from(new Set(feed.map((f) => f.grainLotId)));
  const sources = (data?.grain || []).filter((g) => grainCodes.includes(g.id));

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin portapapeles */
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Pasaporte ${lot?.code}`, url });
      } catch {
        /* cancelado */
      }
    } else copy();
  }

  return (
    <AppShell>
      <Link href="/lotes/ganaderos" className="small" style={{ display: "inline-flex", gap: 6, alignItems: "center", fontWeight: 600, marginBottom: -8 }}>
        ← Animales
      </Link>

      {loading && !data && <LoadingState />}
      {error && <ErrorMessage text={error} onRetry={reload} />}
      {data && !lot && (
        <section className="card">
          <EmptyState text="No encontramos este lote.">
            <Link className="btn secondary" href="/lotes/ganaderos">
              Volver a Animales
            </Link>
          </EmptyState>
        </section>
      )}

      {lot && (
        <>
          <div className="page-head">
            <div>
              <span className="mono xsmall muted">LOTE GANADERO</span>
              <h1 className="mono" style={{ fontFamily: "var(--font-display)" }}>
                {lot.code}
              </h1>
              <p>
                {num(lot.animals)} animales · {lot.establishmentName} · alta {date(lot.createdAt)}
              </p>
            </div>
            <div className="actions">
              <StatusBadge status={lot.status} />
              <Link className="btn" href={`/alimentacion?lote=${lot.id}`}>
                <Icon name="feed" /> Registrar alimentación
              </Link>
            </div>
          </div>

          <div className="stats">
            <StatCard label="Animales" value={num(lot.animals)} />
            <StatCard label="Alimento recibido" value={num(totalKg)} hint="kilogramos" tone="brown" />
            <StatCard label="Registros" value={num(feed.length)} />
            <StatCard
              label="Por animal"
              value={lot.animals ? num(Math.round(totalKg / lot.animals)) : "—"}
              hint="kg promedio"
              tone="dark"
            />
          </div>

          <div className="grid-2">
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <section className="card">
                <h2>Alimentación</h2>
                <FeedHistory items={feed} emptyText="Este lote todavía no tiene alimentación registrada." />
              </section>

              {sources.length > 0 && (
                <section className="card">
                  <h2>Origen del alimento</h2>
                  <div className="list">
                    {sources.map((g) => (
                      <div className="row" key={g.id}>
                        <div className="row-main">
                          <span className="row-title mono">{g.code}</span>
                          <span className="row-meta">
                            {g.crop} · {g.establishmentName}
                          </span>
                        </div>
                        <span className="small muted">quedan {kg(g.remainingKg)}</span>
                      </div>
                    ))}
                  </div>
                  {crops.length > 0 && <p className="small muted" style={{ marginTop: 8 }}>Cultivos: {crops.join(", ")}</p>}
                </section>
              )}
            </div>

            <section className="card passport-card">
              <h2>Pasaporte para el comprador</h2>
              <p className="small muted">Lo que ve quien escanea: lote, origen, alimentación y comprobantes.</p>
              <div className="passport-qr">
                <QrSvg value={url} size={200} label={`QR del pasaporte de ${lot.code}`} />
              </div>
              <span className="mono xsmall muted" style={{ wordBreak: "break-all", textAlign: "center" }}>
                {url}
              </span>
              {isLocal && (
                <div className="alert info small">
                  <Icon name="alert" size={18} />
                  <span>Este QR apunta a tu compu. Para que funcione en otro celular, usá la versión publicada en Vercel.</span>
                </div>
              )}
              <div className="actions" style={{ justifyContent: "center" }}>
                <Link className="btn" href={passportPath}>
                  <Icon name="external" size={18} /> Abrir pasaporte
                </Link>
                <button type="button" className="btn secondary" onClick={share}>
                  Compartir
                </button>
                <button type="button" className="btn secondary" onClick={copy}>
                  {copied ? "Copiado" : "Copiar enlace"}
                </button>
              </div>
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}
