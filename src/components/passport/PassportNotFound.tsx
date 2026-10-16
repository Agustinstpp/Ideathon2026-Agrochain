"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

interface PassportNotFoundProps {
  searchedId: string;
}

export function PassportNotFound({ searchedId }: PassportNotFoundProps) {
  const router = useRouter();
  const [customId, setCustomId] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customId.trim()) {
      router.push(`/pasaporte/${encodeURIComponent(customId.trim())}`);
    }
  };

  return (
    <div className="ag shell" style={{ minHeight: "100vh" }}>
      <div className="container" style={{ maxWidth: 640, margin: "40px auto 0" }}>
        <div className="card" style={{ textAlign: "center", padding: "32px 24px" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--red-soft)",
              color: "var(--red)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
            }}
          >
            <Icon name="alert" size={26} />
          </div>

          <h1 style={{ fontSize: 24, marginBottom: 8, fontFamily: "var(--font-display)" }}>
            Pasaporte no encontrado
          </h1>

          <p className="small muted" style={{ marginBottom: 24, lineHeight: 1.5 }}>
            No encontramos ningún lote registrado con el identificador{" "}
            <span className="mono" style={{ background: "var(--card-alt)", padding: "2px 6px", borderRadius: 4 }}>
              {searchedId}
            </span>
            .
          </p>

          <div
            style={{
              background: "var(--card-alt)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              textAlign: "left",
            }}
          >
            <span className="xsmall mono muted" style={{ display: "block", marginBottom: 12 }}>
              LOTES DE DEMOSTRACIÓN DISPONIBLES:
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link
                href="/pasaporte/GAN-001"
                className="row"
                style={{
                  textDecoration: "none",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="row-main">
                  <span className="row-title mono">Lote GAN-001</span>
                  <span className="row-meta">20 animales en Mercedes, Corrientes · Maíz (Simulado)</span>
                </div>
                <span className="badge sim">Abrir</span>
              </Link>

              <Link
                href="/pasaporte/GAN-PENDING"
                className="row"
                style={{
                  textDecoration: "none",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="row-main">
                  <span className="row-title mono">Lote GAN-PENDING</span>
                  <span className="row-meta">35 animales · Asignación pendiente</span>
                </div>
                <span className="badge wait">Abrir</span>
              </Link>
            </div>
          </div>

          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder="Consultar otro código de lote..."
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                border: "1px solid var(--input-border)",
                padding: "0 14px",
                background: "#fff",
              }}
            />
            <button type="submit" className="btn small">
              Buscar
            </button>
          </form>

          <div style={{ marginTop: 24 }}>
            <Link href="/inicio" className="small" style={{ textDecoration: "none", color: "var(--green)" }}>
              ← Volver al panel de AgroChain
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
