export type ToolCategorySlug = "decode" | "reset" | "odometro" | "checksum";

export interface ToolConfig {
  slug: string;
  name: string;
  category: ToolCategorySlug;
  manufacturer: string;
  type: string;
  ecuName: string;
  eepromType?: string;
  expectedSize?: number;
  routePath: string;
  apiPath: string;
  purchaseUrl?: string;
  isImplemented: boolean;
  technicalVersion: string;
  moduleSlug: string;
  decodeProcedureSlug?: string;
  acceptedExtensions?: string[];
}

export interface ToolProcessContext {
  originalFilename: string;
  fileBuffer: Buffer;
}

export interface ToolValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ToolProcessResult {
  success: boolean;
  buffer?: Buffer;
  offsetApplied?: string;
  errors?: string[];
}

export interface RegisteredTool {
  config: ToolConfig;
  /** Somente servidor/API — nunca passar para Client Components. */
  validate: (context: ToolProcessContext) => ToolValidationResult;
  /** Somente servidor/API — nunca passar para Client Components. */
  process: (context: ToolProcessContext) => ToolProcessResult;
  /** Somente servidor/testes — nunca passar para Client Components. */
  runTests?: () => void | Promise<void>;
}

export interface ToolPageProps {
  toolSlug: string;
}
