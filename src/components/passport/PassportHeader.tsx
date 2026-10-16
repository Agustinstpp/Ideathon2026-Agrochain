'use client';

import React from 'react';
import { PassportData } from '@/lib/passport/types';

interface PassportHeaderProps {
  passport: PassportData;
  onOpenQrModal?: () => void;
}

export const PassportHeader: React.FC<PassportHeaderProps> = ({ passport, onOpenQrModal }) => {
  const isPending = passport.status === 'pending';
  const isSimulated = passport.is_simulated;

  return (
    <header
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1.5rem 1rem',
        borderRadius: '16px',
        marginBottom: '1.25rem',
        position: 'relative',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Aviso de Demostración */}
      {isSimulated && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '8px',
            padding: '0.4rem 0.75rem',
            marginBottom: '1rem',
            fontSize: '0.75rem',
            color: '#fef08a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⚠️</span>
            <span>
              <strong>Aviso de Demostración:</strong> Datos ficticios preparados para NEA Tech 2026.
            </span>
          </div>
          <span
            style={{
              background: 'rgba(234, 179, 8, 0.25)',
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          >
            SIMULADO
          </span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--accent-green)',
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
              }}
            >
              AgroChain FeedTrace
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Pasaporte Digital Ganadero
            </span>
          </div>

          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '0.25rem 0',
              letterSpacing: '-0.02em',
            }}
          >
            Lote {passport.cattle.external_code}
          </h1>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Actualización:{' '}
            {new Date(passport.updated_at).toLocaleDateString('es-AR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Acciones y Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          {/* Badge de Estado */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: isPending
                ? 'rgba(245, 158, 11, 0.2)'
                : 'rgba(16, 185, 129, 0.2)',
              color: isPending ? '#fbbf24' : '#34d399',
              border: `1px solid ${isPending ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isPending ? '#fbbf24' : '#10b981',
                boxShadow: `0 0 8px ${isPending ? '#fbbf24' : '#10b981'}`,
              }}
            />
            {isPending ? 'Pendiente' : 'Registro blockchain confirmado'}
          </div>

          {onOpenQrModal && (
            <button
              onClick={onOpenQrModal}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: 'var(--accent-blue)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span>📷 Ver QR / Compartir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
