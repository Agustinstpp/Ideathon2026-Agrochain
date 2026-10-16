import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { passportService } from "@/lib/passport/passportService";
import { Icon } from "@/components/ui/Icon";

const kg = (n: number) => `${n.toLocaleString("es-AR")} kg`;
const num = (n: number) => n.toLocaleString("es-AR");

export const metadata: Metadata = {
  title: "Pasaportes Digitales Ganaderos | AgroChain FeedTrace",
  description: "Consulta pública de expedientes digitales y trazabilidad de lotes ganaderos.",
};

export default function PassportsDirectoryPage() {
  const demoPassports = passportService.getAvailableDemoPassports();

  return (
    <div className="ag shell" style={{ minHeight: "100vh" }}>
      <div className="container" style={{ maxWidth: 960, margin: "0 auto" }}>
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0 16px",
            borderBottom: "1px solid var(--border)",
            marginBottom: 20,
          }}
        >
          <Link
            href="/inicio"
            className="small"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
              color: "var(--muted)",
              fontWeight: 600,
            }}
          >
            <Icon name="home" size={16} /> AgroChain
          </Link>

          <span className="mono xsmall muted">CONSULTA PÚBLICA ABIERTA</span>
        </nav>

        <header className="page-head" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="mono" style={{ fontSize: 32, fontFamily: "var(--font-display)" }}>
              Pasaportes Digitales
            </h1>
            <p className="small muted">
              Verificación pública de procedencia animal y raciones agrícolas recibidas
            </p>
          </div>
        </header>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Lotes de demostración disponibles</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {demoPassports.map((item) => {
              const isSimulated = item.status === "simulated" || item.is_simulated;

              return (
                <div
                  key={item.lot_id}
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <span className={`badge ${isSimulated ? "sim" : "wait"}`}>
                        {isSimulated ? "Simulado" : "Pendiente"}
                      </span>
                      <span className="mono xsmall muted">{item.lot_id}</span>
                    </div>

                    <h3 className="mono" style={{ fontSize: 24, marginBottom: 6 }}>
                      Lote {item.lot_id}
                    </h3>

                    <p className="small" style={{ marginBottom: 4 }}>
                      <strong>{num(item.cattle.animal_count)} animales</strong>
                      {item.cattle.establishment_name ? ` · ${item.cattle.establishment_name}` : ""}
                    </p>

                    {(item.cattle.locality || item.cattle.province) && (
                      <p className="xsmall muted" style={{ marginBottom: 12 }}>
                        {[item.cattle.locality, item.cattle.province].filter(Boolean).join(", ")}
                      </p>
                    )}

                    {item.feeding_history[0] && (
                      <div
                        style={{
                          background: "var(--card-alt)",
                          border: "1px solid var(--border-soft)",
                          padding: "8px 12px",
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      >
                        <span className="muted">Alimento: </span>
                        <strong>
                          {item.feeding_history[0].crop} ({kg(item.feeding_history[0].quantity_kg)})
                        </strong>
                      </div>
                    )}
                  </div>

                  <Link href={`/pasaporte/${item.lot_id}`} className="btn small block">
                    Abrir pasaporte
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <footer
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: "1px solid var(--border)",
            textAlign: "center",
          }}
          className="xsmall muted"
        >
          AgroChain FeedTrace · Pasaportes Digitales · NEA Tech 2026
        </footer>
      </div>
    </div>
  );
}
