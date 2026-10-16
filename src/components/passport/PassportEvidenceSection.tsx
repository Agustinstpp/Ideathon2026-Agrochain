'use client';

import React, { useState } from 'react';
import { PassportEvidenceDoc, PassportComplianceNote } from '@/lib/passport/types';

interface PassportEvidenceSectionProps {
  documents: PassportEvidenceDoc[];
  complianceNotes: PassportComplianceNote[];
}

export const PassportEvidenceSection: React.FC<PassportEvidenceSectionProps> = ({
  documents,
  complianceNotes,
}) => {
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  // Filtrar estrictamente solo documentos con scope 'public'
  const publicDocs = documents.filter((doc) => doc.scope === 'public');

  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    setTimeout(() => setCopiedHashId(null), 2000);
  };

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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>📄</span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Evidencias y Comprobantes Criptográficos
          </h2>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          {publicDocs.length} documentos públicos
        </span>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
        Solo se exponen documentos explícitamente autorizados como públicos. Los contratos comerciales y datos
        confidenciales se mantienen estrictamente privados fuera del pasaporte.
      </p>

      {/* Lista de Documentos Públicos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {publicDocs.length === 0 ? (
          <div
            style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            No hay documentos públicos anexados.
          </div>
        ) : (
          publicDocs.map((doc) => (
            <div
              key={doc.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.4rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                    {doc.title}
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Tipo: {doc.document_type} • Archivo: {doc.file_name}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {doc.is_simulated && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(234, 179, 8, 0.15)',
                        color: '#fde047',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                      }}
                    >
                      Simulado
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: 'var(--accent-blue)',
                    }}
                  >
                    Público
                  </span>
                </div>
              </div>

              {/* Hash SHA-256 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  marginTop: '0.5rem',
                  gap: '0.5rem',
                }}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginRight: '0.4rem' }}>
                    SHA-256:
                  </span>
                  <code style={{ fontSize: '0.7rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                    {doc.sha256_hash}
                  </code>
                </div>

                <button
                  onClick={() => handleCopyHash(doc.id, doc.sha256_hash)}
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedHashId === doc.id ? '#34d399' : 'var(--accent-blue)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                  }}
                >
                  {copiedHashId === doc.id ? '✓ Copiado' : 'Copiar Hash'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transparencia: Qué parte está declarada, qué tiene prueba y qué evidencia falta */}
      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1rem',
        }}
      >
        <h3
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            marginBottom: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>🔍</span> Estado de Evidencias y Transparencia para Comprador
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {complianceNotes.map((note, index) => {
            const isConfirmed = note.status.includes('confirmado');
            const isPending = note.status.includes('Pendiente');

            return (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'block' }}>
                    {note.standard}
                  </strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    {note.detail}
                  </p>
                </div>

                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: isConfirmed
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isPending
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(148, 163, 184, 0.15)',
                    color: isConfirmed ? '#34d399' : isPending ? '#fbbf24' : '#94a3b8',
                    border: `1px solid ${
                      isConfirmed
                        ? 'rgba(16, 185, 129, 0.3)'
                        : isPending
                        ? 'rgba(245, 158, 11, 0.3)'
                        : 'rgba(148, 163, 184, 0.3)'
                    }`,
                  }}
                >
                  {note.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
