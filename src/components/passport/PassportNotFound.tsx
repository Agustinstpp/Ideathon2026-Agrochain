'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PassportNotFoundProps {
  searchedId: string;
}

export const PassportNotFound: React.FC<PassportNotFoundProps> = ({ searchedId }) => {
  const router = useRouter();
  const [customId, setCustomId] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customId.trim()) {
      router.push(`/pasaporte/${encodeURIComponent(customId.trim())}`);
    }
  };

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '3rem auto',
        padding: '2rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          margin: '0 auto 1.25rem',
        }}
      >
        🔍
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
        Pasaporte No Encontrado
      </h1>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        No se encontró ningún lote ganadero ni expediente digital registrado bajo el identificador{' '}
        <code
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            color: 'var(--accent-blue)',
          }}
        >
          {searchedId}
        </code>
        .
      </p>

      {/* Selector de Lotes Demo */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          textAlign: 'left',
        }}
      >
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-green)', marginBottom: '0.75rem' }}>
          💡 Lotes Disponibles para Demostración (NEA Tech 2026):
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link
            href="/pasaporte/GAN-001"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'var(--text-main)',
              transition: 'all 0.2s',
            }}
          >
            <div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--accent-green)' }}>Lote GAN-001</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                20 Novillos en Mercedes, Corrientes • Maíz 2.000 kg asignados (Confirmado)
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 700 }}>Abrir →</span>
          </Link>

          <Link
            href="/pasaporte/GAN-PENDING"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'var(--text-main)',
            }}
          >
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#fbbf24' }}>Lote GAN-PENDING</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                35 Terneros en Curuzú Cuatiá • Asignación pendiente de minado
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>Abrir →</span>
          </Link>
        </div>
      </div>

      {/* Buscar por ID personalizado */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={customId}
          onChange={(e) => setCustomId(e.target.value)}
          placeholder="Ingresar otro código o UUID..."
          style={{
            flex: 1,
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'rgba(0, 0, 0, 0.3)',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--accent-blue)',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Consultar
        </button>
      </form>
    </div>
  );
};
