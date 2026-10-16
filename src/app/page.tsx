export default function HomePage() {
  return (
    <main style={{ padding: "3rem 2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 700, color: "var(--accent-green)", marginBottom: "0.5rem" }}>
          AgroChain FeedTrace
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          Núcleo de Trazabilidad Verificable EVM + Supabase PostgreSQL
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <h3 style={{ color: "var(--accent-blue)", marginBottom: "0.75rem" }}>Core Smart Contract</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
            Contrato <code>AgroChainTrace.sol</code> con verificación estricta de saldos (anti double-spending) y eventos inmutables.
          </p>
        </div>

        <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <h3 style={{ color: "var(--accent-green)", marginBottom: "0.75rem" }}>Seguridad & RLS</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
            Políticas RLS en Supabase que aíslan organizaciones y triggers que prohíben la alteración no autorizada de saldos o transacciones.
          </p>
        </div>

        <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <h3 style={{ color: "var(--accent-blue)", marginBottom: "0.75rem" }}>API Backend Robusta</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
            Endpoints para registro de lotes de granos, lotes ganaderos, asignación de raciones y expedientes QR de trazabilidad.
          </p>
        </div>
      </section>

      <section style={{ background: "var(--bg-card)", padding: "2rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Endpoints de Integración (Persona 3 & 4)</h2>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <li><code>POST /api/grain-lots</code> — Registro de Lote Agrícola</li>
          <li><code>POST /api/cattle-lots</code> — Registro de Lote Ganadero</li>
          <li><code>POST /api/feed-assignments</code> — Asignación de Alimento con control de saldo</li>
          <li><code>GET /api/traceability/[id]</code> — Expediente digital completo con pruebas on-chain</li>
          <li><code>GET /api/status</code> — Diagnóstico de conectividad blockchain y contrato</li>
        </ul>
      </section>
    </main>
  );
}
