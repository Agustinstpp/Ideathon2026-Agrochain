# AgroChain FeedTrace — Lista de QA y Pruebas de Aceptación (Persona 4)

Este documento detalla la lista de comprobación de aseguramiento de calidad (QA) y pruebas de aceptación para el **Pasaporte Digital Ganadero** de AgroChain FeedTrace, preparado para **NEA Tech 2026**.

---

## 1. Ejecución Automatizada

El repositorio cuenta con una suite de pruebas de QA automatizada de ejecución inmediata:

```bash
npx tsx scripts/test-passport-qa.ts
```

### Resultados de la Suite Automatizada
| # | Criterio de Aceptación | Estado | Resultado Obtenido |
|---|------------------------|:------:|--------------------|
| 1 | Pasaporte abre e identificador correcto | **APROBADO** | Lote GAN-001 cargado correctamente |
| 2 | Información ganadera (20 animales, Mercedes, Corrientes) | **APROBADO** | 20 cabezas en Mercedes, Corrientes |
| 3 | Historial de alimentación (Maíz, 2.000 kg, AGR-001) | **APROBADO** | Maíz Picado Silo Grano Húmedo, 2.000 kg asignados |
| 4 | Regla cuantitativa anti double-spending (Saldo 8.000 kg) | **APROBADO** | Inicial: 10.000 kg — Saldo remanente: 8.000 kg |
| 5 | Verificación on-chain (Polygon Amoy / Smart Contract) | **APROBADO** | Chain ID 80002, Contrato `0x5FbDB...` y Tx Hash |
| 6 | Privacidad estricta (Solo documentos públicos con SHA-256) | **APROBADO** | Cero fugas de contratos privados; hashes de 64 caracteres |
| 7 | Transparencia regulatoria (Sin afirmaciones EUDR sin prueba) | **APROBADO** | Estado "Pendiente de auditoría satelital" explícito |
| 8 | Código QR generado desde URL pública real (Sin localhost) | **APROBADO** | Matriz 33x33 vectorial para URL de producción |
| 9 | Manejo adecuado de datos pendientes (GAN-PENDING) | **APROBADO** | Estado `pending`, sin Tx Hash confirmada prematura |
| 10 | Manejo de lote inexistente (404 seguro) | **APROBADO** | Renderiza `PassportNotFound` con selector de demos |
| 11 | Etiqueta explícita de datos simulados para demo | **APROBADO** | Badge visible `is_simulated: true` |

---

## 2. Matriz de Verificación Manual (Checklist para el Jurado)

### 2.1 Apertura y Renderizado
- [x] **Ruta `/pasaporte/GAN-001`**: Carga de forma instantánea sin requerir login ni autenticación.
- [x] **Ruta `/pasaporte`**: Portal directorio con tarjetas de lotes demo disponibles y acceso directo.
- [x] **Mobile-First UX**: Probado en viewport de 375px (iPhone SE/13), 390px, 412px (Android) y 1024px+ (Desktop).

### 2.2 Información del Lote Ganadero
- [x] Código de Lote visible: `GAN-001`.
- [x] Cantidad: 20 animales.
- [x] Establecimiento ficticio: "Estancia El Ombú (Establecimiento Ficticio)".
- [x] Localidad y Provincia: Mercedes, Corrientes.
- [x] Origen declarado: Hash Keccak-256 de georreferencia/RENSPA con botón de copia rápida.

### 2.3 Alimentación y Trazabilidad Inversa
- [x] Cultivo: Maíz Picado Silo Grano Húmedo.
- [x] Código de Lote Agrícola: `AGR-001`.
- [x] Cantidad asignada: 2.000 kg.
- [x] Período: 01/10/2026 al 31/10/2026.
- [x] Saldo remanente visible: 8.000 kg sobre 10.000 kg cosechados.
- [x] Barra de porcentaje de deducción de silo (20% consumido, 80% disponible).

### 2.4 Evidencias y Manejo de Privacidad
- [x] Se exponen únicamente documentos públicos:
  - Remito Electrónico de Grano (Ficticio).
  - Documento de Tránsito SENASA DT-e (Ficticio).
  - Análisis Nutricional de Laboratorio (Ficticio).
- [x] Los contratos comerciales privados de compraventa NO son visibles en el pasaporte.
- [x] Cada documento expone su hash criptográfico SHA-256.
- [x] **Prudencia Regulatoria**: No se muestra «Certificado EUDR» ni «Libre de deforestación verificado» como logrado. Se indica explícitamente como "Pendiente de auditoría satelital" en la sección de transparencia.

### 2.5 Verificación On-Chain
- [x] Red indicada: Polygon Amoy Testnet (Chain ID 80002).
- [x] Dirección del contrato inteligente `AgroChainTrace.sol` copiable.
- [x] Hash de transacción disponible con enlace seguro hacia el explorador Polygonscan Amoy.
- [x] Estado: "Registro blockchain confirmado".

### 2.6 Código QR y Compartir
- [x] Generador SVG vectorial puro integrado (sin dependencias frágiles externas).
- [x] URL real de producción predeterminada: `https://agrochain-feedtrace.vercel.app/pasaporte/GAN-001`.
- [x] Protección anti-localhost: Evita que el jurado intente escanear una URL inaccesible desde su celular.
- [x] Soporte nativo para Web Share API (`navigator.share`) en teléfonos móviles y botón "Copiar Enlace".

### 2.7 Casos de Borde y Error
- [x] **Lote Pendiente (`/pasaporte/GAN-PENDING`)**: Exhibe estado en amarillo "Pendiente", sin hash de bloque confirmado.
- [x] **Lote Inexistente (`/pasaporte/LOTE-INVENTADO`)**: Muestra pantalla 404 amigable con explicación clara y botones para volver a `GAN-001` o `GAN-PENDING`.
