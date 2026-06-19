import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import { requireSuperAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  smtpHost: z.string().min(1),
  smtpPort: z.coerce.number(),
  smtpUser: z.string(),
  smtpPassword: z.string().optional(),
  smtpFromName: z.string().min(1),
  smtpFromEmail: z.string().email(),
  smtpSecure: z.boolean(),
});

export async function GET() {
  try {
    await requireSuperAdminUser();
    const settings = await prisma.emailSettings.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json({
      settings: settings
        ? { ...settings, smtpPassword: settings.smtpPassword ? "********" : "" }
        : null,
      envFallback: {
        smtpHost: process.env.SMTP_HOST ?? "",
        smtpPort: process.env.SMTP_PORT ?? "587",
        smtpUser: process.env.SMTP_USER ?? "",
        smtpFromName: process.env.SMTP_FROM_NAME ?? "Power On Decode",
        smtpFromEmail: process.env.SMTP_FROM_EMAIL ?? "",
        smtpSecure: process.env.SMTP_SECURE === "true",
      },
    });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireSuperAdminUser();
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const existing = await prisma.emailSettings.findUnique({
      where: { id: "default" },
    });

    const password =
      parsed.data.smtpPassword && parsed.data.smtpPassword !== "********"
        ? parsed.data.smtpPassword
        : existing?.smtpPassword ?? process.env.SMTP_PASSWORD ?? "";

    await prisma.emailSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        smtpHost: parsed.data.smtpHost,
        smtpPort: parsed.data.smtpPort,
        smtpUser: parsed.data.smtpUser,
        smtpPassword: password,
        smtpFromName: parsed.data.smtpFromName,
        smtpFromEmail: parsed.data.smtpFromEmail,
        smtpSecure: parsed.data.smtpSecure,
      },
      update: {
        smtpHost: parsed.data.smtpHost,
        smtpPort: parsed.data.smtpPort,
        smtpUser: parsed.data.smtpUser,
        smtpPassword: password,
        smtpFromName: parsed.data.smtpFromName,
        smtpFromEmail: parsed.data.smtpFromEmail,
        smtpSecure: parsed.data.smtpSecure,
      },
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: "email_settings.update",
      targetType: "email_settings",
      targetId: "default",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 });
  }
}
