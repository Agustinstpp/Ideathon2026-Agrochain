'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Slide {
  number: number;
  title: string;
  subtitle: string;
  badge: string;
  bullets: string[];
  callout?: {
    type: 'problem' | 'solution' | 'tech' | 'market';
    text: string;
  };
  keyMetric?: {
    value: string;
    label: string;
  };
}

const slides: Slide[] = [
  {
    number: 1,
    title: 'La Fragmentación Documental en Carne y Granos',
    subtitle: 'El Problema',
    badge: 'Problema',
    bullets: [
      'La información de origen agrícola y raciones ganaderas está dispersa en planillas físicas, remitos y sistemas cerrados.',
      'Imposibilidad de verificar si un lote de cereal ya fue computado o vendido a múltiples feedlots ("doble cómputo" de inventario).',
      'Riesgo creciente de trabas comerciales y mayores costos en auditorías manuales.',
    ],
    callout: {
      type: 'problem',
      text: 'Un PDF o declaración jurada no ofrece garantía matemática de que el grano suministrado no haya sido duplicado.',
    },
    keyMetric: {
      value: 'Silos Aislados',
      label: 'Falta de correlación técnica entre silo y corral',
    },
  },
  {
    number: 2,
    title: 'AgroChain FeedTrace',
    subtitle: 'La Solución',
    badge: 'Solución',
    bullets: [
      'Plataforma integral que vincula cuantitativamente el lote agrícola con el lote ganadero.',
      'Persistencia transaccional de eventos nutricionales y remitos con hashes SHA-256.',
      'Pasaporte Digital Ganadero público abierto mediante QR, accesible sin fricción ni login para compradores.',
    ],
    callout: {
      type: 'solution',
      text: 'Unificación de la historia agrícola y ganadera en un expediente digital verificable.',
    },
    keyMetric: {
      value: '100% Público',
      label: 'Acceso móvil por QR para frigoríficos y auditorías',
    },
  },
  {
    number: 3,
    title: 'Control Cuantitativo Anti Double-Spending',
    subtitle: 'El Diferencial Tecnológico',
    badge: 'Diferencial',
    bullets: [
      'Smart Contract en Solidity con control estricto de deducción de saldo de inventario en tiempo real.',
      'Cosecha inicial: 10.000 kg de maíz registrados on-chain.',
      'Asignación al Lote GAN-001: 2.000 kg deducidos.',
      'Saldo remanente inmutable: 8.000 kg verificables en origen.',
      'Cualquier intento de sobreasignar inventario es revertido automáticamente por la EVM.',
    ],
    callout: {
      type: 'tech',
      text: 'La integridad matemática de saldos evita la reutilización ilegítima del mismo alimento en múltiples lotes.',
    },
    keyMetric: {
      value: '10k → 8k kg',
      label: 'Saldo verificado matemáticamente en Smart Contract',
    },
  },
  {
    number: 4,
    title: 'Demostración de Flujo Completo',
    subtitle: 'El Pasaporte Digital Ganadero',
    badge: 'Demostración',
    bullets: [
      'Visualización clara: Lote GAN-001 (20 animales, Mercedes, Corrientes).',
      'Historial de ración: 2.000 kg de Maíz Picado Silo Grano Húmedo (Lote AGR-001).',
      'Evidencias técnicas: Remitos con hash SHA-256 e integridad criptográfica.',
      'Transparencia total: Distinción explícita entre datos declarados, comprobados on-chain y pendientes regulatorios.',
    ],
    callout: {
      type: 'solution',
      text: 'El comprador entiende de inmediato qué lote ve, qué alimento recibió, qué está probado y qué falta.',
    },
  },
  {
    number: 5,
    title: 'Modelo de Ecosistema y Adopción',
    subtitle: 'Mercado y Usuario',
    badge: 'Mercado',
    bullets: [
      'Productores agrícolas y acopios: Registro de granos y emisión de remitos con hashes.',
      'Feedlots y establecimientos de engorde: Gestión de raciones y balance de corral.',
      'Frigoríficos y exportadores: Potenciales pagadores del servicio (sujeto a validación comercial) motivados por acceder a mercados premium.',
      'Enfoque regional: Cuenca ganadera del NEA (Corrientes, Chaco, Formosa, Santiago del Estero).',
    ],
    callout: {
      type: 'market',
      text: 'El frigorífico que requiere evidencia para exportación tracciona la adopción en la cadena.',
    },
    keyMetric: {
      value: 'Región NEA',
      label: 'Cuenca estratégica ganadera y agrícola',
    },
  },
  {
    number: 6,
    title: 'Supabase + Next.js + Smart Contracts EVM',
    subtitle: 'Viabilidad y Arquitectura',
    badge: 'Arquitectura',
    bullets: [
      'Base de datos PostgreSQL en Supabase con Row Level Security (RLS) y triggers de seguridad.',
      'Frontend Next.js 14 en Vercel, optimizado mobile-first para baja conectividad en campo.',
      'Smart Contract AgroChainTrace.sol desplegado en Polygon Amoy Testnet (Chain ID 80002).',
      'Blockchain como árbitro neutral que garantiza inmutabilidad entre actores sin confianza mutua.',
    ],
    callout: {
      type: 'tech',
      text: 'Desacoplamiento óptimo: Base relacional para alta velocidad + Blockchain para prueba de integridad inmutable.',
    },
  },
  {
    number: 7,
    title: 'Impacto Real y Hoja de Ruta',
    subtitle: 'Roadmap y Futuro',
    badge: 'Impacto & Roadmap',
    bullets: [
      'Reducción drástica del esfuerzo manual para responder a auditorías y requerimientos de clientes.',
      'Cero afirmaciones infundadas: distinción honesta de estados regulatorios.',
      'Fase 1 (Meses 1-3): Conexión con balanzas de tolva y DT-e SENASA.',
      'Fase 2 (Meses 4-6): Monitoreo satelital automatizado para debida diligencia de deforestación.',
      'Fase 3 (Meses 7+): Piloto comercial con frigorífico exportador regional.',
    ],
    callout: {
      type: 'solution',
      text: 'Crecimiento fundamentado en validación comercial continua y estándares abiertos.',
    },
    keyMetric: {
      value: 'Piloto 2026',
      label: 'Objetivo de validación con productores del NEA',
    },
  },
];

