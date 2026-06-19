import type { ToolProcessContext, ToolValidationResult } from "@/tools/types";

export function validate__PASCALNAME__(
  context: ToolProcessContext
): ToolValidationResult {
  const errors: string[] = [];

  if (!context.originalFilename.toLowerCase().endsWith(".bin")) {
    errors.push("Extensão inválida. Envie um arquivo .bin.");
  }

  if (!context.fileBuffer.length) {
    errors.push("O arquivo enviado está vazio ou não pôde ser lido.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
