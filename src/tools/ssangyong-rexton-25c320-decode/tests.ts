import fs from "fs";
import path from "path";
import { parseHexBytes, parseHexOffset } from "@/lib/binaryFile";
import { getSsangyongProcedureBySlug } from "@/modules/ssangyong/procedures";
import { processSsangyongRexton25c320Decode } from "./processor";
import { ssangyongRexton25c320DecodeConfig } from "./tool.config";
import { validateSsangyongRexton25c320Decode } from "./validator";

const FIXTURE_DIR = path.join(
  process.cwd(),
  "test-fixtures",
  "ssangyong-rexton-25c320-decode"
);

function createOriginalBuffer(): Buffer {
  const procedure = getSsangyongProcedureBySlug("reexton-5cyl-25c320");
  if (!procedure) {
    throw new Error("Procedimento SsangYong não encontrado.");
  }

  const buffer = Buffer.alloc(procedure.expectedSize, 0xff);
  const offset = parseHexOffset(procedure.offsetHex);
  buffer.writeUInt8(0x00, offset);
  return buffer;
}

function loadFixture(name: string): Buffer | null {
  const filePath = path.join(FIXTURE_DIR, name);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath);
}

export async function runSsangyongRexton25c320DecodeTests() {
  const original =
    loadFixture("original.bin") ?? createOriginalBuffer();
  const context = {
    originalFilename: "test_original.bin",
    fileBuffer: Buffer.from(original),
  };

  const validation = validateSsangyongRexton25c320Decode(context);
  if (!validation.valid) {
    throw new Error(
      `Validação falhou: ${validation.errors.join(" ")}`
    );
  }

  const result = processSsangyongRexton25c320Decode(context);
  if (!result.success || !result.buffer) {
    throw new Error(
      `Processamento falhou: ${result.errors?.join(" ") ?? "erro desconhecido"}`
    );
  }

  if (result.buffer.length !== original.length) {
    throw new Error("Tamanho final diferente do original.");
  }

  const procedure = getSsangyongProcedureBySlug("reexton-5cyl-25c320");
  if (!procedure) {
    throw new Error("Procedimento SsangYong não encontrado.");
  }

  const offset = parseHexOffset(procedure.offsetHex);
  const expectedBytes = parseHexBytes(procedure.writeBytesHex);
  const actualBytes = result.buffer.subarray(
    offset,
    offset + expectedBytes.length
  );

  if (!actualBytes.equals(expectedBytes)) {
    throw new Error("Bytes aplicados no offset não correspondem ao esperado.");
  }

  for (let index = 0; index < original.length; index++) {
    const inWriteRange =
      index >= offset && index < offset + expectedBytes.length;
    if (inWriteRange) continue;
    if (result.buffer[index] !== original[index]) {
      throw new Error(
        `Byte alterado fora do offset permitido em 0x${index.toString(16)}.`
      );
    }
  }

  const expectedFixture = loadFixture("expected.bin");
  if (expectedFixture && !result.buffer.equals(expectedFixture)) {
    throw new Error("Resultado difere do arquivo expected.bin.");
  }
}
