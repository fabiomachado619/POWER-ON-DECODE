import type { PrismaClient } from "@prisma/client";

const DEFAULT_PRODUCT_MAPPINGS = [
  {
    externalProductId: "SSANGYONG_01",
    toolSlug: "ssangyong-rexton-25c320-decode",
  },
  {
    externalProductId: "prod_ssangyong",
    toolSlug: "ssangyong-rexton-25c320-decode",
  },
];

export async function seedProductMappings(prisma: PrismaClient) {
  for (const mapping of DEFAULT_PRODUCT_MAPPINGS) {
    await prisma.productMapping.upsert({
      where: { externalProductId: mapping.externalProductId },
      create: {
        externalProductId: mapping.externalProductId,
        toolSlug: mapping.toolSlug,
        active: true,
      },
      update: {
        toolSlug: mapping.toolSlug,
        active: true,
      },
    });
  }

  console.log(
    `Mapeamentos de produto sincronizados: ${DEFAULT_PRODUCT_MAPPINGS.length}`
  );
}
