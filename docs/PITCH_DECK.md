# AgroChain FeedTrace — Pitch Deck y Entregables Oficiales (NEA Tech 2026)

Documento maestro para la presentación ante el jurado, guión de demostración en vivo de 3 minutos y reporte oficial de entregables de **AgroChain FeedTrace**.

---

## 1. Pitch Deck Oficial (5 Minutos)

### Slide 1 — El Problema
**Título:** La fragmentación documental en la cadena de carne y granos
- **Situación actual:** La información sobre origen agrícola y alimentación ganadera se encuentra dispersa en silos desconectados: remitos en papel, hojas de cálculo locales, boletos de balanza y planillas de corral.
- **Punto de dolor:** Ni el frigorífico exportador ni el comprador internacional pueden comprobar de manera fidedigna qué grano comió un lote de novillos, ni verificar si ese mismo grano ya fue asignado dos veces a diferentes lotes ("doble cómputo" o double-spending de inventario).
- **Consecuencia:** Crecientes rechazos aduaneros, costos por auditorías manuales y falta de transparencia técnica verificable.

---

### Slide 2 — La Solución
**Título:** AgroChain FeedTrace — Trazabilidad Criptográfica Integrada
- **Concepto:** Una plataforma unificada que conecta el origen del lote agrícola de alimento (maíz/soja) con el lote ganadero en engorde.
- **Núcleo de producto:**
  1. Registro de lotes agrícolas y ganaderos con hashes de procedencia georreferenciados.
  2. Asignación cuantitativa de raciones vinculadas.
  3. **Pasaporte Digital Ganadero público** accesible vía QR, sin necesidad de credenciales para compradores y auditores.

---

### Slide 3 — El Diferencial Tecnológico
**Título:** Control de Inventario Verificable On-Chain (Anti Double-Spending)
- **El problema de las certificaciones tradicionales:** Un PDF o declaración jurada no impide vender 10.000 kg de maíz y emitir papeles por 30.000 kg a diferentes corrales.
- **Nuestra solución:** Un Smart Contract en Solidity (`AgroChainTrace.sol`) que descuenta el saldo de grano en tiempo real al asignar raciones:
  - Cosecha inicial: **10.000 kg** de maíz en silo.
  - Asignación al Lote GAN-001: **2.000 kg**.
  - Saldo inmutable remanente: **8.000 kg**.
  - Si un operador intenta asignar 9.000 kg más, la EVM revierte la transacción automáticamente por saldo insuficiente.

---

### Slide 4 — Demostración de Producto
**Título:** El Pasaporte Digital en Acción
- **Vista interactiva mobile-first:** `/pasaporte/GAN-001`.
- **Estructura clara para el comprador:**
  1. *Qué lote ve:* Lote GAN-001 (20 animales, Mercedes, Corrientes).
  2. *De dónde proviene:* Estancia El Ombú con hash de establecimiento registrado.
  3. *Qué alimento consumió:* 2.000 kg de Maíz Picado del lote agrícola AGR-001.
  4. *Qué parte tiene prueba técnica:* Registro on-chain inmutable en Polygon Amoy con Tx Hash comprobable.
  5. *Qué evidencia falta:* Nota transparente de auditoría regulatoria (EUDR) pendiente.

---

### Slide 5 — Mercado y Modelo de Adopción
**Título:** Actores y Validación Comercial
- **Ecosistema de usuarios:**
  - *Productores agrícolas y acopios:* Declaran lotes de grano y entregan remitos con comprobante hash.
  - *Feedlots y establecimientos de engorde:* Gestionan raciones y consumos de corral.
  - *Frigoríficos y exportadores:* **Potenciales pagadores del servicio** (sujeto a validación comercial), impulsados por la exigencia de trazabilidad integral para acceder a mercados de mayor valor.
- **Estrategia de entrada:** Validación en pilotos cerrados en la cuenca NEA (Corrientes, Chaco, Santiago del Estero).

---

### Slide 6 — Viabilidad y Arquitectura
**Título:** Stack Tecnológico Robusto y Eficiente
- **Backend transaccional:** Supabase PostgreSQL con Row Level Security (RLS) estricto y triggers de integridad.
- **Frontend y Pasaporte Público:** Next.js 14 App Router alojado en Vercel, optimizado para celulares en el campo.
- **Capa de Verificabilidad:** Smart Contracts en Solidity desplegados sobre Polygon Amoy (EVM), garantizando costos de transacción mínimos e inmutabilidad distribuida.
- **¿Por qué Blockchain?:** Porque crea un árbitro neutral e incorruptible entre partes que no confían ciegamente entre sí (productor, feedlot y frigorífico).

---

### Slide 7 — Impacto y Hoja de Ruta
**Título:** Transparencia Progresiva y Roadmap
- **Impacto tangible inmediato:**
  - Reducción de tareas manuales de consolidación documental.
  - Acceso inmediato a la información del lote con un simple escaneo QR.
  - Cero afirmaciones infundadas: distinción transparente entre datos declarados, comprobados y pendientes.
- **Próximos pasos (Roadmap post-hackathon):**
  - *Fase 1 (Meses 1–3):* Integración directa vía API con sistemas de gestión de balanzas y DT-e SENASA.
  - *Fase 2 (Meses 4–6):* Conexión con APIs de monitoreo satelital para validación automatizada de libre deforestación (EUDR).
  - *Fase 3 (Meses 7+):* Piloto comercial con frigorífico regional exportador.

---

## 2. Guión de Demostración en Vivo (3 Minutos Exactos)

