"use client";

import React, { useEffect, useState } from "react";
import "@/components/ui/agrochain.css";
import Link from "next/link";
import { PassportData, isRealBlockchainTx } from "@/lib/passport/types";
import { Icon } from "@/components/ui/Icon";
import { QrSvg, publicUrl } from "@/components/ui/QrSvg";
import { num, kg, date } from "@/components/ui";

interface PassportLightViewProps {
  passport: PassportData;
}

export function PassportLightView({ passport }: PassportLightViewProps) {
  const [copied, setCopied] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const lotId = passport.cattle.external_code || passport.lot_id;
  const path = `/pasaporte/${encodeURIComponent(lotId)}`;
  // La URL completa se arma en el navegador: en el servidor no hay dominio y React marca error de hidratación.
  const [qrUrl, setQrUrl] = useState(process.env.NEXT_PUBLIC_APP_URL ? publicUrl(path) : path);
  useEffect(() => setQrUrl(publicUrl(path)), [path]);
  const isLocal = /localhost|127\.0\.0\.1/.test(qrUrl);

  const isReal = isRealBlockchainTx(
    passport.blockchain_verification.tx_hash,
    passport.blockchain_verification.chain_id,
    passport.is_simulated
  );

  const totalAssignedKg = passport.feeding_history.reduce((sum, item) => sum + item.quantity_kg, 0);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin clipboard */
    }
  };

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      /* sin clipboard */
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pasaporte Ganadero Lote ${lotId}`,
          text: `Pasaporte digital del lote ${lotId} en AgroChain FeedTrace`,
          url: qrUrl,
        });
      } catch {
        /* cancelado */
      }
    } else {
      copyUrl();
    }
  };

  return (
    <div className="ag shell" style={{ minHeight: "100vh" }}>
      <div className="container" style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Navegación superior */}
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

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="xsmall mono muted">DEMO:</span>
            <Link
              href="/pasaporte/GAN-001"
              className={`badge ${passport.lot_id === "GAN-001" ? "sim" : ""}`}
              style={{ textDecoration: "none" }}
            >
              GAN-001
            </Link>
            <Link
              href="/pasaporte/GAN-PENDING"
              className={`badge ${passport.lot_id === "GAN-PENDING" ? "wait" : ""}`}
              style={{ textDecoration: "none" }}
            >
              GAN-PENDING
            </Link>
          </div>
        </nav>

        {/* Encabezado del Pasaporte */}
        <div className="page-head" style={{ marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="mono xsmall muted">PASAPORTE DIGITAL GANADERO</span>
            </div>
            <h1 className="mono" style={{ fontSize: 32, fontFamily: "var(--font-display)" }}>
              Lote {lotId}
            </h1>
            <p className="small muted">
              Actualizado el {date(passport.updated_at)} · Consulta pública sin login
            </p>
          </div>

          <div className="actions" style={{ alignItems: "center" }}>
            {isReal ? (
              <span className="badge ok">
                <Icon name="check" size={14} /> Registro verificable
              </span>
            ) : passport.status === "pending" ? (
              <span className="badge wait">
                <Icon name="clock" size={14} /> Pendiente
              </span>
            ) : (
              <span className="badge sim">
                <Icon name="alert" size={14} /> Simulado
              </span>
            )}
          </div>
        </div>

        {/* Aviso obligatorio si el registro no es real en testnet pública */}
        {!isReal && (
          <div className="alert info" style={{ marginBottom: 24 }}>
            <Icon name="alert" size={20} />
            <div>
              <strong>Modo de Demostración</strong>
              <span>Datos de demostración. No hay un registro en blockchain que verificar.</span>
            </div>
          </div>
        )}

        {/* Estadísticas Clave */}
        <div className="stats" style={{ marginBottom: 24 }}>
          <div className="card stat">
            <span className="stat-label">Animales</span>
            <strong className="stat-value">{num(passport.cattle.animal_count)}</strong>
            <span className="stat-hint">cabezas en lote</span>
          </div>

          <div className="card stat">
            <span className="stat-label">Alimento Asignado</span>
            <strong className="stat-value brown">{num(totalAssignedKg)}</strong>
            <span className="stat-hint">kg registrados</span>
          </div>
        </div>

        {/* Secciones en Columnas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Tarjeta 1: Información Ganadera */}
          <section className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Icon name="cattle" size={22} />
              <h2>Información del Lote</h2>
            </div>

            <div className="list">
              <div className="row">
                <div className="row-main">
                  <span className="row-title">Cantidad de animales</span>
                </div>
                <span className="row-side mono" style={{ fontWeight: 600 }}>
                  {num(passport.cattle.animal_count)} cabezas
                </span>
              </div>

              {passport.cattle.establishment_name && (
                <div className="row">
                  <div className="row-main">
                    <span className="row-title">Establecimiento</span>
                  </div>
                  <span className="row-side" style={{ fontWeight: 600 }}>
                    {passport.cattle.establishment_name}
                  </span>
                </div>
              )}

              {(passport.cattle.locality || passport.cattle.province) && (
                <div className="row">
                  <div className="row-main">
                    <span className="row-title">Ubicación</span>
                  </div>
                  <span className="row-side">
                    {[passport.cattle.locality, passport.cattle.province].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}

              {passport.cattle.establishment_hash && (
                <div className="row">
                  <div className="row-main">
                    <span className="row-title">Hash de establecimiento</span>
                    <span className="row-meta mono xsmall" style={{ wordBreak: "break-all" }}>
                      {passport.cattle.establishment_hash}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn secondary small"
                    onClick={() => copyHash(passport.cattle.establishment_hash!)}
                  >
                    {copiedHash ? "Copiado" : "Copiar"}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Tarjeta 2: Historial de Alimentación */}
          <section className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Icon name="feed" size={22} />
              <h2>Alimentación Trazable</h2>
            </div>

            {passport.feeding_history.length === 0 ? (
              <p className="small muted">No hay raciones de alimento registradas para este lote.</p>
            ) : (
              <div className="list">
                {passport.feeding_history.map((record) => (
                  <div className="row" key={record.assignment_id}>
                    <div className="row-main">
                      <span className="row-title">
                        {record.crop} · <span className="mono">{record.grain_lot_code}</span>
                      </span>
                      <span className="row-meta">
                        {record.origin_farm ? `${record.origin_farm} · ` : ""}
                        Período: {date(record.period_start)} al {date(record.period_end)}
                      </span>
                    </div>

                    <div className="row-side">
                      <span className="mono" style={{ fontWeight: 700, color: "var(--green)" }}>
                        {kg(record.quantity_kg)}
                      </span>
                      {record.remaining_grain_lot_quantity_kg !== undefined && (
                        <span className="xsmall muted" style={{ display: "block" }}>
                          (quedan {kg(record.remaining_grain_lot_quantity_kg)} en silo)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tarjeta 3: Evidencias Públicas */}
          {passport.evidence_documents.length > 0 && (
            <section className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Icon name="grain" size={22} />
                <h2>Evidencias Documentales</h2>
              </div>

              <div className="list">
                {passport.evidence_documents.map((doc) => (
                  <div className="row" key={doc.id}>
                    <div className="row-main">
                      <span className="row-title">{doc.title}</span>
                      <span className="row-meta mono xsmall" style={{ wordBreak: "break-all" }}>
                        SHA-256: {doc.sha256_hash}
                      </span>
                    </div>
                    <span className="badge sim">{doc.status}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tarjeta 4: Verificación Blockchain */}
          <section className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Icon name="check" size={22} />
              <h2>Estado de Verificación Blockchain</h2>
            </div>

            {isReal ? (
              <div className="list">
                <div className="row">
                  <div className="row-main">
                    <span className="row-title">Red</span>
                  </div>
                  <span className="row-side mono">{passport.blockchain_verification.network}</span>
                </div>

                <div className="row">
                  <div className="row-main">
                    <span className="row-title">Contrato Inteligente</span>
                    <span className="row-meta mono xsmall" style={{ wordBreak: "break-all" }}>
                      {passport.blockchain_verification.contract_address}
                    </span>
                  </div>
                </div>

                {passport.blockchain_verification.tx_hash && (
                  <div className="row">
                    <div className="row-main">
                      <span className="row-title">Transacción</span>
                      <span className="row-meta mono xsmall" style={{ wordBreak: "break-all" }}>
                        {passport.blockchain_verification.tx_hash}
                      </span>
                    </div>
                    {passport.blockchain_verification.explorer_url && (
                      <a
                        href={passport.blockchain_verification.explorer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn secondary small"
                      >
                        <Icon name="external" size={14} /> Explorador
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="small muted" style={{ marginBottom: 12 }}>
                  El backend se encuentra operando en modo simulado para desarrollo y demostración.
                  No hay transacciones registradas en una red pública que verificar.
                </p>
                <div className="row">
                  <div className="row-main">
                    <span className="row-title">Estado</span>
                  </div>
                  <span className="badge sim">Simulado</span>
                </div>
              </div>
            )}
          </section>

          {/* Tarjeta 5: Código QR Escaneable */}
          <section className="card" style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
              <Icon name="qr" size={24} />
              <h2>Código QR del Pasaporte</h2>
            </div>

            <p className="small muted" style={{ marginBottom: 20 }}>
              Escaneá con la cámara de un celular para abrir esta ficha técnica pública.
            </p>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <QrSvg value={qrUrl} size={220} label={`Código QR de Lote ${lotId}`} />
            </div>

            <div className="mono xsmall muted" style={{ wordBreak: "break-all", marginBottom: 16 }}>
              {qrUrl}
            </div>

            {isLocal && (
              <div className="alert info small" style={{ marginBottom: 16, textAlign: "left" }}>
                <Icon name="alert" size={18} />
                <span>
                  Este QR apunta a una dirección local. Para escanearlo desde otro dispositivo fuera de tu compu,
                  usá la URL pública desplegada en Vercel.
                </span>
              </div>
            )}

            <div className="actions" style={{ justifyContent: "center" }}>
              <button type="button" className="btn" onClick={share}>
                Compartir
              </button>
              <button type="button" className="btn secondary" onClick={copyUrl}>
                {copied ? "Copiado" : "Copiar enlace"}
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: "1px solid var(--border)",
            textAlign: "center",
          }}
          className="xsmall muted"
        >
          AgroChain FeedTrace · Pasaporte Digital Ganadero · NEA Tech 2026
        </footer>
      </div>
    </div>
  );
}
