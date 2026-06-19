export interface DecodeProcedureDefinition {
  slug: string;
  name: string;
  ecuName: string;
  eepromType: string;
  expectedSize: number;
  offsetHex: string;
  writeBytesHex: string;
}

export interface DecodeValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DecodeApplyResult {
  success: boolean;
  buffer?: Buffer;
  offsetApplied?: string;
  errors?: string[];
}

export interface DecodeContext {
  originalFilename: string;
  fileBuffer: Buffer;
}
