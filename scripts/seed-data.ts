export type SeedMode = "production" | "dev";

export const PRODUCTION_TOOL_SLUG = "ssangyong-rexton-25c320-decode";

export const CATEGORIES = [
  {
    slug: "decode",
    name: "Decode",
    description:
      "Ferramentas para aplicação de decode em arquivos de módulos automotivos.",
    icon: "🔓",
    displayOrder: 1,
  },
  {
    slug: "reset",
    name: "Reset",
    description:
      "Ferramentas para reset de arquivos automotivos, como airbag, módulos e sistemas específicos.",
    icon: "🔄",
    displayOrder: 2,
  },
  {
    slug: "odometro",
    name: "Odômetro",
    description:
      "Ferramentas para correção técnica de quilometragem em arquivos de painel e módulos autorizados.",
    icon: "📊",
    displayOrder: 3,
  },
  {
    slug: "checksum",
    name: "Checksum",
    description:
      "Ferramentas para correção e validação de checksum em arquivos automotivos.",
    icon: "✓",
    displayOrder: 4,
  },
] as const;

export const PRODUCTION_MODULES = [
  {
    slug: "ssangyong",
    name: "SsangYong Decode",
    description: "Procedimentos de decode para EEPROM SsangYong.",
  },
] as const;

export const DEV_EXTRA_MODULES = [
  {
    slug: "volkswagen",
    name: "Volkswagen Decode",
    description: "Procedimentos de decode para ECU Volkswagen.",
  },
  {
    slug: "fiat",
    name: "Fiat Decode",
    description: "Procedimentos de decode para ECU Fiat.",
  },
  {
    slug: "jeep",
    name: "Jeep Decode",
    description: "Procedimentos de decode para ECU Jeep.",
  },
  {
    slug: "renault",
    name: "Renault Decode",
    description: "Procedimentos de decode para ECU Renault.",
  },
  {
    slug: "jeep-fiat-scanner",
    name: "Jeep/Fiat Scanner",
    description: "Ferramentas de scanner Jeep/Fiat.",
  },
  {
    slug: "fiat-reset",
    name: "Fiat Reset",
    description: "Ferramentas de reset para módulos Fiat.",
  },
  {
    slug: "volkswagen-odometro",
    name: "Volkswagen Odômetro",
    description: "Correção de odômetro Volkswagen.",
  },
  {
    slug: "volkswagen-checksum",
    name: "Volkswagen Checksum",
    description: "Correção de checksum Volkswagen/Bosch.",
  },
] as const;

export const PRODUCTION_MANUFACTURERS = [
  { slug: "ssangyong", name: "SsangYong", logoUrl: null, displayOrder: 1 },
] as const;

export const DEV_EXTRA_MANUFACTURERS = [
  { slug: "volkswagen", name: "Volkswagen", logoUrl: null, displayOrder: 2 },
  { slug: "fiat", name: "Fiat", logoUrl: null, displayOrder: 3 },
  { slug: "jeep", name: "Jeep", logoUrl: null, displayOrder: 4 },
  { slug: "renault", name: "Renault", logoUrl: null, displayOrder: 5 },
  { slug: "bosch", name: "Bosch", logoUrl: null, displayOrder: 6 },
] as const;

export function getModulesForMode(mode: SeedMode) {
  return mode === "production"
    ? [...PRODUCTION_MODULES]
    : [...PRODUCTION_MODULES, ...DEV_EXTRA_MODULES];
}

export function getManufacturersForMode(mode: SeedMode) {
  return mode === "production"
    ? [...PRODUCTION_MANUFACTURERS]
    : [...PRODUCTION_MANUFACTURERS, ...DEV_EXTRA_MANUFACTURERS];
}

export const PRODUCTION_MODULE_SLUGS = PRODUCTION_MODULES.map((item) => item.slug);
export const PRODUCTION_MANUFACTURER_SLUGS = PRODUCTION_MANUFACTURERS.map(
  (item) => item.slug
);
