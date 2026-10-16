"use client";
import { Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { listCattleLots, listFeed, listGrainLots } from "@/components/ui/data/client";
import { EmptyState, ErrorMessage, LoadingState, useData } from "@/components/ui";
import { FeedAssignmentForm } from "@/components/feed/FeedAssignmentForm";
import { FeedHistory } from "@/components/feed/FeedHistory";

function FeedScreen() {
  const loteParam = useSearchParams().get("lote") || undefined;
  const load = useCallback(async () => {
    const [grain, cattle, feed] = await Promise.all([listGrainLots(), listCattleLots(), listFeed()]);
    return { grain, cattle, feed };
  }, []);
  const { data, error, loading, reload } = useData(load);

  const history = data ? (loteParam ? data.feed.filter((f) => f.cattleLotId === loteParam) : data.feed) : [];
  const selected = data?.cattle.find((c) => c.id === loteParam);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Alimentación</h1>
          <p>Registrá cuánto alimento recibió cada lote.</p>
        </div>
      </div>

      {loading && !data && <LoadingState />}
      {error && <ErrorMessage text={error} onRetry={reload} />}

      {data && (
        <div className="grid-2">
          <section className="card">
            <h2>Registrar alimentación</h2>
            {data.grain.length && data.cattle.length ? (
              <FeedAssignmentForm
                grainLots={data.grain}
                cattleLots={data.cattle}
                initialCattleId={loteParam}
                onDone={reload}
              />
            ) : (
              <EmptyState text="Necesitás al menos un lote de alimento y uno de animales." />
            )}
          </section>

          <section className="card">
            <h2>Historial{selected ? ` · ${selected.code}` : ""}</h2>
            <FeedHistory items={history} />
          </section>
        </div>
      )}
    </>
  );
}

export default function FeedPage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingState />}>
        <FeedScreen />
      </Suspense>
    </AppShell>
  );
}
