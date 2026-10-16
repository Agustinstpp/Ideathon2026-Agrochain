/**
 * Deprecado: Se utiliza el motor de referencia probado por Persona 2 (qrcodegen).
 * Este archivo se mantiene únicamente por compatibilidad de tipos si fuera necesario.
 */
import qrcodegen from '@/components/ui/qrcodegen';

export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

/**
 * Genera la matriz QR utilizando la librería de referencia oficial probada.
 */
export function generateQrMatrix(text: string, ecl: QrErrorCorrectionLevel = 'M'): boolean[][] {
  const eccMap = {
    L: qrcodegen.QrCode.Ecc.LOW,
    M: qrcodegen.QrCode.Ecc.MEDIUM,
    Q: qrcodegen.QrCode.Ecc.QUARTILE,
    H: qrcodegen.QrCode.Ecc.HIGH,
  };

  const qr = qrcodegen.QrCode.encodeText(text, eccMap[ecl] || qrcodegen.QrCode.Ecc.MEDIUM);
  const matrix: boolean[][] = [];
  for (let y = 0; y < qr.size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < qr.size; x++) {
      row.push(qr.getModule(x, y));
    }
    matrix.push(row);
  }
  return matrix;
}
