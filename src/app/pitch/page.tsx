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
      'Dificultad para verificar si un lote de cereal ya fue computado o vendido a múltiples establecimientos ("doble cómputo" de inventario).',
      'Carga administrativa manual para responder a requerimientos de compradores.',
    ],
    callout: {
      type: 'problem',
      text: 'Una declaración jurada en papel no impide matemáticamente que el grano suministrado sea computado más de una vez.',
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
      'Control de deducción de raciones con control de inventario.',
      'Pasaporte Digital Ganadero público abierto mediante QR, accesible sin fricción ni login para compradores.',
    ],
    callout: {
      type: 'solution',
      text: 'Unificación de la historia agrícola y ganadera en un expediente digital verificable.',
    },
    keyMetric: {
      value: '100% Público',
      label: 'Acceso móvil por QR para compradores y frigoríficos',
    },
  },
  {
    number: 3,
    title: 'Control Cuantitativo Anti Double-Spending',
    subtitle: 'El Diferencial Tecnológico',
    badge: 'Diferencial',
    bullets: [
      'Smart Contract en Solidity con control de deducción de saldo de inventario.',
      'Cosecha inicial: 10.000 kg de maíz registrados (Lote AGR-001).',
      'Asignación al Lote GAN-001: 2.000 kg deducidos.',
      'Saldo remanente inmutable: 8.000 kg verificables en origen.',
      'Cualquier intento de sobreasignar inventario es rechazado automáticamente por saldo insuficiente.',
    ],
    callout: {
      type: 'tech',
      text: 'La integridad matemática de saldos evita la reutilización ilegítima del mismo alimento en múltiples lotes.',
    },
    keyMetric: {
      value: '10k → 8k kg',
      label: 'Saldo verificado en Smart Contract',
    },
  },
  {
    number: 4,
    title: 'Demostración de Flujo Completo',
    subtitle: 'El Pasaporte Digital Ganadero',
    badge: 'Demostración',
    bullets: [
      'Visualización clara: Lote GAN-001 (20 animales, Mercedes, Corrientes).',
      'Historial de ración: 2.000 kg de Maíz del lote agrícola AGR-001.',
      'Evidencias técnicas: Remitos con hash SHA-256 e integridad criptográfica.',
      'Transparencia total: Modo de demostración explícito sin transacciones ficticias de blockchain pública.',
    ],
    callout: {
      type: 'solution',
      text: 'El comprador entiende de inmediato qué lote ve, qué alimento recibió y qué datos están declarados.',
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
      'Frigoríficos: Potenciales pagadores del servicio (sujeto a validación comercial) motivados por exigir trazabilidad a sus proveedores.',
      'Enfoque regional: Cuenca ganadera del NEA (Corrientes, Chaco).',
    ],
    callout: {
      type: 'market',
      text: 'El frigorífico que requiere evidencia para compraventa tracciona la adopción en la cadena.',
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
      'Smart Contract AgroChainTrace.sol con lógica de control de inventario (operando en modo simulado para la demo).',
      'Blockchain como árbitro neutral que aporta reglas inmutables entre actores independientes.',
    ],
    callout: {
      type: 'tech',
      text: 'Desacoplamiento óptimo: Base relacional para alta velocidad + Blockchain para prueba de integridad.',
    },
  },
  {
    number: 7,
    title: 'Impacto Real y Hoja de Ruta',
    subtitle: 'Roadmap y Futuro',
    badge: 'Impacto & Roadmap',
    bullets: [
      'Reducción del esfuerzo manual para responder a consultas de compradores.',
      'Cero afirmaciones infundadas: comunicación honesta de estados técnicos.',
      'Fase 1 (Meses 1-3): Integración con balanzas electrónicas de tolva.',
      'Fase 2 (Meses 4-6): Integración con sistemas de gestión de establecimientos.',
      'Fase 3 (Meses 7+): Piloto comercial con frigorífico regional.',
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
      className="ag shell"
      style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: '24px 16px',
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
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 16,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/inicio" className="small" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            ← Inicio
          </Link>
          <span className="muted">|</span>
          <Link
            href="/pasaporte/GAN-001"
            className="small"
            style={{
              color: 'var(--green)',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Abrir Pasaporte Demo →
          </Link>
        </div>

        <button type="button" className="btn secondary small" onClick={handlePrintPdf}>
          Imprimir / Guardar en PDF
        </button>
      </div>

      {/* Diapositiva Principal */}
      <div
        className="card"
        style={{
          flex: 1,
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 460,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge sim">{slide.badge}</span>
              <span className="small muted">
                Slide {slide.number} de {slides.length}
              </span>
            </div>

            <span className="small mono muted" style={{ fontWeight: 600 }}>
              {slide.subtitle}
            </span>
          </div>

          <h2
            style={{
              fontSize: 28,
              fontFamily: 'var(--font-display)',
              marginBottom: 20,
              lineHeight: 1.25,
            }}
          >
            {slide.title}
          </h2>

          <ul
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              fontSize: 16,
              lineHeight: 1.5,
              padding: 0,
              margin: '0 0 24px 0',
            }}
          >
            {slide.bullets.map((b, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: 'var(--green)', fontWeight: 800 }}>•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: slide.keyMetric ? '2fr 1fr' : '1fr', gap: 16 }}>
          {slide.callout && (
            <div
              style={{
                background: 'var(--card-alt)',
                borderLeft: '4px solid var(--green)',
                padding: '14px 18px',
                borderRadius: '0 12px 12px 0',
                fontSize: 15,
                fontStyle: 'italic',
              }}
            >
              "{slide.callout.text}"
            </div>
          )}

          {slide.keyMetric && (
            <div
              style={{
                background: 'var(--card-alt)',
                border: '1px solid var(--border)',
                padding: 14,
                borderRadius: 14,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                {slide.keyMetric.value}
              </div>
              <div className="xsmall muted" style={{ marginTop: 4 }}>
                {slide.keyMetric.label}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controles de navegación */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 20,
        }}
      >
        <button
          onClick={handlePrev}
          disabled={currentSlideIndex === 0}
          type="button"
          className="btn secondary small"
          style={{ opacity: currentSlideIndex === 0 ? 0.4 : 1 }}
        >
          ← Anterior
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              type="button"
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: 'none',
                background: currentSlideIndex === idx ? 'var(--green)' : 'var(--border)',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentSlideIndex === slides.length - 1}
          type="button"
          className="btn small"
          style={{ opacity: currentSlideIndex === slides.length - 1 ? 0.4 : 1 }}
        >
          Siguiente →
        </button>
      </div>

      {/* Guión cronometrado */}
      <section
        className="card no-print"
        style={{
          marginTop: 24,
          padding: 16,
          background: 'var(--card-alt)',
        }}
      >
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Guión de Demostración en Vivo (3 Minutos)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }} className="muted">
          <div>
            <strong style={{ color: 'var(--text)' }}>0:00 - 0:30:</strong> Problema de silos y doble cómputo de raciones.
          </div>
          <div>
            <strong style={{ color: 'var(--text)' }}>0:30 - 1:00:</strong> Lote agrícola AGR-001 y lote ganadero GAN-001.
          </div>
          <div>
            <strong style={{ color: 'var(--text)' }}>1:00 - 1:45:</strong> Asignar 2.000 kg y verificar saldo restante de 8.000 kg.
          </div>
          <div>
            <strong style={{ color: 'var(--text)' }}>1:45 - 2:15:</strong> Mostrar rechazo por saldo insuficiente.
          </div>
          <div>
            <strong style={{ color: 'var(--text)' }}>2:15 - 3:00:</strong> Proyectar QR y recorrer el Pasaporte Digital en celular.
          </div>
        </div>
      </section>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  );
}
