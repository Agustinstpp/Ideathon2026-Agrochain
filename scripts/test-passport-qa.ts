/**
 * Script de Pruebas de Aceptación y QA Automatizado para Pasaporte Digital Ganadero (Persona 4)
 * Ejecutar con: npx tsx scripts/test-passport-qa.ts
 */

import { passportService } from '../src/lib/passport/passportService';
import { generateQrMatrix } from '../src/lib/passport/qrCodeGenerator';

interface QaTestResult {
  criteria: string;
  expected: string;
  received: string;
  passed: boolean;
  notes?: string;
}

async function runPassportQaTests() {
  console.log('\n=============================================================');
  console.log('   AGROCHAIN FEEDTRACE — QA SUITE: PASAPORTE DIGITAL (P4)    ');
  console.log('=============================================================\n');

  const results: QaTestResult[] = [];

  // 1. Verificar carga de Lote GAN-001
  const gan001 = await passportService.getPassport('GAN-001');
  results.push({
    criteria: '1. Pasaporte abre e identificador correcto',
    expected: 'GAN-001',
    received: gan001?.cattle.external_code || 'null',
    passed: gan001?.cattle.external_code === 'GAN-001',
  });

  // 2. Verificar datos ganaderos (20 animales, Mercedes, Corrientes)
  const isCattleOk =
    gan001?.cattle.animal_count === 20 &&
    gan001?.cattle.locality === 'Mercedes' &&
    gan001?.cattle.province === 'Corrientes';
  results.push({
    criteria: '2. Información ganadera (20 animales, Mercedes, Corrientes)',
    expected: '20 cabezas en Mercedes, Corrientes',
    received: `${gan001?.cattle.animal_count} cabezas en ${gan001?.cattle.locality}, ${gan001?.cattle.province}`,
    passed: isCattleOk,
  });

  // 3. Verificar historial de alimentación (Cultivo Maíz, 2.000 kg asignados)
  const feeding = gan001?.feeding_history[0];
  const isFeedingOk =
    feeding?.quantity_kg === 2000 &&
    feeding?.crop.includes('Maíz') &&
    feeding?.grain_lot_code === 'AGR-001';
  results.push({
    criteria: '3. Historial de alimentación (Maíz, 2.000 kg, AGR-001)',
    expected: 'Maíz Picado, 2000 kg de AGR-001',
    received: `${feeding?.crop}, ${feeding?.quantity_kg} kg de ${feeding?.grain_lot_code}`,
    passed: isFeedingOk,
  });

  // 4. Control de saldo remanente (Inventario 10.000 kg - 2.000 kg = 8.000 kg)
  const isBalanceOk =
    feeding?.initial_grain_lot_quantity_kg === 10000 &&
    feeding?.remaining_grain_lot_quantity_kg === 8000;
  results.push({
    criteria: '4. Regla cuantitativa anti double-spending (Saldo 8.000 kg)',
    expected: 'Inicial: 10.000 kg, Saldo: 8.000 kg',
    received: `Inicial: ${feeding?.initial_grain_lot_quantity_kg} kg, Saldo: ${feeding?.remaining_grain_lot_quantity_kg} kg`,
    passed: isBalanceOk,
  });

  // 5. Verificación on-chain (Contrato y Tx Hash presentes)
  const blockInfo = gan001?.blockchain_verification;
  const isBlockchainOk =
    !!blockInfo?.contract_address &&
    !!blockInfo?.tx_hash &&
    blockInfo.chain_id === 80002;
  results.push({
    criteria: '5. Verificación on-chain (Polygon Amoy / Contrato)',
    expected: 'Polygon Amoy (80002) con Tx Hash registrado',
    received: `${blockInfo?.network} (${blockInfo?.chain_id}), Tx: ${blockInfo?.tx_hash?.slice(0, 14)}...`,
    passed: isBlockchainOk,
  });

  // 6. Privacidad estricta: No filtrar documentos privados ni datos sensibles
  const hasPrivateDocs = gan001?.evidence_documents.some((d) => d.scope !== 'public');
  const allDocsHaveSha256 = gan001?.evidence_documents.every((d) => d.sha256_hash.length === 64);
  results.push({
    criteria: '6. Privacidad estricta (Solo documentos públicos con SHA-256)',
    expected: '0 documentos privados y hashes válidos',
    received: `${hasPrivateDocs ? 'Detectados privados' : '100% públicos'}, SHA-256 válidos: ${allDocsHaveSha256}`,
    passed: !hasPrivateDocs && (allDocsHaveSha256 ?? false),
  });

  // 7. Criterio de Transparencia Regulatoria (Sin afirmaciones EUDR sin comprobación)
  const eudrNote = gan001?.regulatory_compliance_notes.find((n) => n.standard.includes('EUDR'));
  const isEudrPrudent =
    eudrNote?.status.includes('Pendiente') &&
    !eudrNote?.detail.toLowerCase().includes('certificado oficial emitido');
  results.push({
    criteria: '7. Transparencia regulatoria (No prometer certificado EUDR sin prueba)',
    expected: 'Pendiente de auditoría satelital',
    received: eudrNote?.status || 'No especificado',
    passed: isEudrPrudent ?? false,
    notes: eudrNote?.detail,
  });

  // 8. Generación de Código QR compatible sin localhost
  const testUrl = 'https://agrochain-feedtrace.vercel.app/pasaporte/GAN-001';
  const qrMatrix = generateQrMatrix(testUrl, 'M');
  const isQrValid = qrMatrix.length > 20 && qrMatrix[0].length > 20;
  results.push({
    criteria: '8. Código QR generado desde URL pública real (Sin localhost)',
    expected: 'Matriz QR válida >= 21x21 para URL oficial',
    received: `Matriz ${qrMatrix.length}x${qrMatrix.length}`,
    passed: isQrValid,
  });

  // 9. Manejo de Lotes Pendientes (GAN-PENDING)
  const pendingLot = await passportService.getPassport('GAN-PENDING');
  const isPendingHandled =
    pendingLot?.status === 'pending' &&
    pendingLot.blockchain_verification.tx_hash === null;
  results.push({
    criteria: '9. Manejo adecuado de datos pendientes',
    expected: 'Estado pending sin tx confirmed',
    received: `Status: ${pendingLot?.status}, Tx: ${pendingLot?.blockchain_verification.tx_hash}`,
    passed: isPendingHandled,
  });

  // 10. Manejo de Lote Inexistente (404)
  const notFoundLot = await passportService.getPassport('LOTE-FANTASMA-999');
  results.push({
    criteria: '10. Manejo de lote inexistente (404 seguro)',
    expected: 'null (desencadena PassportNotFound)',
    received: notFoundLot === null ? 'null (404 controlado)' : 'unexpected value',
    passed: notFoundLot === null,
  });

  // 11. Etiqueta clara de datos simulados
  const isSimulatedTagged = gan001?.is_simulated === true;
  results.push({
    criteria: '11. Etiqueta explícita de datos simulados para demo',
    expected: 'is_simulated = true',
    received: `is_simulated = ${gan001?.is_simulated}`,
    passed: isSimulatedTagged,
  });

  // Imprimir reporte formateado
  let allPassed = true;
  for (const r of results) {
    const statusIcon = r.passed ? '✅ APROBADO' : '❌ FALLÓ';
    if (!r.passed) allPassed = false;
    console.log(`${statusIcon} | ${r.criteria}`);
    console.log(`   Esperado: ${r.expected}`);
    console.log(`   Recibido: ${r.received}`);
    if (r.notes) console.log(`   Nota:     ${r.notes}`);
    console.log('-------------------------------------------------------------');
  }

  console.log(`\nRESULTADO GENERAL DE QA: ${allPassed ? 'TODAS LAS PRUEBAS PASARON (100%)' : 'HAY ERRORES'}\n`);

  if (!allPassed) {
    process.exit(1);
  }
}

runPassportQaTests().catch((err) => {
  console.error('Error fatal durante QA:', err);
  process.exit(1);
});
