import { parseHexBytes, parseHexOffset } from "@/lib/binaryFile";
import { getSsangyongProcedureBySlug } from "@/modules/ssangyong/procedures";
import type {
  ToolProcessContext,
  ToolProcessResult,
} from "@/tools/types";
import { validateSsangyongRexton25c320Decode } from "./validator";
import { ssangyongRexton25c320DecodeConfig } from "./tool.config";

const PROCEDURE_SLUG =
  ssangyongRexton25c320DecodeConfig.decodeProcedureSlug ?? "reexton-5cyl-25c320";

export function processSsangyongRexton25c320Decode(
  context: ToolProcessContext
): ToolProcessResult {
  const validation = validateSsangyongRexton25c320Decode(context);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  const procedure = getSsangyongProcedureBySlug(PROCEDURE_SLUG);
  if (!procedure) {
    return {
      success: false,
      errors: ["Procedimento técnico não encontrado no código."],
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
