import { hashPassword } from "@/lib/auth";
import {
  DEFAULT_ACCESS_DAYS,
  DEFAULT_USER_PASSWORD,
  isAccessExpired,
  resolveRenewalExpiresAt,
  type AccessStatus,
} from "@/lib/constants";
import { sendWelcomeAccessEmail } from "@/lib/emailService";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export class AccessDeniedError extends Error {
  constructor(message = "Acesso negado ao módulo.") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export class AccessExpiredError extends AccessDeniedError {
  constructor(moduleSlug: string) {
    super(
      `Seu acesso ao módulo "${moduleSlug}" venceu. Clique abaixo para renovar.`
    );
    this.name = "AccessExpiredError";
  }
}

function isUserModuleActive(access: {
  accessStatus: string;
  status: string;
  expiresAt: Date | null;
}): boolean {
  const status = access.accessStatus || access.status;
  if (status !== "active") return false;
  if (isAccessExpired(access.expiresAt)) return false;
  return true;
}

export async function userHasModuleAccess(
  userId: string,
  moduleSlug: string
): Promise<boolean> {
  const access = await prisma.userModule.findFirst({
    where: {
      userId,
      module: { slug: moduleSlug, active: true },
    },
  });
  return access ? isUserModuleActive(access) : false;
}

export async function requireModuleAccess(
  user: SessionUser,
  moduleSlug: string
): Promise<void> {
  const access = await prisma.userModule.findFirst({
    where: {
      userId: user.id,
      module: { slug: moduleSlug, active: true },
    },
  });

  if (!access) {
    throw new AccessDeniedError(
      `Você não possui acesso ao módulo "${moduleSlug}".`
    );
  }

  if (isAccessExpired(access.expiresAt)) {
    throw new AccessExpiredError(moduleSlug);
  }

  if (!isUserModuleActive(access)) {
    throw new AccessDeniedError(
      `Seu acesso ao módulo "${moduleSlug}" não está ativo.`
    );
  }
}

export async function getUserModules(userId: string) {
  const modules = await prisma.module.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      userModules: { where: { userId }, take: 1 },
    },
  });

  return modules.map((module) => {
    const access = module.userModules[0];
    const hasAccess = access ? isUserModuleActive(access) : false;
    return {
      id: module.id,
      slug: module.slug,
      name: module.name,
      description: module.description,
      active: module.active,
      hasAccess,
      accessStatus: access?.accessStatus ?? access?.status,
      expiresAt: access?.expiresAt?.toISOString() ?? null,
      isExpired: access ? isAccessExpired(access.expiresAt) : false,
    };
  });
}

export async function getUserAccessList(userId: string) {
  const accesses = await prisma.userModule.findMany({
    where: { userId },
    include: { module: true },
    orderBy: { createdAt: "desc" },
  });

  return accesses.map((access) => ({
    id: access.id,
    moduleId: access.moduleId,
    moduleSlug: access.module.slug,
    moduleName: access.module.name,
    accessStatus: access.accessStatus,
    startsAt: access.startsAt?.toISOString() ?? null,
    expiresAt: access.expiresAt?.toISOString() ?? null,
    source: access.source,
    notes: access.notes,
    isActive: isUserModuleActive(access),
    isExpired: isAccessExpired(access.expiresAt),
  }));
}

export async function grantModuleAccess(params: {
  userId: string;
  moduleSlug: string;
  source: string;
  sourcePayment?: string;
  externalProductId?: string;
  validityDays?: number;
  notes?: string;
  sendEmail?: boolean;
  toolName?: string;
}): Promise<{ expiresAt: Date; renewed: boolean }> {
  const moduleRecord = await prisma.module.findUnique({
    where: { slug: params.moduleSlug },
  });

  if (!moduleRecord) {
    throw new Error(`Módulo "${params.moduleSlug}" não encontrado.`);
  }

  const existing = await prisma.userModule.findUnique({
    where: {
      userId_moduleId: {
        userId: params.userId,
        moduleId: moduleRecord.id,
      },
    },
  });

  const now = new Date();
  const validityDays = params.validityDays ?? DEFAULT_ACCESS_DAYS;
  const expiresAt = resolveRenewalExpiresAt(existing?.expiresAt, validityDays);

  await prisma.userModule.upsert({
    where: {
      userId_moduleId: {
        userId: params.userId,
        moduleId: moduleRecord.id,
      },
    },
    create: {
      userId: params.userId,
      moduleId: moduleRecord.id,
      status: "active",
      accessStatus: "active",
      startsAt: now,
      expiresAt,
      source: params.source,
      sourcePayment: params.sourcePayment,
      externalProductId: params.externalProductId,
      notes: params.notes,
    },
    update: {
      status: "active",
      accessStatus: "active",
      startsAt: existing?.startsAt ?? now,
      expiresAt,
      source: params.source,
      sourcePayment: params.sourcePayment ?? existing?.sourcePayment,
      externalProductId:
        params.externalProductId ?? existing?.externalProductId,
      notes: params.notes ?? existing?.notes,
    },
  });

  if (params.sendEmail) {
    const user = await prisma.user.findUnique({ where: { id: params.userId } });
    if (user) {
      await sendWelcomeAccessEmail({
        name: user.name,
        email: user.email,
        password: DEFAULT_USER_PASSWORD,
        toolName: params.toolName ?? moduleRecord.name,
        expiresAt,
      });
    }
  }

  return { expiresAt, renewed: Boolean(existing) };
}

