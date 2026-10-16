"use client";
import { AppShell } from "@/components/layout/AppShell";
import { listCattleLots } from "@/components/ui/data/client";
import { EmptyState, ErrorMessage, LoadingState, useData } from "@/components/ui";
import { CattleLotForm } from "@/components/lots/CattleLotForm";
import { CattleLotCard } from "@/components/lots/LotCards";

export default function CattleLotsPage() {
  const { data, error, loading, reload } = useData(listCattleLots);

  return (
    <AppShell>
      <div className="page-head">
        <div>
          <h1>Animales</h1>
          <p>Lotes de animales, su historial y su pasaporte.</p>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Lotes</h2>
          {loading && <LoadingState />}
          {error && <ErrorMessage text={error} onRetry={reload} />}
          {data && !data.length && <EmptyState text="Todavía no cargaste lotes de animales." />}
          {data && data.length > 0 && (
            <div className="list">
              {data.map((l) => (
                <CattleLotCard key={l.id} lot={l} />
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2>Nuevo lote</h2>
          <CattleLotForm onCreated={reload} />
        </section>
      </div>
    </AppShell>
  );
}
