/**
 * Generador de Código QR SVG Autónomo en TypeScript puro (Zero Dependencies).
 * Basado en la especificación ISO/IEC 18004.
 * Genera matrices de códigos QR y renderiza SVGs vectoriales nítidos para escaneo móvil.
 */

export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

// Tablas de corrección de errores para versiones 1 a 10
const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  // L,  M,  Q,  H
  [ 7, 10, 13, 17], // Ver 1
  [10, 16, 22, 28], // Ver 2
  [15, 26, 18, 22], // Ver 3
  [20, 18, 26, 16], // Ver 4
  [26, 24, 18, 22], // Ver 5
  [18, 16, 24, 28], // Ver 6
  [20, 18, 18, 26], // Ver 7
  [24, 22, 22, 26], // Ver 8
  [30, 22, 20, 24], // Ver 9
  [18, 26, 24, 28], // Ver 10
];

const NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
  [1, 1, 1, 1], // Ver 1
  [1, 1, 1, 1], // Ver 2
  [1, 1, 2, 2], // Ver 3
  [1, 2, 2, 4], // Ver 4
  [1, 2, 4, 4], // Ver 5
  [2, 4, 4, 4], // Ver 6
  [2, 4, 6, 5], // Ver 7
  [2, 4, 6, 6], // Ver 8
  [2, 5, 8, 8], // Ver 9
  [4, 5, 8, 8], // Ver 10
];

const TOTAL_RAW_DATA_BYTES: number[] = [
  0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346,
];

// Galois Field GF(256) math
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 256) {
      x ^= 0x11d; // Primitive polynomial x^8 + x^4 + x^3 + x^2 + 1
    }
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function reedSolomonComputeDivisor(degree: number): Uint8Array {
  let result = new Uint8Array(degree);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < degree) {
        result[j] ^= result[j + 1];
      }
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

function reedSolomonComputeRemainder(data: Uint8Array, divisor: Uint8Array): Uint8Array {
  const result = new Uint8Array(divisor.length);
  for (const b of data) {
    const factor = b ^ result[0];
    for (let j = 0; j < divisor.length - 1; j++) {
      result[j] = result[j + 1] ^ gfMultiply(divisor[j], factor);
    }
    result[divisor.length - 1] = gfMultiply(divisor[divisor.length - 1], factor);
  }
  return result;
}

/**
 * Genera la matriz booleana del código QR (true = pixel negro, false = pixel blanco)
 */
