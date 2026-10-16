'use client';

import React, { useState } from 'react';
import { PassportCattleInfo } from '@/lib/passport/types';

interface PassportCattleCardProps {
  cattle: PassportCattleInfo;
}

export const PassportCattleCard: React.FC<PassportCattleCardProps> = ({ cattle }) => {
  const [copiedHash, setCopiedHash] = useState(false);

  const handleCopyHash = () => {
    if (cattle.establishment_hash) {
      navigator.clipboard.writeText(cattle.establishment_hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.25rem',
        marginBottom: '1.25rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🐂</span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Información Ganadera
          </h2>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#38bdf8',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
          }}
        >
          Declarado con Hash
        </span>
      </div>

      {/* Grid de Datos Principales */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        {/* Cantidad de Animales */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '0.85rem',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
            Cantidad de Animales
          </span>
          <strong style={{ fontSize: '1.4rem', color: 'var(--accent-green)', fontWeight: 800 }}>
            {cattle.animal_count}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
            cabezas
          </span>
        </div>

        {/* Especie / Categoría */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '0.85rem',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
            Categoría / Raza
          </span>
          <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'block', marginTop: '0.35rem' }}>
            {cattle.species || cattle.category || 'Bovino'}
          </strong>
        </div>

        {/* Ubicación */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '0.85rem',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
            Provincia y Localidad
          </span>
          <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'block', marginTop: '0.35rem' }}>
            {cattle.locality}, {cattle.province}
          </strong>
        </div>
      </div>

      {/* Establecimiento y RENSPA */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          fontSize: '0.85rem',
          borderTop: '1px dashed var(--border-color)',
          paddingTop: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Establecimiento:</span>
          <strong style={{ color: 'var(--text-main)' }}>{cattle.establishment_name}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Origen Declarado:</span>
          <span style={{ color: 'var(--text-main)' }}>{cattle.declared_origin}</span>
        </div>

        {cattle.renspa_declared && (
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>RENASA / RENSPA Declarado:</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--accent-blue)' }}>
              {cattle.renspa_declared}
            </span>
          </div>
        )}

        {/* Comprobante Criptográfico Hash del Establecimiento */}
        <div
          style={{
            marginTop: '0.4rem',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '0.6rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Hash de Origen (Georreferencia / RENSPA Keccak-256):
            </span>
            <button
              onClick={handleCopyHash}
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: copiedHash ? '#34d399' : 'var(--accent-blue)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                padding: '0.1rem 0.3rem',
              }}
            >
              {copiedHash ? '✓ Copiado' : 'Copiar Hash'}
            </button>
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              color: '#94a3b8',
              wordBreak: 'break-all',
            }}
          >
            {cattle.establishment_hash}
          </div>
        </div>
      </div>
    </div>
  );
};
