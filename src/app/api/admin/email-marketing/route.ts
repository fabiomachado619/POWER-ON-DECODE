import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/adminAuth";
import {
  EMAIL_CAMPAIGN_AUDIENCES,
  resolveCampaignAudience,
} from "@/lib/emailMarketing";
import { prisma } from "@/lib/prisma";

const previewSchema = z.object({
  audienceType: z.enum(EMAIL_CAMPAIGN_AUDIENCES),
  toolSlug: z.string().optional().nullable(),
  categorySlug: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const parsed = previewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const recipients = await resolveCampaignAudience({
      audienceType: parsed.data.audienceType,
      toolSlug: parsed.data.toolSlug,
      categorySlug: parsed.data.categorySlug,
    });

    return NextResponse.json({ count: recipients.length });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}

export async function GET() {
  try {
    await requireAdminUser();
    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });
    return NextResponse.json({ campaigns });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}
