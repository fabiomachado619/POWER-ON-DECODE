import type { DecodeProcedureDefinition } from "./decoder";

export const SSANGYONG_MODULE_SLUG = "ssangyong";

/**
 * Regras centralizadas de procedimentos SsangYong.
 * Novos procedimentos devem ser adicionados apenas neste arquivo.
 */
export const SSANGYONG_PROCEDURES: DecodeProcedureDefinition[] = [
  {
    slug: "reexton-5cyl-25c320",
    name: "SsangYong Rexton 5 cilindros — EEPROM 25C320 / 25LC320",
    ecuName: "SsangYong Rexton 5 cilindros",
    eepromType: "25C320 / 25LC320",
    expectedSize: 4096,
    offsetHex: "0x03F0",
    writeBytesHex: "01 00 AE 48 00 00 00 10 06 16 00 00 00 19 04 3D",
  },
];

export function getSsangyongProcedureBySlug(
  slug: string
): DecodeProcedureDefinition | undefined {
  return SSANGYONG_PROCEDURES.find((procedure) => procedure.slug === slug);
}

export function listSsangyongProcedures(): DecodeProcedureDefinition[] {
  return [...SSANGYONG_PROCEDURES];
}
