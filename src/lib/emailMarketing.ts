import { isAccessExpired } from "@/lib/constants";
import { sendEmail } from "@/lib/emailService";
import {
  EMAIL_CAMPAIGN_AUDIENCES,
  EMAIL_CAMPAIGN_STATUSES,
  type EmailCampaignAudience,
} from "@/lib/emailMarketingConstants";
import { prisma } from "@/lib/prisma";
import { renderTemplate } from "@/lib/templateEngine";

export {
  CAMPAIGN_VARIABLES,
  DEFAULT_CAMPAIGN_HTML,
  DEFAULT_CAMPAIGN_SUBJECT,
  DEFAULT_CAMPAIGN_TEXT,
  EMAIL_CAMPAIGN_AUDIENCES,
  EMAIL_CAMPAIGN_STATUSES,
  type EmailCampaignAudience,
} from "@/lib/emailMarketingConstants";

const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 400;

function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

function isValidEmail(email: string): boolean {
  return Boolean(email && email.includes("@"));
}

function isUserModuleActive(access: {
  accessStatus: string;
  status: string;
  expiresAt: Date | null;
}): boolean {
  const status = access.accessStatus || access.status;
  if (status !== "active") return false;
  if (isAccessExpired(access.expiresAt)) return false;
  return true;
}

export interface CampaignRecipientCandidate {
  userId: string;
  email: string;
  name: string;
}

export async function resolveCampaignAudience(params: {
  audienceType: EmailCampaignAudience;
  toolSlug?: string | null;
  categorySlug?: string | null;
}): Promise<CampaignRecipientCandidate[]> {
  const customers = await prisma.user.findMany({
    where: { role: "customer" },
    select: {
      id: true,
      name: true,
      email: true,
      userModules: {
        include: { module: { include: { tools: { include: { category: true } } } } },
      },
    },
  });

  const withEmail = customers.filter((user) => isValidEmail(user.email));
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  let toolContext: {
    slug: string;
    name: string;
    purchaseUrl: string | null;
    categoryName: string;
    moduleId: string;
  } | null = null;

  if (params.toolSlug) {
    const tool = await prisma.tool.findFirst({
      where: { slug: params.toolSlug, active: true },
      include: { category: true },
    });
    if (tool) {
      toolContext = {
        slug: tool.slug,
        name: tool.displayName ?? tool.name,
        purchaseUrl: tool.purchaseUrl,
        categoryName: tool.category.name,
        moduleId: tool.moduleId,
      };
    }
  }

  const categoryModuleIds = new Set<string>();
  if (params.audienceType === "category" && params.categorySlug) {
    const tools = await prisma.tool.findMany({
      where: { active: true, category: { slug: params.categorySlug } },
      select: { moduleId: true },
    });
    tools.forEach((tool) => categoryModuleIds.add(tool.moduleId));
  }

  const filtered = withEmail.filter((user) => {
    const activeModules = user.userModules.filter(isUserModuleActive);
    const expiredModules = user.userModules.filter(
      (access) =>
        access.accessStatus === "expired" ||
        access.status === "expired" ||
        isAccessExpired(access.expiresAt)
    );
    const expiringSoonModules = user.userModules.filter(
      (access) =>
        isUserModuleActive(access) &&
        access.expiresAt &&
        access.expiresAt > now &&
        access.expiresAt <= in30Days
    );

    switch (params.audienceType) {
      case "all":
        return true;
      case "active":
        return activeModules.length > 0;
      case "expired":
        return expiredModules.length > 0;
      case "expiring_soon":
        return expiringSoonModules.length > 0;
      case "has_tool":
        if (!toolContext) return false;
        return activeModules.some(
          (access) => access.moduleId === toolContext!.moduleId
        );
      case "missing_tool":
        if (!toolContext) return false;
        return !activeModules.some(
          (access) => access.moduleId === toolContext!.moduleId
        );
      case "category":
        if (categoryModuleIds.size === 0) return false;
        return activeModules.some((access) =>
          categoryModuleIds.has(access.moduleId)
        );
      default:
        return false;
    }
  });

  const uniqueByEmail = new Map<string, CampaignRecipientCandidate>();
  for (const user of filtered) {
    const normalized = user.email.trim().toLowerCase();
    if (!uniqueByEmail.has(normalized)) {
      uniqueByEmail.set(normalized, {
        userId: user.id,
        email: user.email.trim(),
        name: user.name,
      });
    }
  }

  return Array.from(uniqueByEmail.values());
}

async function getToolContext(toolSlug?: string | null) {
  if (!toolSlug) return null;
  const tool = await prisma.tool.findFirst({
    where: { slug: toolSlug, active: true },
    include: { category: true },
  });
  if (!tool) return null;
  return {
    tool_name: tool.displayName ?? tool.name,
    category: tool.category.name,
    purchase_url: tool.purchaseUrl ?? `${getAppUrl()}/shop`,
    renewal_url: `${getAppUrl()}/account/access`,
  };
}

