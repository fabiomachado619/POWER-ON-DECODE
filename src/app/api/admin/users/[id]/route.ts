import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import {
  AdminAccessDeniedError,
  assertUserCanBeManagedByAdmin,
  requireAdminUser,
  SuperAdminProtectedError,
} from "@/lib/adminAuth";
import { getAdminUserDetails } from "@/lib/adminUserDetails";
import { normalizeEmail, isSuperAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["customer", "admin", "super_admin"]).optional(),
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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminUser();
    await assertUserCanBeManagedByAdmin(params.id, admin);

    const details = await getAdminUserDetails(params.id);
    if (!details) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      ...details,
      permissions: {
        canEditRole: isSuperAdminRole(admin.role),
        canEditEmail: true,
      },
    });
  } catch (error) {
    return handleAdminError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminUser();
    await assertUserCanBeManagedByAdmin(params.id, admin);

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const data = parsed.data;

    if (data.role && !isSuperAdminRole(admin.role)) {
      return NextResponse.json(
        { error: "Apenas o super administrador pode alterar perfis." },
        { status: 403 }
      );
    }

    if (data.role === "super_admin" && !isSuperAdminRole(admin.role)) {
      return NextResponse.json(
        { error: "Apenas o super administrador pode definir super admin." },
        { status: 403 }
      );
    }

    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: normalizeEmail(data.email),
          NOT: { id: params.id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Este e-mail já está em uso." },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.email ? { email: normalizeEmail(data.email) } : {}),
        ...(data.role ? { role: data.role } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: "user.update",
      targetType: "user",
      targetId: params.id,
      metadata: data,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    return handleAdminError(error);
  }
}
