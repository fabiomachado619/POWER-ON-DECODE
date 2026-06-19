import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import { requireAdminUser } from "@/lib/adminAuth";
import {
  findOrCreateUserByEmail,
  grantModuleAccess,
} from "@/lib/accessControl";
import { prisma } from "@/lib/prisma";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  moduleSlug: z.string().min(1),
  validityDays: z.coerce.number().min(1).default(365),
  sendEmail: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    const users = await prisma.user.findMany({
      where: {
        role: "customer",
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { userModules: { include: { module: true } } },
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const moduleRecord = await prisma.module.findUnique({
      where: { slug: parsed.data.moduleSlug },
    });
    if (!moduleRecord) {
      return NextResponse.json({ error: "Módulo não encontrado." }, { status: 404 });
    }

    const user = await findOrCreateUserByEmail({
      email: parsed.data.email,
      name: parsed.data.name,
    });

    const access = await grantModuleAccess({
      userId: user.id,
      moduleSlug: parsed.data.moduleSlug,
      source: "manual",
      validityDays: parsed.data.validityDays,
      sendEmail: parsed.data.sendEmail,
      toolName: moduleRecord.name,
      notes: `Criado manualmente por ${admin.email}`,
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: "user.create_or_grant",
      targetType: "user",
      targetId: user.id,
      metadata: {
        moduleSlug: parsed.data.moduleSlug,
        validityDays: parsed.data.validityDays,
        isNew: user.isNew,
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      expiresAt: access.expiresAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
