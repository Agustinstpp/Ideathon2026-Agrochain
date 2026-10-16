import { traceabilityService } from "../src/lib/services/traceabilityService";
import { calculateDeterministicJsonHash, calculateSha256, hexToBytes32 } from "../src/lib/utils/hash";

async function runIntegrationTests() {
  console.log("====================================================================");
  console.log("AGROCHAIN FEEDTRACE - E2E INTEGRATION & ACCEPTANCE CRITERIA TESTS");
  console.log("====================================================================");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  }

  // --- TEST 1: Hash SHA-256 Determinista y Conversión bytes32 ---
  console.log("\n[TEST 1] Verificación de Hashes Deterministas");
  const docA = { id: "doc-1", crop: "Maiz", moisture: 14.5, certification: "BPA-2026" };
  const docB = { certification: "BPA-2026", moisture: 14.5, id: "doc-1", crop: "Maiz" }; // Claves en diferente orden
  const hashA = calculateDeterministicJsonHash(docA);
  const hashB = calculateDeterministicJsonHash(docB);
  assert(hashA === hashB, "JSON con claves en distinto orden produce el mismo hash SHA-256 canónico");
  const bytes32Val = hexToBytes32(hashA);
  assert(bytes32Val.startsWith("0x") && bytes32Val.length === 66, "hexToBytes32 genera un formato bytes32 EVM de 66 caracteres");

  // --- TEST 2: Registro de Lote Agrícola (10,000 kg) ---
  console.log("\n[TEST 2] Registro de Lote Agrícola (10.000 kg)");
  const orgId = crypto.randomUUID();
  const establishmentId = crypto.randomUUID();

  const grainLot = await traceabilityService.createGrainLot({
    organization_id: orgId,
    establishment_id: establishmentId,
    external_code: "MAIZ-LOTE-E2E-001",
    crop: "Maíz Picado Silo",
    initial_quantity_kg: 10000,
    origin_hash: hashA,
  });

  assert(grainLot.initial_quantity_kg === 10000, "Lote agrícola inicializado con 10.000 kg");
  assert(grainLot.remaining_quantity_kg === 10000, "Saldo inicial remanente es 10.000 kg");
  assert(grainLot.status === "confirmed", "Lote agrícola marcado con status confirmed");
  assert(!!grainLot.blockchain_tx_hash, "Hash de transacción generado");

  // --- TEST 3: Registro de Lote Ganadero ---
  console.log("\n[TEST 3] Registro de Lote Ganadero");
  const cattleLot = await traceabilityService.createCattleLot({
    organization_id: orgId,
    establishment_id: establishmentId,
    external_code: "RODEO-E2E-NOV-01",
    animal_count: 120,
    establishment_hash: "0x" + calculateSha256("RENSPA_CHACO_01.002.3.45678/99"),
  });

  assert(cattleLot.animal_count === 120, "Lote ganadero creado con 120 cabezas");
  assert(cattleLot.status === "confirmed", "Lote ganadero confirmado");

  // --- TEST 4: Asignación de 2.000 kg (Core Acceptance Criteria) ---
  console.log("\n[TEST 4] Asignación de 2.000 kg de Alimento");
  const assignment1 = await traceabilityService.assignFeed({
    grain_lot_id: grainLot.id,
    cattle_lot_id: cattleLot.id,
    quantity_kg: 2000,
    period_start: "2026-10-01",
    period_end: "2026-10-31",
  });

  assert(assignment1.assignment.quantity_kg === 2000, "Asignación registrada con 2.000 kg");
  assert(assignment1.remainingQuantityKg === 8000, "Saldo remanente confirmado es EXACTAMENTE 8.000 kg");
  assert(assignment1.assignment.status === "confirmed", "Asignación confirmada con status confirmed");

  // Verificar que el lote agrícola en el servicio refleje el saldo de 8.000 kg
  const updatedGrainLot = await traceabilityService.getGrainLotById(grainLot.id);
  assert(updatedGrainLot?.remaining_quantity_kg === 8000, "Inventario de grano en base de datos actualizado a 8.000 kg");

  // --- TEST 5: Intento de Asignación Excesiva de 9.000 kg (Anti Double-Spending) ---
  console.log("\n[TEST 5] Intento de Asignación Excesiva (9.000 kg sobre saldo de 8.000 kg)");
  let doubleSpendingBlocked = false;
  try {
    await traceabilityService.assignFeed({
      grain_lot_id: grainLot.id,
      cattle_lot_id: cattleLot.id,
      quantity_kg: 9000,
      period_start: "2026-11-01",
      period_end: "2026-11-30",
    });
  } catch (err: any) {
    doubleSpendingBlocked = true;
    console.log(`Mensaje de rechazo esperado: "${err.message}"`);
  }
  assert(doubleSpendingBlocked, "El sistema bloquea estrictamente la asignación de 9.000 kg por saldo insuficiente");

  // Verificar que el saldo remanente sigue intacto en 8.000 kg
  const intactGrainLot = await traceabilityService.getGrainLotById(grainLot.id);
  assert(intactGrainLot?.remaining_quantity_kg === 8000, "El saldo remanente permanece protegido e inmutable en 8.000 kg");

  // --- TEST 6: Asignación permitida del remanente restante ---
  console.log("\n[TEST 6] Asignación Válida de 3.000 kg Adicionales");
  const assignment2 = await traceabilityService.assignFeed({
    grain_lot_id: grainLot.id,
    cattle_lot_id: cattleLot.id,
    quantity_kg: 3000,
    period_start: "2026-11-01",
    period_end: "2026-11-15",
  });
  assert(assignment2.remainingQuantityKg === 5000, "Saldo remanente actualizado a 5.000 kg tras segunda asignación");

  // --- TEST 7: Expediente Digital de Trazabilidad (Ficha QR para Persona 4) ---
  console.log("\n[TEST 7] Consulta de Expediente Digital de Trazabilidad");
  const dossier = await traceabilityService.getTraceabilityDossier(grainLot.id);
  assert(dossier.grain_lot.id === grainLot.id, "Expediente contiene el lote de grano correcto");
  assert(dossier.cattle_lot.id === cattleLot.id, "Expediente contiene el lote de ganado vinculado");
  assert(dossier.feed_assignments.length === 2, "Expediente enumera las 2 asignaciones confirmadas");
  assert(dossier.on_chain_verification.balance_integrity_verified === true, "Integridad de balance on-chain verificada");

  console.log("\n====================================================================");
  console.log(`RESUMEN: ${passedTests}/${totalTests} pruebas superadas con éxito (100%)`);
  console.log("TODOS LOS CRITERIOS DE ACEPTACIÓN CUMPLIDOS RIGUROSAMENTE.");
  console.log("====================================================================");
}

runIntegrationTests().catch((err) => {
  console.error("Error fatal en pruebas de integración:", err);
  process.exit(1);
});
