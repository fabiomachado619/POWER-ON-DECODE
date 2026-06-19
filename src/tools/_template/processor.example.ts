import type { ToolProcessContext, ToolProcessResult } from "@/tools/types";
import { validate__PASCALNAME__ } from "./validator";

export function process__PASCALNAME__(
  context: ToolProcessContext
): ToolProcessResult {
  const validation = validate__PASCALNAME__(context);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  return {
    success: true,
    buffer: Buffer.from(context.fileBuffer),
  };
}
