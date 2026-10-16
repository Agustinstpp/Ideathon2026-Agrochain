'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PassportData } from '@/lib/passport/types';
import { PassportHeader } from './PassportHeader';
import { PassportCattleCard } from './PassportCattleCard';
import { PassportFeedingSection } from './PassportFeedingSection';
import { PassportEvidenceSection } from './PassportEvidenceSection';
import { PassportVerificationSection } from './PassportVerificationSection';
import { PassportQrModal } from './PassportQrModal';
import { QRCode } from './QRCode';

interface PassportClientViewProps {
  passport: PassportData;
}

export const PassportClientView: React.FC<PassportClientViewProps> = ({ passport }) => {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'cattle' | 'feed' | 'evidence' | 'blockchain' | 'qr'>('all');

  return (
    <div
      style={{
        maxWidth: '820px',
        margin: '0 auto',
        padding: '1rem',
        minHeight: '100vh',
      }}
    >
      {/* Barra superior de navegación de demo */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          padding: '0.5rem 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '0.8rem',
        }}
      >
        <Link
          href="/"
          style={{
            color: 'var(--text-muted)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span>←</span> AgroChain Inicio
        </Link>

        {/* Selector de escenarios demo rápido para el jurado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Demo:</span>
          <Link
            href="/pasaporte/GAN-001"
            style={{
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: passport.lot_id === 'GAN-001' ? 'var(--accent-green)' : 'rgba(255, 255, 255, 0.05)',
              color: passport.lot_id === 'GAN-001' ? '#0f172a' : 'var(--text-main)',
            }}
          >
            GAN-001 (Nominal)
          </Link>
          <Link
            href="/pasaporte/GAN-PENDING"
            style={{
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: passport.lot_id === 'GAN-PENDING' ? '#fbbf24' : 'rgba(255, 255, 255, 0.05)',
              color: passport.lot_id === 'GAN-PENDING' ? '#0f172a' : 'var(--text-main)',
            }}
          >
            GAN-PENDING
          </Link>
        </div>
      </nav>

      {/* Encabezado Principal */}
      <PassportHeader passport={passport} onOpenQrModal={() => setIsQrModalOpen(true)} />

      {/* Pestañas de Filtro Rápido (Mobile-First) */}
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1rem',
          scrollbarWidth: 'none',
        }}
      >
        {[
          { id: 'all', label: 'Ver Todo' },
          { id: 'cattle', label: 'Ganado' },
          { id: 'feed', label: 'Alimentación' },
          { id: 'evidence', label: 'Evidencias' },
          { id: 'blockchain', label: 'Blockchain' },
          { id: 'qr', label: 'Código QR' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            type="button"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: 'none',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              background: activeTab === tab.id ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.06)',
              color: activeTab === tab.id ? '#0f172a' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Secciones de contenido */}
      <main>
        {(activeTab === 'all' || activeTab === 'cattle') && (
          <PassportCattleCard cattle={passport.cattle} />
        )}

        {(activeTab === 'all' || activeTab === 'feed') && (
          <PassportFeedingSection records={passport.feeding_history} />
        )}

        {(activeTab === 'all' || activeTab === 'evidence') && (
          <PassportEvidenceSection
            documents={passport.evidence_documents}
            complianceNotes={passport.regulatory_compliance_notes}
          />
        )}

        {(activeTab === 'all' || activeTab === 'blockchain') && (
          <PassportVerificationSection verification={passport.blockchain_verification} />
        )}

        {(activeTab === 'all' || activeTab === 'qr') && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Compartir Pasaporte Mediante QR
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Cualquier frigorífico, comprador o auditor puede escanear este código sin necesidad de login.
            </p>
            <QRCode
              value={typeof window !== 'undefined' ? window.location.href : ''}
              lotId={passport.cattle.external_code}
              title={`Pasaporte Lote ${passport.cattle.external_code}`}
              size={210}
            />
          </div>
        )}
      </main>

      {/* Modal de QR flotante */}
      <PassportQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        lotId={passport.cattle.external_code}
      />

      {/* Pie de página oficial */}
      <footer
        style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        <div>
          <strong>AgroChain FeedTrace</strong> — Trazabilidad Agroindustrial Integrada para NEA Tech 2026
        </div>
        <div>
          Desarrollado con Next.js + Supabase PostgreSQL + Smart Contracts EVM
        </div>
      </footer>
    </div>
  );
};
