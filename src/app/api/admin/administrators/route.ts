import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { logAdminAction } from "@/lib/auditLog";
import {
  AdminAccessDeniedError,
  assertUserCanBeManagedByAdmin,
  requireSuperAdminUser,
  SuperAdminProtectedError,
} from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { isProtectedSuperAdminUser } from "@/lib/roles";

const createAdminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
});

const updateAdminSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "customer"]),
});

export async function GET() {
  try {
    await requireSuperAdminUser();

    const administrators = await prisma.user.findMany({
      where: { role: { in: ["admin", "super_admin"] } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ administrators });
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSuperAdminUser();
    const parsed = createAdminSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (isProtectedSuperAdminUser(existing)) {
        return NextResponse.json(
          { error: "O super administrador principal não pode ser alterado." },
          { status: 403 }
        );
      }

      if (existing.role === "admin") {
        return NextResponse.json(
          { error: "Este e-mail já pertence a um administrador." },
          { status: 409 }
        );
      }

      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: { role: "admin", name: parsed.data.name },
      });

      await logAdminAction({
        adminUserId: actor.id,
        action: "admin.promote",
        targetType: "user",
        targetId: updated.id,
        metadata: { email },
      });

      return NextResponse.json({ success: true, userId: updated.id, promoted: true });
    }

    const password = parsed.data.password ?? "Admin@123456";
    const created = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        role: "admin",
        passwordHash: await bcrypt.hash(password, 12),
      },
    });

    await logAdminAction({
      adminUserId: actor.id,
      action: "admin.create",
      targetType: "user",
      targetId: created.id,
      metadata: { email },
    });

    return NextResponse.json({
      success: true,
      userId: created.id,
      temporaryPassword: parsed.data.password ? undefined : "Admin@123456",
    });
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireSuperAdminUser();
    const parsed = updateAdminSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    await assertUserCanBeManagedByAdmin(parsed.data.userId, actor);

    const target = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, email: true, role: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    if (target.role === "super_admin") {
      return NextResponse.json(
        { error: "O super administrador principal não pode ser rebaixado." },
        { status: 403 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { role: parsed.data.role },
    });

    await logAdminAction({
      adminUserId: actor.id,
      action: parsed.data.role === "admin" ? "admin.promote" : "admin.demote",
      targetType: "user",
      targetId: updated.id,
      metadata: { role: parsed.data.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SuperAdminProtectedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof AdminAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
