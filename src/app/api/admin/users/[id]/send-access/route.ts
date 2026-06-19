import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import { requireAdminUser } from "@/lib/adminAuth";
import { sendWelcomeAccessEmail } from "@/lib/emailService";
import { DEFAULT_USER_PASSWORD } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  moduleSlug: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminUser();
    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        userModules: {
          include: { module: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const moduleSlug =
      parsed.success && parsed.data.moduleSlug
        ? parsed.data.moduleSlug
        : user.userModules[0]?.module.slug;

    if (!moduleSlug) {
      return NextResponse.json(
        { error: "Nenhum módulo associado ao usuário." },
        { status: 400 }
      );
    }

    const moduleRecord = await prisma.module.findUnique({
      where: { slug: moduleSlug },
    });

    const access = user.userModules.find((a) => a.module.slug === moduleSlug);

    await sendWelcomeAccessEmail({
      name: user.name,
      email: user.email,
      password: DEFAULT_USER_PASSWORD,
      toolName: moduleRecord?.name ?? moduleSlug,
      expiresAt: access?.expiresAt,
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: "email.resend_access",
      targetType: "user",
      targetId: user.id,
      metadata: { moduleSlug },
    });

    return NextResponse.json({ success: true, message: "E-mail de acesso reenviado." });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}
