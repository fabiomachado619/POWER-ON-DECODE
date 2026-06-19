import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import {
  assertAccessCanBeManaged,
  requireAdminUser,
  SuperAdminProtectedError,
} from "@/lib/adminAuth";
import {
  grantModuleAccess,
  updateUserModuleStatus,
} from "@/lib/accessControl";
import { ACCESS_STATUSES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const grantSchema = z.object({
  userId: z.string(),
  moduleSlug: z.string(),
  validityDays: z.coerce.number().min(1).default(365),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  accessStatus: z.enum(ACCESS_STATUSES),
  notes: z.string().optional(),
  validityDays: z.coerce.number().optional(),
});

export async function GET() {
  try {
    await requireAdminUser();
    const accesses = await prisma.userModule.findMany({
      include: { user: true, module: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ accesses });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const parsed = grantSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const result = await grantModuleAccess({
      userId: parsed.data.userId,
      moduleSlug: parsed.data.moduleSlug,
      source: "admin",
      validityDays: parsed.data.validityDays,
      notes: parsed.data.notes,
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: "access.grant",
      targetType: "user_module",
      targetId: parsed.data.userId,
      metadata: parsed.data,
    });

    return NextResponse.json({ success: true, expiresAt: result.expiresAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    const accessId = body.accessId as string;

    if (!parsed.success || !accessId) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    await assertAccessCanBeManaged(accessId, admin);

    await updateUserModuleStatus({
      userModuleId: accessId,
      accessStatus: parsed.data.accessStatus,
      notes: parsed.data.notes,
    });

    if (parsed.data.validityDays && parsed.data.accessStatus === "active") {
      const access = await prisma.userModule.findUnique({ where: { id: accessId } });
      if (access) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parsed.data.validityDays);
        await prisma.userModule.update({
          where: { id: accessId },
          data: { expiresAt },
        });
      }
    }

    await logAdminAction({
      adminUserId: admin.id,
      action: "access.update_status",
      targetType: "user_module",
      targetId: accessId,
      metadata: parsed.data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SuperAdminProtectedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
