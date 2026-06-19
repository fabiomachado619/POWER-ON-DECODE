import { isUserModuleActive } from "@/lib/accessControl";
import { isAccessExpired } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  getRegisteredTool,
  isToolRegistered,
} from "@/tools/registry";
import type {
  CatalogCategoryGroup,
  CategoryWithStats,
  PublicStoreCatalog,
  ToolCatalogItem,
  ToolCategoryInfo,
  ToolType,
  ToolsCatalog,
} from "@/types";

const TOOL_TYPE_LABELS: Record<ToolType, string> = {
  decode: "Decode",
  reset: "Reset",
  odometro: "Odômetro",
  checksum: "Checksum",
  calculator: "Calculadora",
  file_bank: "Banco de arquivos",
  curso: "Curso",
};

const toolInclude = {
  category: true,
  manufacturer: true,
  module: true,
} as const;

type ToolRecord = Awaited<
  ReturnType<typeof prisma.tool.findMany<{ include: typeof toolInclude }>>
>[number];

function mapCategory(category: ToolRecord["category"]): ToolCategoryInfo {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    displayOrder: category.displayOrder,
  };
}

function mapToolRecord(
  tool: ToolRecord,
  moduleAccessMap: Map<
    string,
    { active: boolean; expiresAt: Date | null; hasRecord: boolean }
  >
): ToolCatalogItem {
  const access = moduleAccessMap.get(tool.module.slug);
  const hasModuleAccess = access?.active ?? false;
  const isExpired = Boolean(
    access?.hasRecord &&
      !hasModuleAccess &&
      access.expiresAt &&
      isAccessExpired(access.expiresAt)
  );
  const registered = getRegisteredTool(tool.slug);
  const registryImplemented = registered?.config.isImplemented ?? false;
  const registryMissing = !isToolRegistered(tool.slug);
  const hasAccess =
    hasModuleAccess && tool.isImplemented && tool.active && registryImplemented;
  const type = tool.type as ToolType;
  const effectiveRoute = registered?.config.routePath ?? tool.toolRoute;

  return {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    displayName: tool.displayName ?? tool.name,
    description: tool.description,
    longDescription: tool.longDescription,
    coverImageUrl: tool.coverImageUrl,
    type,
    typeLabel: TOOL_TYPE_LABELS[type] ?? tool.type,
    ecuName: tool.ecuName,
    eepromType: tool.eepromType,
    purchaseUrl: tool.purchaseUrl,
    toolRoute: effectiveRoute,
    buttonText:
      tool.buttonText ?? (hasAccess ? "Abrir ferramenta" : "Comprar acesso"),
    featured: tool.featured,
    visible: tool.visible,
    showInStore: tool.showInStore,
    displayOrder: tool.displayOrder,
    isImplemented: tool.isImplemented,
    registryImplemented,
    registryMissing,
    hasAccess,
    isExpired,
    expiresAt: access?.expiresAt?.toISOString() ?? null,
    category: mapCategory(tool.category),
    manufacturer: {
      id: tool.manufacturer.id,
      name: tool.manufacturer.name,
      slug: tool.manufacturer.slug,
      logoUrl: tool.manufacturer.logoUrl,
    },
    module: {
      id: tool.module.id,
      slug: tool.module.slug,
      name: tool.module.name,
    },
  };
}

async function buildModuleAccessMap(userId: string) {
  const userModules = await prisma.userModule.findMany({
    where: { userId },
    include: { module: true },
  });

  const map = new Map<
    string,
    { active: boolean; expiresAt: Date | null; hasRecord: boolean }
  >();
  for (const entry of userModules) {
    map.set(entry.module.slug, {
      active: isUserModuleActive(entry),
      expiresAt: entry.expiresAt,
      hasRecord: true,
    });
  }
  return map;
}

