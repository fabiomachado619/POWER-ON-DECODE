import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logAdminAction(params: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.adminAuditLog.create({
    data: {
      adminUserId: params.adminUserId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}
