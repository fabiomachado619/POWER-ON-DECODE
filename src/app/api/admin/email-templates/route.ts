import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import { requireSuperAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  id: z.string(),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  bodyText: z.string().min(1),
  active: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireSuperAdminUser();
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireSuperAdminUser();
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const { id, ...data } = parsed.data;
    await prisma.emailTemplate.update({ where: { id }, data });

    await logAdminAction({
      adminUserId: admin.id,
      action: "email_template.update",
      targetType: "email_template",
      targetId: id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 });
  }
}
