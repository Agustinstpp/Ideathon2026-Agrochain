import React from 'react';
import { Metadata } from 'next';
import { passportService } from '@/lib/passport/passportService';
import { PassportClientView } from '@/components/passport/PassportClientView';
import { PassportNotFound } from '@/components/passport/PassportNotFound';

export const dynamic = 'force-dynamic';

interface PassportPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PassportPageProps): Promise<Metadata> {
  const lotId = params.id ? decodeURIComponent(params.id) : 'Ganadero';
  return {
    title: `Pasaporte Digital Lote ${lotId} | AgroChain FeedTrace`,
    description: `Expediente de trazabilidad de alimentación y procedencia verificable para el lote ganadero ${lotId}.`,
    openGraph: {
      title: `Pasaporte Digital - Lote ${lotId}`,
      description: `Verificación on-chain de alimentación y origen para el lote ${lotId} en AgroChain FeedTrace.`,
    },
  };
}

export default async function PassportPage({ params }: PassportPageProps) {
  const lotId = params.id ? decodeURIComponent(params.id) : '';

  const passport = await passportService.getPassport(lotId);

  if (!passport) {
    return (
      <main style={{ padding: '2rem 1rem' }}>
        <PassportNotFound searchedId={lotId} />
      </main>
    );
  }

  return <PassportClientView passport={passport} />;
}
