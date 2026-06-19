import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import { requireAdminUser } from "@/lib/adminAuth";
import {
  EMAIL_CAMPAIGN_AUDIENCES,
  sendCampaignTestEmail,
} from "@/lib/emailMarketing";

const testSchema = z.object({
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  textContent: z.string().min(1),
  toolSlug: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const parsed = testSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const result = await sendCampaignTestEmail({
      adminEmail: admin.email,
      adminName: admin.name,
      subject: parsed.data.subject,
      htmlContent: parsed.data.htmlContent,
      textContent: parsed.data.textContent,
      toolSlug: parsed.data.toolSlug,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await logAdminAction({
      adminUserId: admin.id,
      action: "email_campaign.test_sent",
      targetType: "email_campaign",
      metadata: {
        subject: parsed.data.subject,
        adminEmail: admin.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `E-mail de teste enviado para ${admin.email}.`,
    });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}
