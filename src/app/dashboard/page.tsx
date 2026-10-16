"use client";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getDashboard } from "@/components/ui/data/client";
import { ErrorMessage, LoadingState, StatCard, num, useData } from "@/components/ui";
import { FeedHistory } from "@/components/feed/FeedHistory";
import { Icon } from "@/components/ui/Icon";

export default function DashboardPage() {
  const { data, error, loading, reload } = useData(getDashboard);

  return (
    <AppShell>
      <div className="page-head">
        <div>
          <h1>Inicio</h1>
          <p>Resumen de tus lotes y la alimentación registrada.</p>
        </div>
        <div className="actions">
          <Link className="btn" href="/alimentacion">
            <Icon name="feed" />
            Registrar alimentación
          </Link>
        </div>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorMessage text={error} onRetry={reload} />}

      {data && (
        <>
          <div className="stats">
            <StatCard label="Lotes de animales" value={num(data.cattleLots)} />
            <StatCard label="Animales" value={num(data.animals)} />
            <StatCard label="Lotes de alimento" value={num(data.grainLots)} tone="brown" />
            <StatCard label="Alimento asignado" value={num(data.assignedKg)} hint="kilogramos" tone="dark" />
          </div>

          <div className="grid-2">
            <section className="card">
              <h2>Últimos registros</h2>
              <FeedHistory items={data.recent} />
            </section>

            <section className="card">
              <h2>Accesos rápidos</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link className="btn secondary block" href="/lotes/ganaderos">
                  <Icon name="cattle" /> Registrar lote de animales
                </Link>
                <Link className="btn secondary block" href="/lotes/agricolas">
                  <Icon name="grain" /> Registrar alimento
                </Link>
                <Link className="btn secondary block" href="/lotes/ganaderos">
                  <Icon name="qr" /> Ver pasaportes
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}
