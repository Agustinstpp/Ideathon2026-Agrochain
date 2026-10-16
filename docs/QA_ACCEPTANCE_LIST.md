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
| 2 | Información ganadera real (20 animales, Mercedes, Corrientes) | **APROBADO** | 20 cabezas en Mercedes, Corrientes (Establecimiento Demo Corrientes) |
| 3 | Historial de alimentación coherente (Maíz, 2.000 kg, AGR-001) | **APROBADO** | Maíz, 2.000 kg asignados de AGR-001 |
| 4 | Regla cuantitativa anti double-spending (Saldo 8.000 kg) | **APROBADO** | Inicial: 10.000 kg — Saldo remanente: 8.000 kg |
| 5 | Modo simulado estricto (Sin bloque, sin Polygonscan) | **APROBADO** | Estado: Simulado, explorer_url: null, block_number: null |
| 6 | Generación QR oficial con librería probada (qrcodegen / QrSvg) | **APROBADO** | Código QR generado con qrcodegen, escaneable con lector OpenCV y celulares |
| 7 | Cero afirmaciones falsas de EUDR o certificaciones sin prueba | **APROBADO** | Limpio (0 menciones a EUDR / deforestación no comprobada) |
| 8 | Manejo adecuado de datos pendientes (GAN-PENDING) | **APROBADO** | Estado `pending`, sin Tx Hash confirmada prematura |
| 9 | Manejo de lote inexistente (404 seguro) | **APROBADO** | Renderiza `PassportNotFound` con selector de demos |
| 10 | URL dinámica con publicUrl (sin hardcodeo) | **APROBADO** | Toma `NEXT_PUBLIC_APP_URL` o el origen actual |

---

## 2. Matriz de Verificación Manual (Checklist para el Jurado)

### 2.1 Apertura y Renderizado
- [x] **Ruta `/pasaporte/GAN-001`**: Carga de forma instantánea sin requerir login ni autenticación.
- [x] **Ruta `/pasaporte`**: Portal directorio con tarjetas de lotes demo disponibles y acceso directo.
- [x] **Mobile-First UX y Paleta Unificada**: Estilo visual unificado con la aplicación (.ag, fondo #F6F2E8, tarjetas #FFFDF8, verde #1F4A32, marrón #8A5A2B, sin emojis, íconos SVG de `@/components/ui/Icon`).

### 2.2 Información del Lote Ganadero
- [x] Código de Lote visible: `GAN-001`.
- [x] Cantidad: 20 animales.
- [x] Establecimiento real: "Establecimiento Demo Corrientes".
- [x] Localidad y Provincia: Mercedes, Corrientes.
- [x] Origen declarado: Hash de georreferencia/RENSPA con botón de copia rápida. Si un dato no existe, se oculta la fila y no se inventa relleno.

### 2.3 Alimentación y Trazabilidad
- [x] Cultivo: Maíz.
- [x] Código de Lote Agrícola: `AGR-001`.
- [x] Cantidad asignada: 2.000 kg.
- [x] Período: 01/10/2026 al 31/10/2026.
- [x] Saldo remanente visible: 8.000 kg sobre 10.000 kg iniciales.

### 2.4 Transparencia y Modo Simulado
- [x] **Sin afirmaciones falsas**: Como el backend está en modo simulado, el pasaporte muestra "Simulado" y el aviso:
  `"Datos de demostración. No hay un registro en blockchain que verificar."`
- [x] **Sin enlaces falsos a exploradores**: No se muestran enlaces a Polygonscan, números de bloque ni fechas falsas mientras esté simulado.
- [x] **Sin certificaciones falsas**: Eliminada cualquier mención a EUDR o certificaciones no comprobadas.

### 2.5 Código QR y Compartir
- [x] Generado con el componente oficial probado de Persona 2 (`QrSvg` con `qrcodegen`).
- [x] Verificado: Es 100% legible y escaneable desde celulares reales y lectores OpenCV.
- [x] URL generada a través de `publicUrl()`.
- [x] Soporte nativo para Web Share API (`navigator.share`) en teléfonos móviles y botón "Copiar Enlace".

### 2.6 Casos de Borde y Error
- [x] **Lote Pendiente (`/pasaporte/GAN-PENDING`)**: Exhibe estado en amarillo "Pendiente", sin hash de bloque confirmado.
- [x] **Lote Inexistente (`/pasaporte/LOTE-INVENTADO`)**: Muestra pantalla 404 amigable con explicación clara y botones para volver a `GAN-001` o `GAN-PENDING`.
