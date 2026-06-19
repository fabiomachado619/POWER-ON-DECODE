import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import { requireAdminUser } from "@/lib/adminAuth";
import {
  createCampaignWithRecipients,
  EMAIL_CAMPAIGN_AUDIENCES,
  processCampaignBatch,
} from "@/lib/emailMarketing";
import { prisma } from "@/lib/prisma";

const sendSchema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  textContent: z.string().min(1),
  audienceType: z.enum(EMAIL_CAMPAIGN_AUDIENCES),
  toolSlug: z.string().optional().nullable(),
  categorySlug: z.string().optional().nullable(),
  campaignId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const parsed = sendSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    if (parsed.data.campaignId) {
      const progress = await processCampaignBatch(parsed.data.campaignId);
      if ("error" in progress) {
        return NextResponse.json({ error: progress.error }, { status: 404 });
      }
      return NextResponse.json({ success: true, ...progress });
    }

    const { campaign, recipientCount } = await createCampaignWithRecipients({
      title: parsed.data.title,
      subject: parsed.data.subject,
      htmlContent: parsed.data.htmlContent,
      textContent: parsed.data.textContent,
      audienceType: parsed.data.audienceType,
      toolSlug: parsed.data.toolSlug,
      categorySlug: parsed.data.categorySlug,
      createdById: admin.id,
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: "email_campaign.created",
      targetType: "email_campaign",
      targetId: campaign.id,
      metadata: {
        title: campaign.title,
        audienceType: campaign.audienceType,
        recipientCount,
      },
    });

    if (recipientCount === 0) {
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: "sent", sentAt: new Date() },
      });
      return NextResponse.json({
        success: true,
        campaignId: campaign.id,
        recipientCount: 0,
        message: "Nenhum destinatário encontrado para o público selecionado.",
        done: true,
        status: "sent",
        sentCount: 0,
        failedCount: 0,
        totalRecipients: 0,
      });
    }

    await logAdminAction({
      adminUserId: admin.id,
      action: "email_campaign.dispatched",
      targetType: "email_campaign",
      targetId: campaign.id,
      metadata: { recipientCount },
    });

    const progress = await processCampaignBatch(campaign.id);

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      recipientCount,
      ...progress,
    });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}
