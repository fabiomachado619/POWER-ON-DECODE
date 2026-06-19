export function parseHexOffset(offsetHex: string): number {
  const normalized = offsetHex.trim().toLowerCase();
  const value = normalized.startsWith("0x")
    ? normalized.slice(2)
    : normalized;

  if (!/^[0-9a-f]+$/i.test(value)) {
    throw new Error(`Offset hexadecimal inválido: ${offsetHex}`);
  }

  return parseInt(value, 16);
}

export function parseHexBytes(hexString: string): Buffer {
  const cleaned = hexString.replace(/\s+/g, "").toLowerCase();

  if (!/^[0-9a-f]*$/.test(cleaned) || cleaned.length % 2 !== 0) {
    throw new Error("Sequência de bytes hexadecimais inválida.");
  }

  return Buffer.from(cleaned, "hex");
}

export function validateBinExtension(filename: string): boolean {
  return filename.toLowerCase().endsWith(".bin");
}

export function buildDecodedFilename(originalFilename: string): string {
  const baseName = originalFilename.replace(/\.bin$/i, "");
  return `${baseName}_DECODE_OFF.bin`;
}

export function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

export function readFileToBuffer(file: File): Promise<Buffer> {
  return file.arrayBuffer().then((arrayBuffer) => Buffer.from(arrayBuffer));
}

export async function readRequestFileToBuffer(
  file: File | null | undefined
): Promise<Buffer> {
  if (!file) {
    throw new Error("Nenhum arquivo foi enviado.");
  }

  if (file.size === 0) {
    throw new Error("O arquivo enviado está vazio.");
  }

  try {
    return await readFileToBuffer(file);
  } catch {
    throw new Error("Erro ao ler o arquivo enviado.");
  }
}