export default function PitchDeckPage() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slide = slides[currentSlideIndex];

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex]);

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '1.5rem',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Barra de herramientas superior */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
            ← Inicio
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <Link
            href="/pasaporte/GAN-001"
            style={{
              color: 'var(--accent-green)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            Abrir Pasaporte Demo →
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handlePrintPdf}
            type="button"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🖨️ Imprimir / Guardar en PDF
          </button>
        </div>
      </div>

      {/* Diapositiva Principal */}
      <div
        style={{
          flex: 1,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        {/* Cabecera de la diapositiva */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-green)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                {slide.badge}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Slide {slide.number} de {slides.length}
              </span>
            </div>

            <span style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
              {slide.subtitle}
            </span>
          </div>

          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: '1.5rem',
              lineHeight: 1.25,
            }}
          >
            {slide.title}
          </h2>

          {/* Puntos clave */}
          <ul
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              fontSize: '1.1rem',
              color: '#cbd5e1',
              lineHeight: 1.5,
              padding: 0,
              margin: '0 0 2rem 0',
            }}
          >
            {slide.bullets.map((b, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ color: 'var(--accent-green)', fontWeight: 800 }}>•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Callout o Métrica destacada */}
        <div style={{ display: 'grid', gridTemplateColumns: slide.keyMetric ? '2fr 1fr' : '1fr', gap: '1.25rem' }}>
          {slide.callout && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderLeft: '4px solid var(--accent-blue)',
                padding: '1rem 1.25rem',
                borderRadius: '0 12px 12px 0',
                fontSize: '0.95rem',
                color: 'var(--text-main)',
                fontStyle: 'italic',
              }}
            >
              "{slide.callout.text}"
            </div>
          )}

          {slide.keyMetric && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '1rem',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                {slide.keyMetric.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {slide.keyMetric.label}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controles de navegación y cronómetro de pitch */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem',
          padding: '0.5rem 0',
        }}
      >
        <button
          onClick={handlePrev}
          disabled={currentSlideIndex === 0}
          type="button"
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: currentSlideIndex === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
            color: currentSlideIndex === 0 ? 'var(--text-muted)' : 'var(--text-main)',
            fontWeight: 600,
            cursor: currentSlideIndex === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Anterior
        </button>

        {/* Indicadores de bolitas */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              type="button"
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: 'none',
                background: currentSlideIndex === idx ? 'var(--accent-green)' : 'rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentSlideIndex === slides.length - 1}
          type="button"
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: currentSlideIndex === slides.length - 1 ? 'rgba(255,255,255,0.02)' : 'var(--accent-green)',
            color: currentSlideIndex === slides.length - 1 ? 'var(--text-muted)' : '#0f172a',
            fontWeight: 700,
            cursor: currentSlideIndex === slides.length - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Siguiente →
        </button>
      </div>

      {/* Guión cronometrado de respaldo (3 minutos) */}
      <section
        className="no-print"
        style={{
          marginTop: '2rem',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
        }}
      >
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '0.75rem' }}>
          ⏱️ Guión Cronometrado de Demostración en Vivo (3 Minutos)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div>
            <strong style={{ color: 'var(--text-main)' }}>0:00 - 0:30:</strong> Problema de silos de datos y falta de prueba de inventario.
          </div>
          <div>
            <strong style={{ color: 'var(--text-main)' }}>0:30 - 1:00:</strong> Mostrar lote agrícola AGR-001 y lote ganadero GAN-001.
          </div>
          <div>
            <strong style={{ color: 'var(--text-main)' }}>1:00 - 1:45:</strong> Asignar 2.000 kg y verificar saldo restante de 8.000 kg.
          </div>
          <div>
            <strong style={{ color: 'var(--text-main)' }}>1:45 - 2:15:</strong> Mostrar rechazo automático por saldo insuficiente (anti double-spending).
          </div>
          <div>
            <strong style={{ color: 'var(--text-main)' }}>2:15 - 3:00:</strong> Proyectar QR y recorrer el Pasaporte Digital Ganadero en celular.
          </div>
        </div>
      </section>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>
    </div>
  );
}
