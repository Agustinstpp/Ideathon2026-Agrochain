"use client";

import React, { useState } from "react";
import { QrSvg, publicUrl } from "@/components/ui/QrSvg";
import { Icon } from "@/components/ui/Icon";

interface QRCodeProps {
  value?: string;
  size?: number;
  title?: string;
  lotId?: string;
  className?: string;
}

export function QRCode({
  value,
  size = 200,
  title = "Pasaporte Digital",
  lotId = "GAN-001",
  className = "",
}: QRCodeProps) {
  const [copied, setCopied] = useState(false);

  const qrUrl = value || publicUrl(`/pasaporte/${encodeURIComponent(lotId)}`);
  const isLocal = /localhost|127\.0\.0\.1/.test(qrUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin clipboard */
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AgroChain - ${title}`,
          text: `Pasaporte del lote ${lotId}`,
          url: qrUrl,
        });
      } catch {
        /* cancelado */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className={`card ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 24,
        maxWidth: 360,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Icon name="qr" size={20} />
        <h4 style={{ fontSize: 18, margin: 0, fontFamily: "var(--font-display)" }}>{title}</h4>
      </div>

      <p className="xsmall muted" style={{ marginBottom: 16 }}>
        Escaneá con la cámara de un celular para acceder
      </p>

      <div
        style={{
          padding: 8,
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid var(--border)",
          display: "flex",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <QrSvg value={qrUrl} size={size} label={`Código QR de ${lotId}`} />
      </div>

      <span className="mono xsmall muted" style={{ wordBreak: "break-all", marginBottom: 16 }}>
        {qrUrl}
      </span>

      {isLocal && (
        <div className="alert info small" style={{ marginBottom: 16, textAlign: "left" }}>
          <Icon name="alert" size={16} />
          <span>Para escanear desde otro celular, usá la URL pública de Vercel.</span>
        </div>
      )}

      <div className="actions" style={{ width: "100%", justifyContent: "center" }}>
        <button type="button" className="btn small" onClick={handleShare}>
          Compartir
        </button>
        <button type="button" className="btn secondary small" onClick={handleCopy}>
          {copied ? "Copiado" : "Copiar enlace"}
        </button>
      </div>
    </div>
  );
}
