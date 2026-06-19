import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import {
  AdminAccessDeniedError,
  assertAccessCanBeManaged,
  requireAdminUser,
  SuperAdminProtectedError,
} from "@/lib/adminAuth";
import {
  renewUserModuleAccess,
  reactivateUserModuleAccess,
  updateUserModuleStatus,
} from "@/lib/accessControl";
import { DEFAULT_ACCESS_DAYS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  userModuleId: z.string().min(1),
  action: z.enum(["block", "reactivate", "cancel", "renew", "remove"]),
  validityDays: z.coerce.number().min(1).optional(),
});

function handleAdminError(error: unknown) {
  if (error instanceof SuperAdminProtectedError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof AdminAccessDeniedError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  const message = error instanceof Error ? error.message : "Erro interno.";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminUser();
    const parsed = updateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const { userModuleId, action } = parsed.data;
    const validityDays = parsed.data.validityDays ?? DEFAULT_ACCESS_DAYS;

    await assertAccessCanBeManaged(userModuleId, admin);

    const access = await prisma.userModule.findUnique({
      where: { id: userModuleId },
      select: { userId: true },
    });

    if (!access || access.userId !== params.id) {
      return NextResponse.json({ error: "Acesso não pertence a este usuário." }, {
        status: 400,
      });
    }

    let expiresAt: Date | null = null;

    switch (action) {
      case "block":
        await updateUserModuleStatus({
          userModuleId,
          accessStatus: "blocked",
          notes: `Bloqueado por ${admin.email}`,
        });
        break;
      case "cancel":
      case "remove":
        await updateUserModuleStatus({
          userModuleId,
          accessStatus: "canceled",
          notes: `Cancelado por ${admin.email}`,
        });
        break;
      case "reactivate":
        expiresAt = await reactivateUserModuleAccess(userModuleId, validityDays);
        break;
      case "renew":
        expiresAt = await renewUserModuleAccess(userModuleId, validityDays);
        break;
      default:
        return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }

    await logAdminAction({
      adminUserId: admin.id,
      action: "user.update_access",
      targetType: "user_module",
      targetId: userModuleId,
      metadata: { action, validityDays, expiresAt: expiresAt?.toISOString() },
    });

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt?.toISOString() ?? null,
    });
  } catch (error) {
    return handleAdminError(error);
  }
}