export async function updateUserModuleStatus(params: {
  userModuleId: string;
  accessStatus: AccessStatus;
  notes?: string;
}): Promise<void> {
  await prisma.userModule.update({
    where: { id: params.userModuleId },
    data: {
      accessStatus: params.accessStatus,
      status: params.accessStatus === "active" ? "active" : params.accessStatus,
      notes: params.notes,
    },
  });
}

export async function renewUserModuleAccess(
  userModuleId: string,
  validityDays = DEFAULT_ACCESS_DAYS
): Promise<Date> {
  const access = await prisma.userModule.findUnique({
    where: { id: userModuleId },
  });

  if (!access) {
    throw new Error("Acesso não encontrado.");
  }

  const expiresAt = resolveRenewalExpiresAt(access.expiresAt, validityDays);

  await prisma.userModule.update({
    where: { id: userModuleId },
    data: {
      accessStatus: "active",
      status: "active",
      expiresAt,
    },
  });

  return expiresAt;
}

export async function reactivateUserModuleAccess(
  userModuleId: string,
  validityDays = DEFAULT_ACCESS_DAYS
): Promise<Date> {
  const now = new Date();
  const expiresAt = resolveRenewalExpiresAt(null, validityDays);

  await prisma.userModule.update({
    where: { id: userModuleId },
    data: {
      accessStatus: "active",
      status: "active",
      startsAt: now,
      expiresAt,
    },
  });

  return expiresAt;
}

export async function grantToolsAccessToUser(params: {
  userId: string;
  toolSlugs: string[];
  validityDays?: number;
  source?: string;
  notes?: string;
}): Promise<{
  grantedModules: string[];
  toolNames: string[];
  latestExpiresAt: Date | null;
}> {
  const tools = await prisma.tool.findMany({
    where: { slug: { in: params.toolSlugs }, active: true },
    include: { module: true },
  });

  if (tools.length === 0) {
    throw new Error("Nenhuma ferramenta válida selecionada.");
  }

  const moduleMap = new Map<
    string,
    { moduleSlug: string; toolNames: string[] }
  >();

  for (const tool of tools) {
    const existing = moduleMap.get(tool.moduleId);
    const label = tool.displayName ?? tool.name;
    if (existing) {
      existing.toolNames.push(label);
    } else {
      moduleMap.set(tool.moduleId, {
        moduleSlug: tool.module.slug,
        toolNames: [label],
      });
    }
  }

  let latestExpiresAt: Date | null = null;
  const grantedModules: string[] = [];
  const toolNames: string[] = [];

  for (const entry of Array.from(moduleMap.values())) {
    const result = await grantModuleAccess({
      userId: params.userId,
      moduleSlug: entry.moduleSlug,
      source: params.source ?? "admin",
      validityDays: params.validityDays,
      notes: params.notes,
      sendEmail: false,
    });
    grantedModules.push(entry.moduleSlug);
    toolNames.push(...entry.toolNames);
    if (!latestExpiresAt || result.expiresAt > latestExpiresAt) {
      latestExpiresAt = result.expiresAt;
    }
  }

  return {
    grantedModules,
    toolNames: Array.from(new Set(toolNames)),
    latestExpiresAt,
  };
}

export async function findOrCreateUserByEmail(params: {
  email: string;
  name?: string;
  password?: string;
  role?: string;
}): Promise<{ id: string; email: string; name: string; isNew: boolean }> {
  const existing = await prisma.user.findUnique({
    where: { email: params.email.toLowerCase() },
  });

  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      isNew: false,
    };
  }

  const created = await prisma.user.create({
    data: {
      email: params.email.toLowerCase(),
      name: params.name ?? params.email.split("@")[0],
      passwordHash: await hashPassword(params.password ?? DEFAULT_USER_PASSWORD),
      role: params.role ?? "customer",
    },
  });

  return {
    id: created.id,
    email: created.email,
    name: created.name,
    isNew: true,
  };
}

export async function resetUserPasswordToDefault(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(DEFAULT_USER_PASSWORD) },
  });
}

export { isAccessExpired, isUserModuleActive };
