'use client';

import React, { useState } from 'react';
import { PassportBlockchainInfo } from '@/lib/passport/types';

interface PassportVerificationSectionProps {
  verification: PassportBlockchainInfo;
}

export const PassportVerificationSection: React.FC<PassportVerificationSectionProps> = ({
  verification,
}) => {
  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  const handleCopy = (text: string, type: 'tx' | 'contract') => {
    navigator.clipboard.writeText(text);
    if (type === 'tx') {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } else {
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    }
  };

  const isConfirmed = verification.tx_hash && verification.confirmation_status.toLowerCase().includes('confirmado');

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
          <span style={{ fontSize: '1.25rem' }}>⛓️</span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Verificación Criptográfica On-Chain
          </h2>
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
          {verification.confirmation_status}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Red y Chain ID */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
              Red Blockchain
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
              {verification.network} (ID: {verification.chain_id})
            </strong>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
              Bloque Registrado
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
              {verification.block_number ? `#${verification.block_number}` : 'Pendiente de minado'}
            </strong>
          </div>
        </div>

        {/* Dirección del Contrato */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Dirección del Smart Contract (AgroChainTrace.sol):
            </span>
            <button
              onClick={() => handleCopy(verification.contract_address, 'contract')}
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: copiedContract ? '#34d399' : 'var(--accent-blue)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {copiedContract ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          <code
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: 'var(--accent-green)',
              wordBreak: 'break-all',
            }}
          >
            {verification.contract_address}
          </code>
        </div>

        {/* Transaction Hash */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Hash de Transacción (Tx Hash):
            </span>
            {verification.tx_hash && (
              <button
                onClick={() => handleCopy(verification.tx_hash!, 'tx')}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: copiedTx ? '#34d399' : 'var(--accent-blue)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {copiedTx ? '✓ Copiado' : 'Copiar'}
              </button>
            )}
          </div>

          {verification.tx_hash ? (
            <code
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#38bdf8',
                wordBreak: 'break-all',
              }}
            >
              {verification.tx_hash}
            </code>
          ) : (
            <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontStyle: 'italic' }}>
              Transacción pendiente de emisión o confirmación on-chain.
            </span>
          )}

          {/* Enlace al explorador de bloques (solo si no es localhost y existe URL) */}
          {verification.explorer_url && (
            <div style={{ marginTop: '0.65rem' }}>
              <a
                href={verification.explorer_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  color: 'var(--accent-blue)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                <span>↗ Abrir en Explorador Polygonscan Amoy</span>
              </a>
            </div>
          )}
        </div>

        {verification.block_timestamp && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Fecha de Bloque:{' '}
            {new Date(verification.block_timestamp).toLocaleString('es-AR')}
          </div>
        )}
      </div>
    </section>
  );
};
