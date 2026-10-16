/**
 * Script de Pruebas de Aceptación y QA Actualizado para Pasaporte Digital Ganadero (Persona 4)
 * Ejecutar con: npx tsx scripts/test-passport-qa.ts
 */

import { passportService } from '../src/lib/passport/passportService';
import { isRealBlockchainTx } from '../src/lib/passport/types';
import qrcodegen from '../src/components/ui/qrcodegen';
import { publicUrl } from '../src/components/ui/QrSvg';

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
  console.log('   (Verificación de Correcciones y Modo Simulado)            ');
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

  // 2. Verificar datos ganaderos reales (20 animales, Mercedes, Corrientes, Establecimiento Demo Corrientes)
  const isCattleOk =
    gan001?.cattle.animal_count === 20 &&
    gan001?.cattle.locality === 'Mercedes' &&
    gan001?.cattle.province === 'Corrientes' &&
    gan001?.cattle.establishment_name === 'Establecimiento Demo Corrientes';
  results.push({
    criteria: '2. Información ganadera real (20 cabezas, Mercedes, Corrientes, Establecimiento Demo Corrientes)',
    expected: '20 cabezas en Mercedes, Corrientes (Establecimiento Demo Corrientes)',
    received: `${gan001?.cattle.animal_count} cabezas en ${gan001?.cattle.locality}, ${gan001?.cattle.province} (${gan001?.cattle.establishment_name})`,
    passed: isCattleOk,
  });

  // 3. Verificar historial de alimentación (Maíz, 2.000 kg, AGR-001)
  const feeding = gan001?.feeding_history[0];
  const isFeedingOk =
    feeding?.quantity_kg === 2000 &&
    feeding?.crop === 'Maíz' &&
    feeding?.grain_lot_code === 'AGR-001';
  results.push({
    criteria: '3. Historial de alimentación coherente (Maíz, 2.000 kg, AGR-001)',
    expected: 'Maíz, 2000 kg de AGR-001',
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

  // 5. Criterio Crítico: Modo simulado estricto (no afirmar blockchain confirmado, bloques ni Polygonscan)
  const isSimulated = gan001?.status === 'simulated' || gan001?.is_simulated;
  const isTxReal = isRealBlockchainTx(
    gan001?.blockchain_verification.tx_hash,
    gan001?.blockchain_verification.chain_id,
    gan001?.is_simulated
  );
  const noFakeClaims =
    !isTxReal &&
    gan001?.blockchain_verification.block_number === null &&
    gan001?.blockchain_verification.explorer_url === null &&
    gan001?.blockchain_verification.confirmation_status === 'Simulado';
  results.push({
    criteria: '5. Modo simulado estricto (Sin bloque, sin Polygonscan, estado Simulado)',
    expected: 'Status: Simulado, explorer_url: null, block_number: null, isRealBlockchainTx: false',
    received: `Status: ${gan001?.blockchain_verification.confirmation_status}, Explorer: ${gan001?.blockchain_verification.explorer_url}, isReal: ${isTxReal}`,
    passed: noFakeClaims,
  });

  // 6. Criterio Crítico: QR con librería oficial probada de Persona 2 (qrcodegen)
  const testUrl = publicUrl('/pasaporte/GAN-001');
  const qr = qrcodegen.QrCode.encodeText(testUrl, qrcodegen.QrCode.Ecc.MEDIUM);
  const isQrValid = qr.size > 20 && qr.getModule(0, 0) === true;
  results.push({
    criteria: '6. Generación QR oficial con qrcodegen probada',
    expected: 'Código QR codificado con tamaño válido y patrones de posición',
    received: `Tamaño QR: ${qr.size}x${qr.size}, módulo (0,0): ${qr.getModule(0, 0)}`,
    passed: isQrValid,
  });

  // 7. Criterio Crítico: Ausencia total de afirmaciones falsas de EUDR o SENASA verificado
  const hasEudr = JSON.stringify(gan001).toLowerCase().includes('eudr') ||
                  JSON.stringify(gan001).toLowerCase().includes('deforestación');
  results.push({
    criteria: '7. Ausencia total de menciones de EUDR o deforestación no comprobadas',
    expected: 'Cero menciones de EUDR o deforestación',
    received: hasEudr ? 'Detectadas menciones no autorizadas' : 'Limpio (0 menciones)',
    passed: !hasEudr,
  });

  // 8. Manejo de Lotes Pendientes (GAN-PENDING)
  const pendingLot = await passportService.getPassport('GAN-PENDING');
  const isPendingHandled =
    pendingLot?.status === 'pending' &&
    pendingLot.blockchain_verification.tx_hash === null;
  results.push({
    criteria: '8. Manejo adecuado de datos pendientes',
    expected: 'Status: pending, Tx: null',
    received: `Status: ${pendingLot?.status}, Tx: ${pendingLot?.blockchain_verification.tx_hash}`,
    passed: isPendingHandled,
  });

  // 9. Manejo de Lote Inexistente (404)
  const notFoundLot = await passportService.getPassport('LOTE-INEXISTENTE-999');
  results.push({
    criteria: '9. Manejo de lote inexistente (404 seguro)',
    expected: 'null (desencadena PassportNotFound)',
    received: notFoundLot === null ? 'null (404 controlado)' : 'unexpected value',
    passed: notFoundLot === null,
  });

  // 10. URL generada con publicUrl (no hardcodea Vercel)
  const generatedUrl = publicUrl('/pasaporte/GAN-001');
  const usesDynamicUrl = typeof generatedUrl === 'string' && generatedUrl.includes('/pasaporte/GAN-001');
  results.push({
    criteria: '10. URL dinámica con publicUrl (NEXT_PUBLIC_APP_URL o dominio actual)',
    expected: 'URL terminada en /pasaporte/GAN-001 sin hardcoding forzado',
    received: generatedUrl,
    passed: usesDynamicUrl,
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
