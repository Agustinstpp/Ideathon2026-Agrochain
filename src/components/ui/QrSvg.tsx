"use client";
import { useMemo } from "react";
import qrcodegen from "./qrcodegen";

/** QR en SVG, escaneable (librería probada, sin dependencias). */
export function QrSvg({ value, size = 200, label }: { value: string; size?: number; label?: string }) {
  const { path, n } = useMemo(() => {
    const qr = qrcodegen.QrCode.encodeText(value, qrcodegen.QrCode.Ecc.MEDIUM);
    let d = "";
    for (let y = 0; y < qr.size; y++)
      for (let x = 0; x < qr.size; x++) if (qr.getModule(x, y)) d += `M${x + 4} ${y + 4}h1v1h-1z`;
    return { path: d, n: qr.size + 8 };
  }, [value]);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${n} ${n}`}
      role="img"
      aria-label={label || `Código QR: ${value}`}
      shapeRendering="crispEdges"
      style={{ background: "#fff", borderRadius: 12, display: "block" }}
    >
      <rect width={n} height={n} fill="#fff" />
      <path d={path} fill="#1e2a21" />
    </svg>
  );
}

/** URL pública de una ruta: usa NEXT_PUBLIC_APP_URL si está, si no el dominio actual. */
export function publicUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
  return base.replace(/\/$/, "") + path;
}
