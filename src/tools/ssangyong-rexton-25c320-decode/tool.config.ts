import type { ToolConfig } from "@/tools/types";

export const ssangyongRexton25c320DecodeConfig: ToolConfig = {
  slug: "ssangyong-rexton-25c320-decode",
  name: "Rexton 5 cilindros — EEPROM 25C320",
  category: "decode",
  manufacturer: "ssangyong",
  type: "decode",
  ecuName: "SsangYong Rexton 5 cilindros",
  eepromType: "25C320 / 25LC320",
  expectedSize: 4096,
  routePath: "/tools/ssangyong-rexton-25c320-decode",
  apiPath: "/api/tools/ssangyong-rexton-25c320-decode/process",
  purchaseUrl: "https://exemplo.com/comprar/ssangyong-rexton-25c320-decode",
  isImplemented: true,
  technicalVersion: "1.0.0",
  moduleSlug: "ssangyong",
  decodeProcedureSlug: "reexton-5cyl-25c320",
  acceptedExtensions: [".bin"],
  referenceImageUrl: "/images/tools/ssangyong-rexton-25c320-ecu-label.png",
  referenceImageAlt:
    "Etiqueta da ECU SsangYong Rexton 5 cilindros — EEPROM 25LC320",
  referenceImageCaption:
    "Confira a etiqueta da ECU antes de enviar o arquivo da EEPROM 25LC320.",
};
