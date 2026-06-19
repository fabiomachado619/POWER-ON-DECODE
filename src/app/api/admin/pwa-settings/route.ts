import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import { requireAdminUser } from "@/lib/adminAuth";
import { getPwaSettings } from "@/lib/pwaSettings";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  appName: z.string().min(1),
  shortName: z.string().min(1),
  description: z.string().min(1),
  themeColor: z.string().min(4),
  backgroundColor: z.string().min(4),
  promptText: z.string().min(1),
  active: z.boolean(),
});

export async function GET() {
  try {
    await requireAdminUser();
    const settings = await getPwaSettings();
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdminUser();
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const settings = await prisma.pwaSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...parsed.data },
      update: parsed.data,
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: "pwa_settings.updated",
      targetType: "pwa_settings",
      targetId: settings.id,
      metadata: { active: settings.active },
    });

    return NextResponse.json({ success: true, settings });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}