function buildVariables(
  recipient: CampaignRecipientCandidate,
  toolVars: Record<string, string> | null
) {
  return {
    name: recipient.name,
    email: recipient.email,
    login_url: `${getAppUrl()}/login`,
    tool_name: toolVars?.tool_name ?? "Power On Decode",
    category: toolVars?.category ?? "",
    purchase_url: toolVars?.purchase_url ?? `${getAppUrl()}/shop`,
    renewal_url: toolVars?.renewal_url ?? `${getAppUrl()}/account/access`,
  };
}

export async function sendCampaignTestEmail(params: {
  adminEmail: string;
  adminName: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  toolSlug?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const toolVars = await getToolContext(params.toolSlug);
  const variables = buildVariables(
    {
      userId: "test",
      email: params.adminEmail,
      name: params.adminName,
    },
    toolVars
  );

  const sent = await sendEmail({
    to: params.adminEmail,
    subject: renderTemplate(params.subject, variables),
    html: renderTemplate(params.htmlContent, variables),
    text: renderTemplate(params.textContent, variables),
  });

  if (!sent) {
    return { success: false, error: "Falha ao enviar e-mail de teste. Verifique o SMTP." };
  }

  return { success: true };
}

export async function createCampaignWithRecipients(params: {
  title: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  audienceType: EmailCampaignAudience;
  toolSlug?: string | null;
  categorySlug?: string | null;
  createdById: string;
}) {
  const recipients = await resolveCampaignAudience({
    audienceType: params.audienceType,
    toolSlug: params.toolSlug,
    categorySlug: params.categorySlug,
  });

  const campaign = await prisma.emailCampaign.create({
    data: {
      title: params.title,
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent,
      audienceType: params.audienceType,
      toolSlug: params.toolSlug ?? null,
      categorySlug: params.categorySlug ?? null,
      status: "draft",
      totalRecipients: recipients.length,
      createdById: params.createdById,
      recipients: {
        create: recipients.map((recipient) => ({
          userId: recipient.userId,
          email: recipient.email.toLowerCase(),
          status: "pending",
        })),
      },
    },
  });

  return { campaign, recipientCount: recipients.length };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processCampaignBatch(campaignId: string, maxBatches = 50) {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    return { error: "Campanha não encontrada." };
  }

  if (campaign.status === "sent") {
    return {
      campaignId,
      status: campaign.status,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      totalRecipients: campaign.totalRecipients,
      done: true,
    };
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "sending" },
  });

  const toolVars = await getToolContext(campaign.toolSlug);
  let batchesProcessed = 0;
  let sentCount = campaign.sentCount;
  let failedCount = campaign.failedCount;

  while (batchesProcessed < maxBatches) {
    const pending = await prisma.emailCampaignRecipient.findMany({
      where: { campaignId, status: "pending" },
      take: BATCH_SIZE,
      include: { campaign: false },
    });

    if (pending.length === 0) break;

    for (const recipient of pending) {
      const user = recipient.userId
        ? await prisma.user.findUnique({
            where: { id: recipient.userId },
            select: { name: true, email: true },
          })
        : null;

      const candidate: CampaignRecipientCandidate = {
        userId: recipient.userId ?? recipient.id,
        email: user?.email ?? recipient.email,
        name: user?.name ?? recipient.email,
      };

      const variables = buildVariables(candidate, toolVars);

      try {
        const ok = await sendEmail({
          to: candidate.email,
          subject: renderTemplate(campaign.subject, variables),
          html: renderTemplate(campaign.htmlContent, variables),
          text: renderTemplate(campaign.textContent, variables),
        });

        if (ok) {
          sentCount += 1;
          await prisma.emailCampaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "sent", sentAt: new Date(), errorMessage: null },
          });
        } else {
          failedCount += 1;
          await prisma.emailCampaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "failed",
              errorMessage: "Falha no envio SMTP.",
            },
          });
        }
      } catch (error) {
        failedCount += 1;
        await prisma.emailCampaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "failed",
            errorMessage:
              error instanceof Error ? error.message : "Erro desconhecido.",
          },
        });
      }
    }

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { sentCount, failedCount },
    });

    batchesProcessed += 1;

    const remaining = await prisma.emailCampaignRecipient.count({
      where: { campaignId, status: "pending" },
    });

    if (remaining === 0) break;
    await sleep(BATCH_DELAY_MS);
  }

  const remainingPending = await prisma.emailCampaignRecipient.count({
    where: { campaignId, status: "pending" },
  });

  const finalStatus =
    remainingPending === 0
      ? failedCount > 0 && sentCount === 0
        ? "failed"
        : "sent"
      : "sending";

  const updated = await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: finalStatus,
      sentCount,
      failedCount,
      sentAt: remainingPending === 0 ? new Date() : null,
    },
  });

  return {
    campaignId,
    status: updated.status,
    sentCount: updated.sentCount,
    failedCount: updated.failedCount,
    totalRecipients: updated.totalRecipients,
    done: remainingPending === 0,
  };
}
