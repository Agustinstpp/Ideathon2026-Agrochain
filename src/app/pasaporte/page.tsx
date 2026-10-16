import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { passportService } from '@/lib/passport/passportService';

export const metadata: Metadata = {
  title: 'Pasaportes Digitales Ganaderos | AgroChain FeedTrace',
  description: 'Consulta pública de expedientes digitales y trazabilidad de lotes ganaderos.',
};

export default function PassportsDirectoryPage() {
  const demoPassports = passportService.getAvailableDemoPassports();

  return (
    <main style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--accent-green)',
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
            }}
          >
            Acceso Público Libre
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            No requiere inicio de sesión
          </span>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.25rem 0' }}>
          Pasaportes Digitales Ganaderos
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Verificación de procedencia, historial de raciones agrícolas y comprobación criptográfica on-chain.
        </p>
      </header>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
          Lotes de Demostración Disponibles (NEA Tech 2026)
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {demoPassports.map((item) => {
            const isConfirmed = item.status === 'confirmed';

            return (
              <div
                key={item.lot_id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        background: isConfirmed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isConfirmed ? '#34d399' : '#fbbf24',
                        border: `1px solid ${isConfirmed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                      }}
                    >
                      {isConfirmed ? 'Confirmado on-chain' : 'Pendiente'}
                    </span>

                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      SIMULADO
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--text-main)' }}>
                    Lote {item.lot_id}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0' }}>
                    <strong>{item.cattle.animal_count} animales</strong> • {item.cattle.establishment_name}
                  </p>

                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                    {item.cattle.locality}, {item.cattle.province}
                  </p>

                  <div
                    style={{
                      marginTop: '0.75rem',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Alimento: </span>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                      {item.feeding_history[0]?.crop || 'Sin ración'} (
                      {item.feeding_history[0]?.quantity_kg.toLocaleString('es-AR')} kg)
                    </span>
                  </div>
                </div>

                <Link
                  href={`/pasaporte/${item.lot_id}`}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    background: 'var(--accent-green)',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  Abrir Pasaporte Digital →
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Acceso a inicio */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link
          href="/"
          style={{
            color: 'var(--accent-blue)',
            fontSize: '0.85rem',
            textDecoration: 'none',
          }}
        >
          ← Volver a la página principal de AgroChain
        </Link>
      </div>
    </main>
  );
}
