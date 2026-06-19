import { prisma } from "@/lib/prisma";
import { resolveModuleSlugFromProductId } from "@/lib/productAccessMapper";

export interface ResolvedProductAccess {
  tool: {
    id: string;
    slug: string;
    name: string;
    displayName: string | null;
    moduleId: string;
    purchaseUrl: string | null;
  };
  moduleSlug: string;
  externalProductId: string;
}

export async function resolveAccessFromProductId(
  externalProductId: string
): Promise<ResolvedProductAccess | null> {
  if (!externalProductId) return null;

  const mapping = await prisma.productMapping.findFirst({
    where: {
      externalProductId,
      active: true,
    },
  });

  if (mapping) {
    const tool = await prisma.tool.findFirst({
      where: { slug: mapping.toolSlug, active: true },
      include: { module: true },
    });

    if (tool?.module.active) {
      return {
        tool: {
          id: tool.id,
          slug: tool.slug,
          name: tool.name,
          displayName: tool.displayName,
          moduleId: tool.moduleId,
          purchaseUrl: tool.purchaseUrl,
        },
        moduleSlug: tool.module.slug,
        externalProductId,
      };
    }
  }

  const legacyModuleSlug = resolveModuleSlugFromProductId(externalProductId);
  if (!legacyModuleSlug) return null;

  const tool = await prisma.tool.findFirst({
    where: {
      active: true,
      module: { slug: legacyModuleSlug, active: true },
    },
    orderBy: [{ isImplemented: "desc" }, { displayOrder: "asc" }],
    include: { module: true },
  });

  if (!tool) return null;

  return {
    tool: {
      id: tool.id,
      slug: tool.slug,
      name: tool.name,
      displayName: tool.displayName,
      moduleId: tool.moduleId,
      purchaseUrl: tool.purchaseUrl,
    },
    moduleSlug: tool.module.slug,
    externalProductId,
  };
}

export async function listProductMappings() {
  return prisma.productMapping.findMany({
    orderBy: [{ active: "desc" }, { externalProductId: "asc" }],
  });
}

export async function upsertProductMapping(data: {
  id?: string;
  externalProductId: string;
  toolSlug: string;
  active: boolean;
}) {
  if (data.id) {
    return prisma.productMapping.update({
      where: { id: data.id },
      data: {
        externalProductId: data.externalProductId,
        toolSlug: data.toolSlug,
        active: data.active,
      },
    });
  }

  return prisma.productMapping.upsert({
    where: { externalProductId: data.externalProductId },
    create: {
      externalProductId: data.externalProductId,
      toolSlug: data.toolSlug,
      active: data.active,
    },
    update: {
      toolSlug: data.toolSlug,
      active: data.active,
    },
  });
}
