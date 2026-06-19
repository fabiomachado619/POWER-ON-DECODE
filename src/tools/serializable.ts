import type { ToolConfig } from "@/tools/types";

/**
 * Metadados serializáveis exibidos no Client Component da ferramenta.
 * Nunca inclua validate/process/runTests aqui.
 */
export type ToolRunnerViewModel = ToolConfig;

export function toToolRunnerViewModel(config: ToolConfig): ToolRunnerViewModel {
  return {
    slug: config.slug,
    name: config.name,
    category: config.category,
    manufacturer: config.manufacturer,
    type: config.type,
    ecuName: config.ecuName,
    eepromType: config.eepromType,
    expectedSize: config.expectedSize,
    routePath: config.routePath,
    apiPath: config.apiPath,
    purchaseUrl: config.purchaseUrl,
    isImplemented: config.isImplemented,
    technicalVersion: config.technicalVersion,
    moduleSlug: config.moduleSlug,
    decodeProcedureSlug: config.decodeProcedureSlug,
    acceptedExtensions: config.acceptedExtensions
      ? [...config.acceptedExtensions]
      : undefined,
    referenceImageUrl: config.referenceImageUrl,
    referenceImageAlt: config.referenceImageAlt,
    referenceImageCaption: config.referenceImageCaption,
  };
}

export function assertToolRunnerViewModel(
  value: ToolRunnerViewModel
): ToolRunnerViewModel {
  JSON.stringify(value);
  return value;
}
