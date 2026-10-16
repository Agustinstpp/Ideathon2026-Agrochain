import { createHash } from "crypto";

/**
 * Calcula un hash SHA-256 determinista a partir de cualquier objeto serializable a JSON.
 * Ordena alfabeticamente las claves para garantizar que dos representaciones del mismo objeto
 * produzcan exactamente la misma secuencia de bytes y el mismo hash SHA-256.
 */
export function calculateDeterministicJsonHash(data: unknown): string {
  const canonicalJson = stringifyDeterministic(data);
  return createHash("sha256").update(canonicalJson, "utf8").digest("hex");
}

/**
 * Calcula el hash SHA-256 de una cadena de texto plana o Buffer.
 */
export function calculateSha256(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Convierte un hash hexadecimal SHA-256 (64 caracteres) a formato bytes32 para contratos EVM ("0x" + 64 hex).
 */
export function hexToBytes32(hexString: string): string {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  if (cleanHex.length !== 64) {
    // Si es mas corto, rellenar a la derecha con ceros; si es mas largo, computar hash de 32 bytes
    if (cleanHex.length < 64) {
      return "0x" + cleanHex.padEnd(64, "0");
    }
    return "0x" + createHash("sha256").update(cleanHex).digest("hex");
  }
  return "0x" + cleanHex;
}

/**
 * Serializacion JSON determinista con ordenamiento recursivo de claves.
 */
function stringifyDeterministic(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(stringifyDeterministic).join(",") + "]";
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => {
    return `${JSON.stringify(key)}:${stringifyDeterministic(obj[key])}`;
  });
  return "{" + pairs.join(",") + "}";
}