async function fetchActiveTools(options?: { includeHidden?: boolean }) {
  return prisma.tool.findMany({
    where: {
      active: true,
      ...(options?.includeHidden ? {} : { visible: true }),
      category: { active: true },
      manufacturer: { active: true },
      module: { active: true },
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: toolInclude,
  });
}

const emptyAccessMap = new Map<
  string,
  { active: boolean; expiresAt: Date | null; hasRecord: boolean }
>();

function mapToolsForPublicStore(tools: ToolRecord[]): ToolCatalogItem[] {
  return tools.map((tool) => mapToolRecord(tool, emptyAccessMap));
}

export async function getPublicStoreCatalog(): Promise<PublicStoreCatalog> {
  const [tools, categories] = await Promise.all([
    prisma.tool.findMany({
      where: {
        active: true,
        visible: true,
        showInStore: true,
        category: { active: true },
        manufacturer: { active: true },
        module: { active: true },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: toolInclude,
    }),
    getActiveCategories(),
  ]);

  const items = mapToolsForPublicStore(tools);
  const featured = items.filter((tool) => tool.featured);
  const byCategory: Record<string, ToolCatalogItem[]> = {};

  for (const category of categories) {
    byCategory[category.slug] = items.filter(
      (tool) => tool.category.slug === category.slug
    );
  }

  return { featured, byCategory, categories, totalCount: items.length };
}

export async function isToolVisibleForCustomers(slug: string): Promise<boolean> {
  const tool = await prisma.tool.findFirst({
    where: { slug, active: true },
    select: { visible: true },
  });
  return Boolean(tool?.visible);
}

export async function getActiveCategories(): Promise<ToolCategoryInfo[]> {
  const categories = await prisma.toolCategory.findMany({
    where: { active: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    displayOrder: c.displayOrder,
  }));
}

export async function getUserToolsCatalog(userId: string): Promise<ToolsCatalog> {
  const [tools, moduleAccessMap, categories] = await Promise.all([
    fetchActiveTools(),
    buildModuleAccessMap(userId),
    getActiveCategories(),
  ]);

  const allTools = tools.map((tool) => mapToolRecord(tool, moduleAccessMap));
  const visibleTools = allTools.filter((tool) => tool.visible);
  const shopItems = visibleTools.filter(
    (tool) => tool.showInStore && !tool.hasAccess
  );

  const unlockedByCategory: Record<string, ToolCatalogItem[]> = {};
  for (const category of categories) {
    unlockedByCategory[category.slug] = visibleTools.filter(
      (tool) => tool.category.slug === category.slug && tool.hasAccess
    );
  }

  const categoryStats: CategoryWithStats[] = categories.map((category) => {
    const categoryTools = visibleTools.filter(
      (tool) => tool.category.slug === category.slug
    );
    return {
      ...category,
      unlockedCount: categoryTools.filter((t) => t.hasAccess).length,
      shopCount: categoryTools.filter(
        (t) => t.showInStore && !t.hasAccess
      ).length,
      totalCount: categoryTools.length,
    };
  });

  return {
    categories: categoryStats,
    unlockedByCategory,
    shopItems,
    allTools: visibleTools,
    unlockedCount: visibleTools.filter((tool) => tool.hasAccess).length,
  };
}

export async function getToolsByCategory(
  userId: string,
  categorySlug: string,
  manufacturerSlug?: string
) {
  const catalog = await getUserToolsCatalog(userId);
  const category = catalog.categories.find((c) => c.slug === categorySlug);
  if (!category) return null;

  let tools = catalog.allTools.filter(
    (tool) => tool.category.slug === categorySlug
  );

  if (manufacturerSlug) {
    tools = tools.filter((tool) => tool.manufacturer.slug === manufacturerSlug);
  }

  const unlocked = tools.filter((t) => t.hasAccess);
  const locked = tools.filter((t) => !t.hasAccess);

  const manufacturers = Array.from(
    new Map(
      tools.map((tool) => [tool.manufacturer.slug, tool.manufacturer])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  return {
    category,
    manufacturers,
    unlocked,
    locked,
    all: [...unlocked, ...locked],
  };
}

export async function getShopTools(
  userId: string,
  filters?: { categorySlug?: string; manufacturerSlug?: string }
) {
  const catalog = await getUserToolsCatalog(userId);
  let items = catalog.shopItems;

  if (filters?.categorySlug) {
    items = items.filter((t) => t.category.slug === filters.categorySlug);
  }
  if (filters?.manufacturerSlug) {
    items = items.filter(
      (t) => t.manufacturer.slug === filters.manufacturerSlug
    );
  }

  return items;
}

export async function getFullCatalogGrouped(
  userId: string
): Promise<CatalogCategoryGroup[]> {
  const catalog = await getUserToolsCatalog(userId);
  const groups: CatalogCategoryGroup[] = [];

  for (const category of catalog.categories) {
    const categoryTools = catalog.allTools.filter(
      (t) => t.category.slug === category.slug
    );

    const byManufacturer = new Map<
      string,
      { manufacturer: ToolCatalogItem["manufacturer"]; tools: ToolCatalogItem[] }
    >();

    for (const tool of categoryTools) {
      const existing = byManufacturer.get(tool.manufacturer.slug);
      if (existing) {
        existing.tools.push(tool);
      } else {
        byManufacturer.set(tool.manufacturer.slug, {
          manufacturer: tool.manufacturer,
          tools: [tool],
        });
      }
    }

    groups.push({
      category,
      manufacturers: Array.from(byManufacturer.values()).sort((a, b) =>
        a.manufacturer.name.localeCompare(b.manufacturer.name)
      ),
    });
  }

  return groups;
}

export async function getToolsByManufacturer(userId: string) {
  const catalog = await getUserToolsCatalog(userId);

  const grouped = new Map<
    string,
    {
      manufacturer: ToolCatalogItem["manufacturer"];
      tools: ToolCatalogItem[];
    }
  >();

  for (const tool of catalog.allTools) {
    const existing = grouped.get(tool.manufacturer.slug);
    if (existing) {
      existing.tools.push(tool);
    } else {
      grouped.set(tool.manufacturer.slug, {
        manufacturer: tool.manufacturer,
        tools: [tool],
      });
    }
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.manufacturer.name.localeCompare(b.manufacturer.name)
  );
}

export async function getManufacturerTools(
  userId: string,
  manufacturerSlug: string
) {
  const groups = await getToolsByManufacturer(userId);
  return groups.find((group) => group.manufacturer.slug === manufacturerSlug) ?? null;
}

export { TOOL_TYPE_LABELS };