| Tiempo | Acción en Pantalla | Relato del Presentador |
|--------|--------------------|------------------------|
| **0:00 – 0:30** | Portada / Diapositiva de Problema | *"Buenas tardes al jurado. Hoy en Argentina, cuando un frigorífico exporta carne de corral, reconstruir qué grano comió ese ganado requiere juntar decenas de planillas físicas y remitos dispersos. No hay garantía matemática de que el mismo silo de maíz no se haya computado dos veces."* |
| **0:30 – 1:00** | Abrir Dashboard / Vista de Lotes | *"AgroChain FeedTrace resuelve esto uniendo ambos extremos. Aquí vemos el lote agrícola de maíz AGR-001 con 10.000 kg cosechados en Bandera, y nuestro lote ganadero GAN-001 con 20 animales en Mercedes, Corrientes."* |
| **1:00 – 1:45** | Ejecutar Asignación de 2.000 kg | *"Asignamos 2.000 kg de maíz al lote ganadero para el ciclo de engorde. Al presionar Confirmar, la transacción se procesa en el Smart Contract: el saldo del lote de maíz pasa inmediatamente a 8.000 kg remanentes, dejando un registro inmutable en blockchain."* |
| **1:45 – 2:15** | Intentar asignación inválida (e.g., 9.000 kg) | *"¿Qué ocurre si alguien intenta asignar 9.000 kg más habiendo solo 8.000 kg de saldo? El sistema rechaza la operación automáticamente por saldo insuficiente en contrato. El grano no puede duplicarse."* |
| **2:15 – 3:00** | Abrir `/pasaporte/GAN-001` y proyectar QR | *"El resultado para el comprador o consumidor es este Pasaporte Digital. Escaneable por cualquier teléfono sin usuario ni clave. Muestra el historial completo de alimentación, los remitos públicos con hash SHA-256, la transacción on-chain, y con total honestidad indica qué evidencia está certificada y cuál está en proceso."* |

> **Plan de Contingencia ante Fallas de Conectividad:** Se disponen de capturas en alta resolución y datos en caché local navegables para realizar el recorrido idéntico sin interrumpir la presentación.

---

## 3. Entregables Oficiales y Documentación de Proyecto

### 3.1 Problema y Usuario
- **Problema:** Fragmentación de la información de procedencia y alimentación animal en la cadena bovina, dificultando la demostración fehaciente del origen de las raciones y permitiendo la duplicación no intencional de inventario agrícola.
- **Usuario:** Productores mixtos, administradores de feedlots y responsables de calidad en plantas frigoríficas.

### 3.2 Propuesta de Valor
- **Propuesta:** Pasaporte digital ganadero abierto que consolida el historial de alimentación con deducción estricta de inventario en Smart Contract, permitiendo a compradores verificar la integridad cuantitativa de origen en segundos.

### 3.3 Fuentes Consultadas
1. **SENASA:** Normativa para Documento de Tránsito Electrónico (DT-e) y Registro Nacional Sanitario de Productores Agropecuarios (RENSPA).
2. **Reglamento (UE) 2023/1115 (EUDR):** Directrices de debida diligencia de la Unión Europea sobre cadenas libres de deforestación.
3. **Bolsa de Cereales y Cámaras Arbitrales:** Estándares de calidad y documentación de cartas de porte electrónica para granos.
4. **Ethereum Improvement Proposals (EIP-155 / EVM):** Estándares de inmutabilidad y eventos en contratos inteligentes.

### 3.4 Enlace a Demo y Acceso Público
- **Ruta de Demostración del Pasaporte:** `/pasaporte/GAN-001`
- **Portal de Pasaportes Demo:** `/pasaporte`
- **Página de Pitch Deck Interactivo:** `/pitch`
- **Despliegue Demo:** Vercel (Production URL: `https://agrochain-feedtrace.vercel.app/pasaporte/GAN-001`)

### 3.5 Tecnologías Utilizadas
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Pure SVG QR Vector Generator.
- **Persistencia:** Supabase PostgreSQL con Row Level Security (RLS) y Triggers transaccionales.
- **Blockchain:** Solidity 0.8.28, Hardhat, Ethers.js v6, Polygon Amoy Testnet (Chain ID 80002).

### 3.6 Impacto Potencial
- **Eficiencia operativa:** Menor carga de trabajo administrativo para responder a auditorías documentales de compradores.
- **Diferenciación de producto:** Capacidad de transparentar ante el frigorífico el plan nutricional exacto recibido por la tropa ganadera.
- **Confianza comercial:** Eliminación del riesgo de doble asignación de granos mediante trazabilidad criptográfica.

### 3.7 Limitaciones Actuales
- La conexión con organismos oficiales (SENASA/AFIP) en esta fase de Ideathon se realiza mediante esquemas de datos simulados y hashes criptográficos de prueba.
- La verificación de deforestación satelital no se emite de forma automática, manteniéndose correctamente clasificada como "Pendiente de auditoría".

### 3.8 Próximo Paso de Validación
- Conducir entrevistas en profundidad y un taller de validación con 3 feedlots y 1 planta frigorífica exportadora de la provincia de Corrientes / Chaco para ajustar el modelo de datos nutricional a sus reportes diarios de balanza.

### 3.9 Declaración de Uso de IA, Código Previo y Datos Ficticios
- **Uso de Inteligencia Artificial:** Se utilizaron herramientas de asistencia de código con supervisión y diseño técnico humano para la aceleración del prototipado del pasaporte digital, componentes visuales y automatización de pruebas de QA.
- **Código Previo:** El proyecto se apoyó en librerías open-source estándar de la industria (Next.js, Ethers.js, React). Los contratos inteligentes y lógica de negocio de feedtrace fueron estructurados para el ideathon.
- **Uso de Datos Ficticios:** Todos los nombres de establecimientos ("Estancia El Ombú", "Campo La Esperanza"), productores y números de RENSPA utilizados en las demostraciones son 100% ficticios para preservar la privacidad y cumplir con las normas de confidencialidad de datos.
