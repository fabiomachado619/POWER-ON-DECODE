import {
  getUserAccessList,
  isUserModuleActive,
} from "@/lib/accessControl";
import { isAccessExpired } from "@/lib/constants";
import { getRoleLabel, isSuperAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

function resolveAccessDisplayStatus(access: {
  accessStatus: string;
  status: string;
  expiresAt: Date | null;
}): string {
  if (access.accessStatus === "canceled") return "cancelado";
  if (access.accessStatus === "blocked") return "bloqueado";
  if (access.accessStatus === "refunded") return "reembolsado";
  if (isAccessExpired(access.expiresAt)) return "vencido";
  if (isUserModuleActive(access)) return "ativo";
  return access.accessStatus;
}

function resolveUserStatus(
  role: string,
  accesses: Array<{ isActive: boolean }>
): string {
  if (isSuperAdminRole(role)) return "Super Admin";
  if (role === "admin") return "Administrador";
  if (accesses.some((access) => access.isActive)) return "Cliente ativo";
  if (accesses.length > 0) return "Cliente sem acesso ativo";
  return "Cliente sem acessos";
}

export async function getAdminUserDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  const [accessList, tools, userModules] = await Promise.all([
    getUserAccessList(userId),
    prisma.tool.findMany({
      where: {
        active: true,
        visible: true,
        module: { active: true },
        category: { active: true },
      },
      include: {
        category: true,
        module: true,
        manufacturer: true,
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.userModule.findMany({
      where: { userId },
      include: {
        module: {
          include: {
            tools: {
              where: { active: true },
              include: { category: true },
              orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const grantedModuleIds = new Set(userModules.map((entry) => entry.moduleId));

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleLabel: getRoleLabel(user.role),
      status: resolveUserStatus(user.role, accessList),
      createdAt: user.createdAt.toISOString(),
    },
    accesses: userModules.map((entry) => {
      const moduleTools = entry.module.tools;
      const primaryTool = moduleTools[0];
      return {
        id: entry.id,
        userModuleId: entry.id,
        moduleSlug: entry.module.slug,
        moduleName: entry.module.name,
        toolNames: moduleTools.map(
          (tool) => tool.displayName ?? tool.name
        ),
        toolSlugs: moduleTools.map((tool) => tool.slug),
        categoryNames: Array.from(
          new Set(moduleTools.map((tool) => tool.category.name))
        ),
        categorySlugs: Array.from(
          new Set(moduleTools.map((tool) => tool.category.slug))
        ),
        primaryToolName:
          primaryTool?.displayName ?? primaryTool?.name ?? entry.module.name,
        primaryCategoryName: primaryTool?.category.name ?? "—",
        accessStatus: entry.accessStatus,
        displayStatus: resolveAccessDisplayStatus(entry),
        startsAt: entry.startsAt?.toISOString() ?? null,
        expiresAt: entry.expiresAt?.toISOString() ?? null,
        isActive: isUserModuleActive(entry),
        isExpired: isAccessExpired(entry.expiresAt),
        source: entry.source,
      };
    }),
    availableTools: tools.map((tool) => ({
      slug: tool.slug,
      name: tool.displayName ?? tool.name,
      categoryName: tool.category.name,
      categorySlug: tool.category.slug,
      manufacturerName: tool.manufacturer.name,
      moduleSlug: tool.module.slug,
      moduleName: tool.module.name,
      alreadyGranted: grantedModuleIds.has(tool.moduleId),
    })),
    accessList,
  };
}
