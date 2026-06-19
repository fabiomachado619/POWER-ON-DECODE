import {
  parseHexBytes,
  parseHexOffset,
  validateBinExtension,
} from "@/lib/binaryFile";
import type {
  DecodeApplyResult,
  DecodeContext,
  DecodeProcedureDefinition,
  DecodeValidationResult,
} from "./decoder";

export function validateDecodeInput(
  context: DecodeContext,
  procedure: DecodeProcedureDefinition
): DecodeValidationResult {
  const errors: string[] = [];

  if (!context.originalFilename) {
    errors.push("Nome do arquivo não informado.");
  } else if (!validateBinExtension(context.originalFilename)) {
    errors.push("Extensão inválida. Envie um arquivo .bin.");
  }

  if (!context.fileBuffer || context.fileBuffer.length === 0) {
    errors.push("O arquivo enviado está vazio ou não pôde ser lido.");
  } else if (context.fileBuffer.length !== procedure.expectedSize) {
    errors.push(
      `Tamanho inválido. Esperado: ${procedure.expectedSize} bytes. Recebido: ${context.fileBuffer.length} bytes.`
    );
  }

  try {
    const offset = parseHexOffset(procedure.offsetHex);
    const writeBytes = parseHexBytes(procedure.writeBytesHex);

    if (offset + writeBytes.length > context.fileBuffer.length) {
      errors.push(
        `Offset ${procedure.offsetHex} não existe no arquivo para gravação de ${writeBytes.length} bytes.`
      );
    }
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : "Erro na configuração do procedimento."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function applyDecodeProcedure(
  context: DecodeContext,
  procedure: DecodeProcedureDefinition
): DecodeApplyResult {
  const validation = validateDecodeInput(context, procedure);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  try {
    const offset = parseHexOffset(procedure.offsetHex);
    const writeBytes = parseHexBytes(procedure.writeBytesHex);

    const outputBuffer = Buffer.from(context.fileBuffer);
    writeBytes.copy(outputBuffer, offset, 0, writeBytes.length);

    if (outputBuffer.length !== context.fileBuffer.length) {
      return {
        success: false,
        errors: ["Erro interno: tamanho final diferente do original."],
      };
    }

    return {
      success: true,
      buffer: outputBuffer,
      offsetApplied: procedure.offsetHex,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao aplicar decode.",
      ],
    };
  }
}
