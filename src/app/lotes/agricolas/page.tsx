"use client";
import { AppShell } from "@/components/layout/AppShell";
import { listGrainLots } from "@/components/ui/data/client";
import { EmptyState, ErrorMessage, LoadingState, useData } from "@/components/ui";
import { GrainLotForm } from "@/components/lots/GrainLotForm";
import { GrainLotCard } from "@/components/lots/LotCards";

export default function GrainLotsPage() {
  const { data, error, loading, reload } = useData(listGrainLots);

  return (
    <AppShell>
      <div className="page-head">
        <div>
          <h1>Alimento</h1>
          <p>Lotes de grano y cuánto queda en cada uno.</p>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Lotes</h2>
          {loading && <LoadingState />}
          {error && <ErrorMessage text={error} onRetry={reload} />}
          {data && !data.length && <EmptyState text="Todavía no cargaste alimento." />}
          {data && data.length > 0 && (
            <div className="list">
              {data.map((l) => (
                <GrainLotCard key={l.id} lot={l} />
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2>Nuevo lote</h2>
          <GrainLotForm onCreated={reload} />
        </section>
      </div>
    </AppShell>
  );
}
