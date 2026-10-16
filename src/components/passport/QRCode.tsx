'use client';

import React, { useMemo, useState } from 'react';
import { generateQrMatrix } from '@/lib/passport/qrCodeGenerator';

interface QRCodeProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  title?: string;
  lotId?: string;
  className?: string;
}

export const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 200,
  fgColor = '#0f172a',
  bgColor = '#ffffff',
  title = 'Código QR de Pasaporte Digital',
  lotId = 'GAN-001',
  className = '',
}) => {
  const [selectedUrlMode, setSelectedUrlMode] = useState<'production' | 'current'>('production');
  const [copied, setCopied] = useState(false);

  // URL pública oficial de producción para la entrega y demo
  const productionUrl = `https://agrochain-feedtrace.vercel.app/pasaporte/${encodeURIComponent(lotId)}`;

  // Determinar la URL final a codificar en el QR
  const qrUrl = useMemo(() => {
    if (selectedUrlMode === 'production') {
      return productionUrl;
    }
    // Si value tiene localhost, pero estamos en modo production, usar producción
    if (value.includes('localhost') || value.includes('127.0.0.1')) {
      return productionUrl;
    }
    return value || productionUrl;
  }, [selectedUrlMode, value, productionUrl]);

  // Generar la matriz QR
  const matrix = useMemo(() => {
    try {
      return generateQrMatrix(qrUrl, 'M');
    } catch (e) {
      console.error('Error generating QR matrix:', e);
      return [];
    }
  }, [qrUrl]);

  const matrixSize = matrix.length;
  const padding = 2; // Margen o quiet zone
  const totalDim = matrixSize + padding * 2;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AgroChain FeedTrace - Pasaporte Lote ${lotId}`,
          text: `Pasaporte digital ganadero y trazabilidad de alimentación verificable para el lote ${lotId}.`,
          url: qrUrl,
        });
      } catch (err) {
        // Ignorar cancelaciones del usuario
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.25rem',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        color: '#0f172a',
        maxWidth: '340px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#059669',
            backgroundColor: '#d1fae5',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            display: 'inline-block',
            marginBottom: '0.35rem',
          }}
        >
          Acceso Público Móvil
        </span>
        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
          {title}
        </h4>
        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
          Escaneá con la cámara de tu celular
        </p>
      </div>

      {/* SVG del QR */}
      <div
        style={{
          padding: '0.75rem',
          backgroundColor: bgColor,
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <svg
          viewBox={`0 0 ${totalDim} ${totalDim}`}
          width={size}
          height={size}
          style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
          shapeRendering="crispEdges"
        >
          <rect width={totalDim} height={totalDim} fill={bgColor} />
          {matrix.map((row, r) =>
            row.map((col, c) =>
              col ? (
                <rect
                  key={`${r}-${c}`}
                  x={c + padding}
                  y={r + padding}
                  width="1"
                  height="1"
                  fill={fgColor}
                />
              ) : null
            )
          )}
        </svg>
      </div>

      {/* Selector de URL para asegurar que nunca use localhost */}
      <div style={{ marginTop: '0.75rem', width: '100%', fontSize: '0.75rem', color: '#475569' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.4rem',
            padding: '0.35rem 0.5rem',
            background: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
          }}
        >
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Destino QR:</span>
          <span style={{ color: '#059669', fontWeight: 500 }}>Sin localhost</span>
        </div>

        <div
          style={{
            wordBreak: 'break-all',
            padding: '0.5rem',
            background: '#f1f5f9',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            color: '#334155',
            marginBottom: '0.75rem',
            border: '1px solid #cbd5e1',
          }}
        >
          {qrUrl}
        </div>
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
        <button
          onClick={handleCopy}
          type="button"
          style={{
            flex: 1,
            padding: '0.6rem 0.75rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: copied ? '#10b981' : '#f8fafc',
            color: copied ? '#ffffff' : '#1e293b',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
        >
          {copied ? '✓ Enlace Copiado' : '📋 Copiar Enlace'}
        </button>

        <button
          onClick={handleShare}
          type="button"
          style={{
            flex: 1,
            padding: '0.6rem 0.75rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            background: '#0284c7',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
        >
          📱 Compartir
        </button>
      </div>
    </div>
  );
};
