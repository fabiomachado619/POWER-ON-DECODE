import type { PrismaClient } from "@prisma/client";
import { listRegisteredTools } from "../src/tools/registry";
import {
  PRODUCTION_MANUFACTURER_SLUGS,
  PRODUCTION_MODULE_SLUGS,
  PRODUCTION_TOOL_SLUG,
  type SeedMode,
} from "./seed-data";

const PURCHASE_BASE = "https://exemplo.com/comprar";

export type ShowcaseToolSeed = {
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  type: string;
  manufacturerSlug: string;
  moduleSlug: string;
  ecuName?: string;
  eepromType?: string;
  toolRoute?: string;
  isImplemented: boolean;
  decodeProcedureSlug?: string;
  displayOrder: number;
};

const SHOWCASE_ONLY_TOOLS: ShowcaseToolSeed[] = [
  {
    slug: "ssangyong-rexton-fdsw-95160",
    name: "Rexton FDSW — EEPROM 95160",
    description: "Procedimento reservado para EEPROM 95160. Em breve na plataforma.",
    categorySlug: "decode",
    type: "decode",
    manufacturerSlug: "ssangyong",
    moduleSlug: "ssangyong",
    ecuName: "SsangYong Rexton FDSW",
    eepromType: "95160",
    isImplemented: false,
    displayOrder: 2,
  },
  {
    slug: "volkswagen-me7-5-30",
    name: "ME7.5.30 Decode",
    description: "Decode para ECU Bosch ME7.5.30. Disponível para compra.",
    categorySlug: "decode",
    type: "decode",
    manufacturerSlug: "volkswagen",
    moduleSlug: "volkswagen",
    ecuName: "ME7.5.30",
    isImplemented: false,
    displayOrder: 3,
  },
  {
    slug: "fiat-iaw-10gf",
    name: "IAW 10GF Decode",
    description: "Decode para ECU Magneti Marelli IAW 10GF.",
    categorySlug: "decode",
    type: "decode",
    manufacturerSlug: "fiat",
    moduleSlug: "fiat",
    ecuName: "IAW 10GF",
    isImplemented: false,
    displayOrder: 4,
  },
  {
    slug: "fiat-reset-airbag",
    name: "Reset Airbag Fiat",
    description: "Reset de arquivo de airbag para módulos Fiat autorizados.",
    categorySlug: "reset",
    type: "reset",
    manufacturerSlug: "fiat",
    moduleSlug: "fiat-reset",
    ecuName: "Airbag Fiat",
    isImplemented: false,
    displayOrder: 5,
  },
  {
    slug: "volkswagen-odometro-gol-g6",
    name: "Correção Odômetro Gol G6",
    description: "Correção técnica de quilometragem no painel Gol G6.",
    categorySlug: "odometro",
    type: "odometro",
    manufacturerSlug: "volkswagen",
    moduleSlug: "volkswagen-odometro",
    ecuName: "Painel Gol G6",
    isImplemented: false,
    displayOrder: 6,
  },
  {
    slug: "checksum-bosch-edc17",
    name: "Checksum Bosch EDC17",
    description: "Correção e validação de checksum para arquivos EDC17.",
    categorySlug: "checksum",
    type: "checksum",
    manufacturerSlug: "bosch",
    moduleSlug: "volkswagen-checksum",
    ecuName: "Bosch EDC17",
    isImplemented: false,
    displayOrder: 7,
  },
  {
    slug: "volkswagen-iaw-4gv",
    name: "IAW 4GV Decode",
    description: "Decode para ECU Magneti Marelli IAW 4GV.",
    categorySlug: "decode",
    type: "decode",
    manufacturerSlug: "volkswagen",
    moduleSlug: "volkswagen",
    ecuName: "IAW 4GV",
    isImplemented: false,
    displayOrder: 8,
  },
  {
    slug: "fiat-iaw-59fb",
    name: "IAW 59FB Decode",
    description: "Decode para ECU Magneti Marelli IAW 59FB.",
    categorySlug: "decode",
    type: "decode",
    manufacturerSlug: "fiat",
    moduleSlug: "fiat",
    ecuName: "IAW 59FB",
    isImplemented: false,
    displayOrder: 9,
  },
  {
    slug: "jeep-placeholder-decode",
    name: "Jeep ECU Decode",
    description: "Procedimentos Jeep em expansão. Adquira acesso antecipado.",
    categorySlug: "decode",
    type: "decode",
    manufacturerSlug: "jeep",
    moduleSlug: "jeep",
    isImplemented: false,
    displayOrder: 10,
  },
  {
    slug: "renault-placeholder-decode",
    name: "Renault ECU Decode",
    description: "Procedimentos Renault em expansão.",
    categorySlug: "decode",
    type: "decode",
    manufacturerSlug: "renault",
    moduleSlug: "renault",
    isImplemented: false,
    displayOrder: 11,
  },
];

const REGISTRY_COMMERCIAL: Record<
  string,
  Pick<ShowcaseToolSeed, "name" | "description">
> = {
  [PRODUCTION_TOOL_SLUG]: {
    name: "Rexton 5 cilindros — EEPROM 25C320",
    description:
      "Decode confirmado para EEPROM 25C320 / 25LC320 com gravação fixa em 0x03F0.",
  },
};

