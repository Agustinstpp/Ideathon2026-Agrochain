# AgroChain FeedTrace — Pitch Deck y Entregables Oficiales (NEA Tech 2026)

Documento maestro para la presentación ante el jurado, guión de demostración en vivo de 3 minutos y reporte oficial de entregables de **AgroChain FeedTrace**.

---

## 1. Pitch Deck Oficial (5 Minutos)

### Slide 1 — El Problema
**Título:** La fragmentación documental en la cadena de carne y granos
- **Situación actual:** La información sobre origen agrícola y alimentación ganadera se encuentra dispersa en planillas físicas, remitos en papel y sistemas desconectados.
- **Punto de dolor:** Ni el frigorífico ni el comprador pueden comprobar de manera fehaciente qué grano consumió un lote de animales, ni verificar si ese mismo grano ya fue asignado dos veces a diferentes lotes ("doble cómputo" de inventario).
- **Consecuencia:** Carga administrativa manual, dificultades para demostrar origen fidedigno y falta de una prueba técnica compartida.

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
- **El problema de las declaraciones tradicionales:** Una planilla o declaración jurada no impide asignar el mismo silo de maíz a múltiples corrales superando la cosecha real.
- **Nuestra solución:** Un Smart Contract en Solidity (`AgroChainTrace.sol`) que descuenta el saldo de grano en tiempo real al asignar raciones:
  - Cosecha inicial: **10.000 kg** de maíz en silo (Lote AGR-001).
  - Asignación al Lote GAN-001: **2.000 kg**.
  - Saldo inmutable remanente: **8.000 kg**.
  - Si un operador intenta asignar más cantidad de la disponible en silo, la operación se rechaza por saldo insuficiente.

---

### Slide 4 — Demostración de Producto
**Título:** El Pasaporte Digital en Acción
- **Vista interactiva mobile-first:** `/pasaporte/GAN-001`.
- **Estructura clara para el comprador:**
  1. *Qué lote ve:* Lote GAN-001 (20 animales, Mercedes, Corrientes).
  2. *De dónde proviene:* Establecimiento Demo Corrientes con hash de origen declarado.
  3. *Qué alimento consumió:* 2.000 kg de Maíz del lote agrícola AGR-001.
  4. *Estado técnico transparente:* Marcado explícitamente como "Simulado" con aviso claro de demostración, sin prometer transacciones de red pública que no existen.

---

### Slide 5 — Mercado y Modelo de Adopción
**Título:** Actores y Validación Comercial
- **Ecosistema de usuarios:**
  - *Productores agrícolas y acopios:* Declaran lotes de grano y entregan remitos con comprobante hash.
  - *Feedlots y establecimientos de engorde:* Gestionan raciones y consumos de corral.
  - *Frigoríficos:* **Potenciales pagadores del servicio** (sujeto a validación comercial posterior), motivados por exigir garantías de alimentación a sus proveedores.
- **Estrategia de entrada:** Validación en pilotos cerrados en la cuenca NEA (Corrientes, Chaco).

---

### Slide 6 — Viabilidad y Arquitectura
**Título:** Stack Tecnológico Robusto y Eficiente
- **Backend transaccional:** Supabase PostgreSQL con Row Level Security (RLS) y triggers de integridad.
- **Frontend y Pasaporte Público:** Next.js 14 App Router con diseño mobile-first y código QR escaneable desde celulares.
- **Capa de Verificabilidad:** Smart Contracts en Solidity (`AgroChainTrace.sol`) con lógica de control anti double-spending (operando en modo simulado para la demo del hackathon).
- **¿Por qué Blockchain?:** Porque aporta una regla matemática neutral e incorruptible entre partes comerciales independientes.

---

### Slide 7 — Impacto y Hoja de Ruta
**Título:** Transparencia Progresiva y Roadmap
- **Impacto tangible:**
  - Reducción de tareas manuales de consolidación documental entre campo y frigorífico.
  - Disponibilidad inmediata de la historia del lote con un simple escaneo QR.
  - Comunicación transparente: distinción estricta entre datos declarados y comprobados.
- **Próximos pasos (Roadmap):**
  - *Fase 1 (Meses 1–3):* Integración directa con balanzas electrónicas de tolva.
  - *Fase 2 (Meses 4–6):* Pruebas de integración con sistemas de gestión agropecuaria.
  - *Fase 3 (Meses 7+):* Validación comercial y piloto con frigorífico regional.