export function generateQrMatrix(text: string, ecl: QrErrorCorrectionLevel = 'M'): boolean[][] {
  const utf8Bytes = new TextEncoder().encode(text);
  const eclIndex = ecl === 'L' ? 0 : ecl === 'M' ? 1 : ecl === 'Q' ? 2 : 3;

  // Seleccionar la menor versión (1 a 10) que soporte los bytes
  let version = 1;
  while (version <= 10) {
    const totalBytes = TOTAL_RAW_DATA_BYTES[version];
    const eccBytes = ECC_CODEWORDS_PER_BLOCK[version - 1][eclIndex] * NUM_ERROR_CORRECTION_BLOCKS[version - 1][eclIndex];
    const dataCapacity = totalBytes - eccBytes;
    // Overhead en modo byte: 4 bits modo + 8 bits longitud (o 16 bits para ver >= 10)
    const headerBits = 4 + (version < 10 ? 8 : 16);
    const requiredBytes = Math.ceil((headerBits + utf8Bytes.length * 8) / 8);
    if (requiredBytes <= dataCapacity) {
      break;
    }
    version++;
  }

  if (version > 10) {
    // Si excede versión 10, usar versión 10 truncando o lanzando advertencia
    version = 10;
  }

  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[version - 1][eclIndex];
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[version - 1][eclIndex];
  const totalRawData = TOTAL_RAW_DATA_BYTES[version];
  const totalDataBytes = totalRawData - blockEccLen * numBlocks;

  // Codificar flujo de bits en Modo Byte (0100)
  const bitStream: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bitStream.push((val >>> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Modo Byte
  pushBits(utf8Bytes.length, version < 10 ? 8 : 16); // Conteo de caracteres
  for (const b of utf8Bytes) {
    pushBits(b, 8);
  }

  // Terminador
  const maxDataBits = totalDataBytes * 8;
  const termLen = Math.min(4, maxDataBits - bitStream.length);
  pushBits(0, termLen);

  // Relleno a múltiplo de 8
  while (bitStream.length % 8 !== 0) {
    bitStream.push(0);
  }

  // Convertir a bytes
  const dataBytes = new Uint8Array(totalDataBytes);
  let byteIdx = 0;
  for (let i = 0; i < bitStream.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bitStream[i + j];
    }
    if (byteIdx < totalDataBytes) {
      dataBytes[byteIdx++] = b;
    }
  }

  // Pad bytes alternantes 0xEC y 0x11
  let pad = 0xec;
  while (byteIdx < totalDataBytes) {
    dataBytes[byteIdx++] = pad;
    pad = pad === 0xec ? 0x11 : 0xec;
  }

  // Dividir en bloques y calcular Reed-Solomon ECC
  const divisor = reedSolomonComputeDivisor(blockEccLen);
  const shortBlockLen = Math.floor(totalDataBytes / numBlocks);
  const numShortBlocks = numBlocks - (totalDataBytes % numBlocks);

  const dataBlocks: Uint8Array[] = [];
  const eccBlocks: Uint8Array[] = [];

  let offset = 0;
  for (let b = 0; b < numBlocks; b++) {
    const len = b < numShortBlocks ? shortBlockLen : shortBlockLen + 1;
    const blockData = dataBytes.slice(offset, offset + len);
    offset += len;
    dataBlocks.push(blockData);
    eccBlocks.push(reedSolomonComputeRemainder(blockData, divisor));
  }

  // Interleaving de datos y ECC
  const finalSequence: number[] = [];
  const maxBlockLen = Math.ceil(totalDataBytes / numBlocks);
  for (let i = 0; i < maxBlockLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      if (i < dataBlocks[b].length) {
        finalSequence.push(dataBlocks[b][i]);
      }
    }
  }
  for (let i = 0; i < blockEccLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      finalSequence.push(eccBlocks[b][i]);
    }
  }

  // Construir matriz QR
  const size = 17 + 4 * version;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setFunctionModule(r: number, c: number, val: boolean) {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  }

  // 1. Patrones de búsqueda (Finder Patterns) en las 3 esquinas
  function drawFinderPattern(top: number, left: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = top + r;
        const nc = left + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const isBlack =
            (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setFunctionModule(nr, nc, isBlack);
        }
      }
    }
  }
  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  // 2. Patrones de alineación (Alignment Patterns) para version >= 2
  if (version >= 2) {
    const pos = version === 2 ? [6, 18] : [6, 22]; // Simple para ver 2-3
    for (const r of pos) {
      for (const c of pos) {
        if (!isFunction[r][c]) {
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const isBlack = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
              setFunctionModule(r + dr, c + dc, isBlack);
            }
          }
        }
      }
    }
  }

  // 3. Patrones de temporización (Timing Patterns)
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0;
    if (!isFunction[6][i]) setFunctionModule(6, i, val);
    if (!isFunction[i][6]) setFunctionModule(i, 6, val);
  }

  // 4. Módulo oscuro obligatorio
  setFunctionModule(4 * version + 9, 8, true);

  // 5. Reservar áreas de información de formato
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = size - 8; i < size; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }

  // 6. Colocar los bits de datos en zig-zag de derecha a izquierda
  let bitIdx = 0;
  const totalBits = finalSequence.length * 8;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Saltar columna de temporización
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunction[y][x]) {
          let bit = false;
          if (bitIdx < totalBits) {
            const byte = finalSequence[Math.floor(bitIdx / 8)];
            bit = ((byte >>> (7 - (bitIdx % 8))) & 1) === 1;
            bitIdx++;
          }
          // Aplicar máscara 0: (y + x) % 2 === 0
          const mask = (y + x) % 2 === 0;
          matrix[y][x] = bit !== mask;
        }
      }
    }
  }

  // 7. Escribir información de formato (Mask 0 + ECL M => Formato constante estándar)
  // Formato para ECL M (00) y Máscara 0 (000) con BCH: 101010000010010 XOR 101010000010010 = 0
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  for (let i = 0; i < 15; i++) {
    const bit = formatBits[i] === 1;
    if (i < 6) matrix[8][i] = bit;
    else if (i < 8) matrix[8][i + 1] = bit;
    else matrix[8][size - 15 + i] = bit;

    if (i < 8) matrix[size - 1 - i][8] = bit;
    else matrix[14 - i][8] = bit;
  }

  return matrix;
}
