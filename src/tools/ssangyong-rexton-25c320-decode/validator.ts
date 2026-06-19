import {
  parseHexBytes,
  parseHexOffset,
  validateBinExtension,
} from "@/lib/binaryFile";
import { getSsangyongProcedureBySlug } from "@/modules/ssangyong/procedures";
import type {
  ToolProcessContext,
  ToolValidationResult,
} from "@/tools/types";
import { ssangyongRexton25c320DecodeConfig } from "./tool.config";

const PROCEDURE_SLUG =
  ssangyongRexton25c320DecodeConfig.decodeProcedureSlug ?? "reexton-5cyl-25c320";

export function validateSsangyongRexton25c320Decode(
  context: ToolProcessContext
): ToolValidationResult {
  const errors: string[] = [];
  const procedure = getSsangyongProcedureBySlug(PROCEDURE_SLUG);

  if (!procedure) {
    return {
      valid: false,
      errors: ["Procedimento técnico não encontrado no código."],
    };
  }

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