---

## 2. Guión de Demostración en Vivo (3 Minutos)

| Tiempo | Acción en Pantalla | Relato del Presentador |
|--------|--------------------|------------------------|
| **0:00 – 0:30** | Portada / Slide de Problema | *"Buenas tardes. Hoy en la cadena cárnica, reconstruir qué grano consumió un lote de novillos requiere cruzar planillas y remitos desconectados. No hay una forma técnica simple de comprobar que un mismo silo de maíz no se computó dos veces."* |
| **0:30 – 1:00** | Abrir Dashboard / Vista de Lotes | *"AgroChain FeedTrace conecta ambos extremos. Aquí vemos el lote agrícola de maíz AGR-001 con 10.000 kg cosechados, y nuestro lote ganadero GAN-001 con 20 animales en Mercedes, Corrientes."* |
| **1:00 – 1:45** | Registrar Asignación de 2.000 kg | *"Registramos una ración de 2.000 kg de maíz para el lote ganadero. Al confirmar, el inventario del silo descuenta el alimento y el saldo remanente pasa inmediatamente a 8.000 kg."* |
| **1:45 – 2:15** | Mostrar rechazo por saldo insuficiente | *"Si intentamos asignar más cantidad de la que queda en el silo (por ejemplo 9.000 kg), el sistema rechaza la operación automáticamente por saldo insuficiente. El grano no puede duplicarse."* |
| **2:15 – 3:00** | Abrir `/pasaporte/GAN-001` y proyectar QR | *"El resultado es este Pasaporte Digital. Se abre mediante QR desde cualquier teléfono sin pedir inicio de sesión. Muestra el historial de alimentación, los remitos públicos con hash SHA-256 y, con total transparencia, indica que estamos en modo de demostración sin prometer registros ficticios en blockchain pública."* |

---

## 3. Entregables Oficiales

### 3.1 Problema y Usuario
- **Problema:** Dispersión de la información de origen y alimentación en la producción ganadera, con riesgo de doble asignación de inventario agrícola.
- **Usuario:** Establecimientos ganaderos, feedlots y frigoríficos que requieren verificar la historia alimentaria del ganado.

### 3.2 Propuesta de Valor
- Pasaporte digital accesible por QR que transparenta el origen y las raciones consumidas por el lote, con control de saldos que impide la sobreasignación de grano.

### 3.3 Fuentes Consultadas
1. **SENASA:** Directrices documentales para tránsito ganadero (DT-e) y registros de productores (RENSPA).
2. **Bolsa de Cereales:** Documentación y circuitos de cartas de porte y remitos de granos.
3. **EVM / Solidity Standards:** Patrones de control de saldos y emisión de eventos inmutables.

### 3.4 Enlace a Demo y Acceso Público
- **Ruta del Pasaporte Demo:** `/pasaporte/GAN-001`
- **Índice de Pasaportes:** `/pasaporte`
- **Presentación Interactiva:** `/pitch`

### 3.5 Tecnologías Utilizadas
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, componente QrSvg con librería probada qrcodegen.
- **Backend:** Supabase PostgreSQL con RLS y triggers de integridad.
- **Smart Contracts:** Solidity 0.8.28 con Hardhat (ejecutando en modo simulación para la demo).

### 3.6 Impacto Potencial
- Menor tiempo administrativo en consolidación de datos.
- Mayor disponibilidad y transparencia de la información para compradores.

### 3.7 Limitaciones Actuales
- El backend opera actualmente en modo de demostración simulado (los hashes de transacción son de prueba).
- No cuenta con integraciones automáticas a organismos estatales en esta fase de prototipo.

### 3.8 Próximo Paso de Validación
- Entrevistas y pruebas de concepto con 3 establecimientos del NEA para validar la usabilidad de la ficha pública ante compradores.

### 3.9 Declaración de Uso de IA, Código Previo y Datos Ficticios
- **Uso de IA:** Asistencia para prototipado rápido de código, interfaces y scripts de prueba bajo supervisión humana.
- **Código Previo:** Librerías estándar de código abierto (Next.js, React, qrcodegen).
- **Datos Ficticios:** Todos los nombres de establecimientos ("Establecimiento Demo Corrientes", "Campo Agrícola Demo") y códigos son simulados para demostración.