function buildRegistrySeeds(): ShowcaseToolSeed[] {
  return listRegisteredTools().map((tool, index) => {
    const commercial = REGISTRY_COMMERCIAL[tool.config.slug];
    return {
      slug: tool.config.slug,
      name: commercial?.name ?? tool.config.name,
      description: commercial?.description ?? tool.config.name,
      categorySlug: tool.config.category,
      type: tool.config.type,
      manufacturerSlug: tool.config.manufacturer,
      moduleSlug: tool.config.moduleSlug,
      ecuName: tool.config.ecuName,
      eepromType: tool.config.eepromType,
      toolRoute: tool.config.routePath,
      isImplemented: tool.config.isImplemented,
      decodeProcedureSlug: tool.config.decodeProcedureSlug,
      displayOrder: index + 1,
    };
  });
}

export function buildToolSeeds(mode: SeedMode): ShowcaseToolSeed[] {
  const registrySeeds = buildRegistrySeeds();

  if (mode === "production") {
    return registrySeeds.filter((tool) => tool.slug === PRODUCTION_TOOL_SLUG);
  }

  return [...registrySeeds, ...SHOWCASE_ONLY_TOOLS];
}

export async function deactivateFictionalCatalog(prisma: PrismaClient) {
  const hidden = await prisma.tool.updateMany({
    where: { slug: { not: PRODUCTION_TOOL_SLUG } },
    data: {
      active: false,
      visible: false,
      showInStore: false,
      featured: false,
    },
  });

  const hiddenModules = await prisma.module.updateMany({
    where: { slug: { notIn: [...PRODUCTION_MODULE_SLUGS] } },
    data: { active: false },
  });

  const hiddenManufacturers = await prisma.manufacturer.updateMany({
    where: { slug: { notIn: [...PRODUCTION_MANUFACTURER_SLUGS] } },
    data: { active: false },
  });

  await prisma.tool.updateMany({
    where: { slug: PRODUCTION_TOOL_SLUG },
    data: {
      active: true,
      visible: true,
      showInStore: true,
      isImplemented: true,
    },
  });

  await prisma.module.updateMany({
    where: { slug: { in: [...PRODUCTION_MODULE_SLUGS] } },
    data: { active: true },
  });

  await prisma.manufacturer.updateMany({
    where: { slug: { in: [...PRODUCTION_MANUFACTURER_SLUGS] } },
    data: { active: true },
  });

  console.log(
    `Catálogo fictício desativado: ${hidden.count} ferramenta(s), ${hiddenModules.count} módulo(s), ${hiddenManufacturers.count} montadora(s).`
  );
}

export async function seedToolsMetadata(
  prisma: PrismaClient,
  mode: SeedMode = "dev"
) {
  const tools = buildToolSeeds(mode);

  for (const tool of tools) {
    const manufacturer = await prisma.manufacturer.findUniqueOrThrow({
      where: { slug: tool.manufacturerSlug },
    });
    const moduleRecord = await prisma.module.findUniqueOrThrow({
      where: { slug: tool.moduleSlug },
    });
    const category = await prisma.toolCategory.findUniqueOrThrow({
      where: { slug: tool.categorySlug },
    });

    let decodeProcedureId: string | undefined;
    if (tool.decodeProcedureSlug) {
      const procedure = await prisma.decodeProcedure.findUnique({
        where: {
          moduleId_slug: {
            moduleId: moduleRecord.id,
            slug: tool.decodeProcedureSlug,
          },
        },
      });
      decodeProcedureId = procedure?.id;

      if (decodeProcedureId) {
        await prisma.tool.updateMany({
          where: {
            decodeProcedureId,
            moduleId: moduleRecord.id,
            slug: { not: tool.slug },
          },
          data: { decodeProcedureId: null },
        });
      }
    }

    const showcaseDefaults =
      mode === "production"
        ? {
            active: true,
            visible: true,
            showInStore: true,
            featured: true,
          }
        : {
            active: true,
          };

    await prisma.tool.upsert({
      where: {
        moduleId_slug: {
          moduleId: moduleRecord.id,
          slug: tool.slug,
        },
      },
      create: {
        categoryId: category.id,
        manufacturerId: manufacturer.id,
        moduleId: moduleRecord.id,
        decodeProcedureId,
        slug: tool.slug,
        name: tool.name,
        description: tool.description,
        type: tool.type,
        ecuName: tool.ecuName,
        eepromType: tool.eepromType,
        purchaseUrl: `${PURCHASE_BASE}/${tool.slug}`,
        toolRoute: tool.toolRoute,
        isImplemented: tool.isImplemented,
        displayOrder: tool.displayOrder,
        buttonText: tool.isImplemented ? "Abrir ferramenta" : "Comprar acesso",
        ...showcaseDefaults,
      },
      update: {
        categoryId: category.id,
        manufacturerId: manufacturer.id,
        decodeProcedureId,
        name: tool.name,
        description: tool.description,
        type: tool.type,
        ecuName: tool.ecuName,
        eepromType: tool.eepromType,
        purchaseUrl: `${PURCHASE_BASE}/${tool.slug}`,
        toolRoute: tool.toolRoute,
        isImplemented: tool.isImplemented,
        displayOrder: tool.displayOrder,
        ...(mode === "dev" ? { active: true } : {}),
      },
    });
  }

  if (mode === "production") {
    await deactivateFictionalCatalog(prisma);
  }

  console.log(
    `Ferramentas da vitrine sincronizadas (${mode}): ${tools.length}`
  );
}
