'use client';

import React from 'react';
import { PassportFeedingRecord } from '@/lib/passport/types';

interface PassportFeedingSectionProps {
  records: PassportFeedingRecord[];
}

export const PassportFeedingSection: React.FC<PassportFeedingSectionProps> = ({ records }) => {
  const totalFeedKg = records.reduce((acc, curr) => acc + curr.quantity_kg, 0);

  return (
    <section
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
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🌽</span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Historial de Alimentación Trazable
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--accent-green)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
            }}
          >
            Total: {totalFeedKg.toLocaleString('es-AR')} kg Asignados
          </span>
        </div>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
        Vinculación cuantitativa directa entre lote agrícola de origen y lote ganadero.
        Los saldos se descuentan en el Smart Contract para evitar la doble asignación de granos (anti double-spending).
      </p>

      {records.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}
        >
          No hay raciones de alimentación registradas aún para este lote.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {records.map((record) => {
            const isConfirmed = record.status === 'confirmed';
            const initialKg = record.initial_grain_lot_quantity_kg || 10000;
            const remainingKg = record.remaining_grain_lot_quantity_kg || 8000;
            const assignedKg = record.quantity_kg;
            const assignedPercent = Math.min(100, Math.round((assignedKg / initialKg) * 100));

            return (
              <div
                key={record.assignment_id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Header de la ración */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--accent-blue)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Lote Agrícola Vinculado
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.15rem 0', color: 'var(--text-main)' }}>
                      {record.crop} ({record.grain_lot_code})
                    </h3>
                    {record.origin_farm && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {record.origin_farm} • {record.origin_location}
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      background: isConfirmed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isConfirmed ? '#34d399' : '#fbbf24',
                      border: `1px solid ${isConfirmed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    }}
                  >
                    {isConfirmed ? 'Registro blockchain confirmado' : 'Pendiente'}
                  </span>
                </div>

                {/* Métricas de Cantidad y Balance */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '0.85rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cantidad Asignada</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                      {assignedKg.toLocaleString('es-AR')} kg
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Saldo Remanente en Origen</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9' }}>
                      {remainingKg.toLocaleString('es-AR')} kg
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cosecha Total Lote</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 600, color: '#94a3b8' }}>
                      {initialKg.toLocaleString('es-AR')} kg
                    </div>
                  </div>
                </div>

                {/* Barra de progreso de deducción de inventario */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span>Consumo asignado al lote ({assignedPercent}%)</span>
                    <span>Saldo restante disponible en silo ({100 - assignedPercent}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${assignedPercent}%`,
                        background: 'linear-gradient(90deg, var(--accent-green), var(--accent-blue))',
                      }}
                    />
                  </div>
                </div>

                {/* Fechas y comprobantes */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingTop: '0.6rem',
                  }}
                >
                  <div>
                    <span>Período: </span>
                    <strong style={{ color: 'var(--text-main)' }}>
                      {record.period_start} al {record.period_end}
                    </strong>
                  </div>

                  {record.blockchain_tx_hash && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>Tx On-Chain:</span>
                      <code style={{ fontSize: '0.7rem', color: 'var(--accent-blue)' }}>
                        {record.blockchain_tx_hash.slice(0, 10)}...{record.blockchain_tx_hash.slice(-6)}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
