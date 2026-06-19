import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canAccessAdminArea,
  isProtectedSuperAdminUser,
  isSuperAdminRole,
} from "@/lib/roles";
import type { SessionUser } from "@/types";

export class AdminAccessDeniedError extends Error {
  constructor(message = "Acesso administrativo negado.") {
    super(message);
    this.name = "AdminAccessDeniedError";
  }
}

export class SuperAdminProtectedError extends Error {
  constructor(
    message = "Este usuário super admin é protegido e não pode ser alterado."
  ) {
    super(message);
    this.name = "SuperAdminProtectedError";
  }
}

export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || !canAccessAdminArea(user.role)) return null;
  return user;
}

export async function requireAdminUser(): Promise<SessionUser> {
  const user = await getAdminUser();
  if (!user) {
    throw new AdminAccessDeniedError();
  }
  return user;
}

export async function requireSuperAdminUser(): Promise<SessionUser> {
  const user = await requireAdminUser();
  if (!isSuperAdminRole(user.role)) {
    throw new AdminAccessDeniedError(
      "Apenas o super administrador pode executar esta ação."
    );
  }
  return user;
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user ? canAccessAdminArea(user.role) : false;
}

export async function assertUserCanBeManagedByAdmin(
  targetUserId: string,
  actor: SessionUser
): Promise<void> {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, role: true },
  });

  if (!target) {
    throw new AdminAccessDeniedError("Usuário não encontrado.");
  }

  if (isProtectedSuperAdminUser(target)) {
    throw new SuperAdminProtectedError();
  }

  if (isSuperAdminRole(target.role) && !isSuperAdminRole(actor.role)) {
    throw new AdminAccessDeniedError(
      "Administradores comuns não podem alterar super administradores."
    );
  }

  if (target.role === "admin" && !isSuperAdminRole(actor.role)) {
    throw new AdminAccessDeniedError(
      "Administradores comuns não podem alterar outros administradores."
    );
  }
}

export async function assertAccessCanBeManaged(
  userModuleId: string,
  actor: SessionUser
): Promise<void> {
  const access = await prisma.userModule.findUnique({
    where: { id: userModuleId },
    include: { user: { select: { id: true, email: true, role: true } } },
  });

  if (!access) {
    throw new AdminAccessDeniedError("Acesso não encontrado.");
  }

  await assertUserCanBeManagedByAdmin(access.user.id, actor);
}
