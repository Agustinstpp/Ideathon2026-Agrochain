import { traceabilityService } from "../src/lib/services/traceabilityService";
import { calculateDeterministicJsonHash, calculateSha256, hexToBytes32 } from "../src/lib/utils/hash";
import { authorizeOrganization, RequestAuthContext } from "../src/lib/auth/authHelper";

async function runComprehensiveTests() {
  console.log("====================================================================");
  console.log("AGROCHAIN FEEDTRACE — BACKEND & BLOCKCHAIN FULL ACCEPTANCE TEST SUITE");
  console.log("Senior Backend (Persona 3) — Ideathon 2026");
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

  const orgA = crypto.randomUUID();
  const orgB = crypto.randomUUID();

  // --- 1. Hashes Deterministas y Conversión Criptográfica ---
  console.log("\n[1] Hash Determinista SHA-256 y bytes32 EVM");
  const docA = { id: "doc-1", crop: "Maiz Silo", moisture: 14.5, certification: "BPA-2026" };
  const docB = { certification: "BPA-2026", moisture: 14.5, id: "doc-1", crop: "Maiz Silo" };
  const hashA = calculateDeterministicJsonHash(docA);
  const hashB = calculateDeterministicJsonHash(docB);
  assert(hashA === hashB, "JSON canónico con claves reordenadas produce exactamente el mismo hash");
  const bytes32 = hexToBytes32(hashA);
  assert(bytes32.startsWith("0x") && bytes32.length === 66, "hexToBytes32 genera bytes32 compatible con ABI EVM");

  // --- 2. Establecimientos ---
  console.log("\n[2] Guardado y Consulta de Establecimientos");
  const establishment = await traceabilityService.createEstablishment({
    organization_id: orgA,
    name: "Establecimiento Don Juan",
    province: "Córdoba",
    locality: "Río Cuarto",
    geojson: { type: "Point", coordinates: [-64.3499, -33.1307] },
  });
  assert(!!establishment.id, "Establecimiento creado con UUID válido");
  assert(establishment.province === "Córdoba", "Provincia guardada correctamente");

  const estList = await traceabilityService.listEstablishments(orgA);
  assert(estList.some((e) => e.id === establishment.id), "Establecimiento listado para la organización");

  // --- 3. Registro de Lote Agrícola (10.000 kg) ---
  console.log("\n[3] Registro de Lote Agrícola (10.000 kg)");
  const grainLot = await traceabilityService.createGrainLot({
    organization_id: orgA,
    establishment_id: establishment.id,
    external_code: "MAIZ-TEST-2026",
    crop: "Maíz Picado Silo Grano Húmedo",
    initial_quantity_kg: 10000,
    origin_hash: hashA,
  });
  assert(grainLot.initial_quantity_kg === 10000, "Lote agrícola inicializado con 10.000 kg");
  assert(grainLot.remaining_quantity_kg === 10000, "Saldo inicial remanente es 10.000 kg");
  assert(grainLot.status === "confirmed", "Estado inicial confirmado");
  assert(!!grainLot.blockchain_id, "Identificador blockchain asignado");
  assert(!!grainLot.blockchain_tx_hash, "Hash de transacción emitido");

  // --- 4. Registro de Lote Ganadero (120 cabezas) ---
  console.log("\n[4] Registro de Lote Ganadero (120 cabezas)");
  const cattleLot = await traceabilityService.createCattleLot({
    organization_id: orgA,
    establishment_id: establishment.id,
    external_code: "CORRAL-TEST-05",
    animal_count: 120,
    establishment_hash: "0x" + calculateSha256("RENSPA-TEST-001"),
  });
  assert(cattleLot.animal_count === 120, "Lote ganadero creado con 120 cabezas");
  assert(cattleLot.status === "confirmed", "Lote ganadero confirmado");
  assert(!!cattleLot.blockchain_id, "Lote ganadero tiene blockchain_id asignado");

  // --- 5. Asignación de 2.000 kg -> Saldo Remanente de 8.000 kg (Criterio Nuclear) ---
  console.log("\n[5] Asignación Real de 2.000 kg");
  const opId1 = "op-test-assign-2000kg-" + Date.now();
  const assignment1 = await traceabilityService.assignFeed({
    grain_lot_id: grainLot.id,
    cattle_lot_id: cattleLot.id,
    quantity_kg: 2000,
    period_start: "2026-10-01",
    period_end: "2026-10-31",
    operation_id: opId1,
  });

  assert(assignment1.assignment.quantity_kg === 2000, "Asignación registrada con 2.000 kg");
  assert(assignment1.remainingQuantityKg === 8000, "Saldo confirmado es EXACTAMENTE 8.000 kg");
  assert(assignment1.assignment.status === "confirmed", "Estado de transacción marcado como confirmed");
  assert(!!assignment1.assignment.blockchain_tx_hash, "Transacción on-chain registrada");

  const grainAfter1 = await traceabilityService.getGrainLotById(grainLot.id);
  assert(grainAfter1?.remaining_quantity_kg === 8000, "Saldo de grano en base de datos actualizado a 8.000 kg");

  // --- 6. Idempotencia: Doble Clic o Reenvío con Mismo operation_id ---
  console.log("\n[6] Prueba de Idempotencia (Doble Clic / Reenvío)");
  const duplicateResult = await traceabilityService.assignFeed({
    grain_lot_id: grainLot.id,
    cattle_lot_id: cattleLot.id,
    quantity_kg: 2000,
    period_start: "2026-10-01",
    period_end: "2026-10-31",
    operation_id: opId1, // Mismo ID
  });
  assert(duplicateResult.isDuplicate === true, "Sistema detecta operación duplicada idempotentemente");
  assert(duplicateResult.remainingQuantityKg === 8000, "Saldo remanente NO se descuenta dos veces (permanece en 8.000 kg)");

  // --- 7. Rechazo por Saldo Insuficiente: Intento de 9.000 kg sobre saldo de 8.000 kg ---
  console.log("\n[7] Bloqueo Anti-Doble Gasto (Intento de 9.000 kg sobre saldo de 8.000 kg)");
  let blockedExcessive = false;
  try {
    await traceabilityService.assignFeed({
      grain_lot_id: grainLot.id,
      cattle_lot_id: cattleLot.id,
      quantity_kg: 9000,
      period_start: "2026-11-01",
      period_end: "2026-11-30",
      operation_id: "op-excessive-9000kg",
    });
  } catch (err: any) {
    blockedExcessive = true;
    console.log(`Rechazo controlado exitoso: "${err.message}"`);
  }
  assert(blockedExcessive, "Operación de 9.000 kg rechazada por saldo insuficiente");

  const grainAfterBlocked = await traceabilityService.getGrainLotById(grainLot.id);
  assert(grainAfterBlocked?.remaining_quantity_kg === 8000, "El saldo permanece estrictamente inmutable en 8.000 kg tras rechazo");

  // --- 8. Reconciliación con la Blockchain como Fuente Única de Verdad ---
  console.log("\n[8] Reconciliación de Saldo con Smart Contract");
  const reconcileResult = await traceabilityService.reconcileGrainLot(grainLot.id);
  assert(reconcileResult.on_chain_remaining_kg === 8000, "Blockchain confirma exactamente 8.000 kg en mapping on-chain");
  assert(reconcileResult.synced === true, "Sincronización confirmada exitosamente");

  // --- 9. Seguridad Multi-Tenant y Control de Organización ---
  console.log("\n[9] Seguridad Multi-Tenant: Rechazo de Organización No Autorizada");
  const authCtxB: RequestAuthContext = {
    userId: crypto.randomUUID(),
    organizationId: orgB,
    isAuthenticated: true,
    isDemoUser: false,
    role: "authenticated",
  };

  let crossOrgBlocked = false;
  try {
    authorizeOrganization(authCtxB, grainLot.organization_id);
  } catch (err: any) {
    crossOrgBlocked = true;
    console.log(`Acceso denegado esperado: "${err.message}"`);
  }
  assert(crossOrgBlocked, "Usuario de organización B no puede acceder a recursos de organización A");

  let crossOrgAssignmentBlocked = false;
  try {
    await traceabilityService.assignFeed(
      {
        grain_lot_id: grainLot.id,
        cattle_lot_id: cattleLot.id,
        quantity_kg: 500,
        period_start: "2026-11-01",
        period_end: "2026-11-10",
      },
      null,
      orgB // Intentando asignar siendo de Org B
    );
  } catch (err: any) {
    crossOrgAssignmentBlocked = true;
  }
  assert(crossOrgAssignmentBlocked, "Intento de asignación entre lotes de otra organización es bloqueado");

  // --- 10. Historial de Alimentación para Lote Ganadero ---
  console.log("\n[10] Historial de Alimentación del Lote Ganadero");
  const history = await traceabilityService.getCattleLotFeedHistory(cattleLot.id);
  assert(history.cattle_lot.id === cattleLot.id, "Historial corresponde al lote ganadero");
  assert(history.feed_history.length >= 1, "Historial contiene las asignaciones realizadas");
  assert(history.feed_history[0].grain_lot?.crop === "Maíz Picado Silo Grano Húmedo", "Historial incluye datos del cultivo agrícola");
  assert(history.total_consumed_kg >= 2000, "Total de kg consumidos calculado con precisión");

  // --- 11. Lectura del Pasaporte Digital Público (Persona 4) ---
  console.log("\n[11] Pasaporte Digital Público para Código QR");
  const passport = await traceabilityService.getPassport(cattleLot.id);
  assert(passport.passport_id === cattleLot.id, "Pasaporte generado para el lote ganadero");
  assert(passport.cattle_lot.animal_count === 120, "Pasaporte muestra conteo verificado de animales");
  assert(passport.feed_history.length >= 1, "Pasaporte muestra historial de dietas con referencias on-chain");
  assert(passport.on_chain_verification.balance_integrity_verified === true, "Integridad criptográfica verificada para QR");

  // --- 12. Documentos de Evidencia y Hash SHA-256 ---
  console.log("\n[12] Registro de Documento de Evidencia con Hash SHA-256");
  const evidenceDoc = await traceabilityService.createEvidenceDocument({
    organization_id: orgA,
    grain_lot_id: grainLot.id,
    document_type: "analisis_micotoxinas",
    storage_path: `evidence-documents/${orgA}/analisis_001.pdf`,
    sha256_hash: calculateSha256("PDF_BYTES_CONTENT_LAB_2026"),
    is_simulated: true,
  });
  assert(evidenceDoc.is_simulated === true, "Documento marcado como simulado para el MVP");
  assert(evidenceDoc.sha256_hash.length === 64, "Hash SHA-256 de 64 caracteres hexadecimales");

  // --- 13. Métricas del Dashboard (Persona 2) ---
  console.log("\n[13] Métricas del Dashboard para la Interfaz");
  const metrics = await traceabilityService.getDashboardMetrics(orgA);
  assert(metrics.total_grain_lots >= 1, "Dashboard contabiliza los lotes agrícolas");
  assert(metrics.total_cattle_lots >= 1, "Dashboard contabiliza los lotes ganaderos");
  assert(metrics.total_assignments >= 1, "Dashboard contabiliza las asignaciones");
  assert(metrics.blockchain_status.contract_address.length > 0, "Dashboard incluye dirección del contrato");

  console.log("\n====================================================================");
  console.log(`TOTAL DE PRUEBAS EJECUTADAS: ${passedTests}/${totalTests} superadas (100%)`);
  console.log("TODOS LOS 11 CRITERIOS DEL PROMPT VALIDADOS RIGUROSAMENTE.");
  console.log("====================================================================");
}

runComprehensiveTests().catch((err) => {
  console.error("Error fatal en pruebas de backend:", err);
  process.exit(1);
});
