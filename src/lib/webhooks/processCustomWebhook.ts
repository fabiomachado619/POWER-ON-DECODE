import type { Prisma } from "@prisma/client";
import {
  findOrCreateUserByEmail,
  grantModuleAccess,
} from "@/lib/accessControl";
import { DEFAULT_USER_PASSWORD } from "@/lib/constants";
import { sendWebhookAccessGrantedEmail } from "@/lib/emailService";
import { prisma } from "@/lib/prisma";
import {
  buildWebhookProviderKey,
  getWebhookConfigBySlug,
} from "@/lib/webhookConfig";
import {
  isPedidoPagoApproved,
  normalizePedidoPagoPayload,
} from "@/lib/webhooks/normalizePedidoPago";
import type { WebhookProcessResult } from "@/lib/webhooks/types";

function parseJsonBody(rawBody: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("JSON inválido.");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("Payload JSON inválido.");
  }
}

async function resolveToolsForWebhook(toolSlugs: string[]) {
  const tools = await prisma.tool.findMany({
    where: { slug: { in: toolSlugs }, active: true },
    include: { module: true },
  });

  const foundSlugs = new Set(tools.map((tool) => tool.slug));
  const missing = toolSlugs.filter((slug) => !foundSlugs.has(slug));

  return { tools, missing };
}

function isAlreadyProcessed(event: {
  processMessage: string | null;
  toolsReleased: string | null;
  emailSent: boolean;
}): boolean {
  return Boolean(
    event.toolsReleased ||
      event.emailSent ||
      event.processMessage?.toLowerCase().includes("liberado") ||
      event.processMessage?.toLowerCase().includes("idempotente")
  );
}

export async function processCustomWebhook(
  slug: string,
  rawBody: string
): Promise<WebhookProcessResult & { httpStatus?: number }> {
  const config = await getWebhookConfigBySlug(slug);

  if (!config) {
    return {
      success: false,
      httpStatus: 404,
      message: "Webhook não encontrado.",
    };
  }

  if (!config.active) {
    return {
      success: false,
      httpStatus: 403,
      message: "Webhook inativo.",
      provider: buildWebhookProviderKey(config.id),
    };
  }

  const rawPayload = parseJsonBody(rawBody);
  const normalized = normalizePedidoPagoPayload(rawPayload);
  const provider = buildWebhookProviderKey(config.id);
  const approved = isPedidoPagoApproved(normalized);

  const existing = await prisma.paymentEvent.findUnique({
    where: {
      provider_externalEventId: {
        provider,
        externalEventId: normalized.transactionId,
      },
    },
  });

  if (existing && isAlreadyProcessed(existing)) {
    return {
      success: true,
      httpStatus: 200,
      message: "Evento já processado anteriormente (idempotente).",
      provider,
      productId: normalized.productId,
      userEmail: normalized.customerEmail,
      transactionId: normalized.transactionId,
      toolSlug: existing.toolSlug ?? undefined,
    };
  }

  if (!approved) {
    await prisma.paymentEvent.upsert({
      where: {
        provider_externalEventId: {
          provider,
          externalEventId: normalized.transactionId,
        },
      },
      create: {
        provider,
        externalEventId: normalized.transactionId,
        externalProductId: normalized.productId || null,
        customerEmail: normalized.customerEmail || null,
        customerName: normalized.customerName || null,
        productName: normalized.productName || null,
        webhookConfigId: config.id,
        status: normalized.statusRaw,
        processMessage: "Evento registrado. Pagamento não aprovado.",
        rawPayload: rawPayload as Prisma.InputJsonValue,
      },
      update: {
        externalProductId: normalized.productId || null,
        customerEmail: normalized.customerEmail || null,
        customerName: normalized.customerName || null,
        productName: normalized.productName || null,
        webhookConfigId: config.id,
        status: normalized.statusRaw,
        processMessage: "Evento registrado. Pagamento não aprovado.",
        rawPayload: rawPayload as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      httpStatus: 200,
      message: `Evento registrado com status "${normalized.statusRaw}". Nenhum acesso liberado.`,
      provider,
      productId: normalized.productId,
      userEmail: normalized.customerEmail,
      transactionId: normalized.transactionId,
    };
  }

  if (!normalized.customerEmail) {
    await prisma.paymentEvent.upsert({
      where: {
        provider_externalEventId: {
          provider,
          externalEventId: normalized.transactionId,
        },
      },
      create: {
        provider,
        externalEventId: normalized.transactionId,
        externalProductId: normalized.productId || null,
        customerName: normalized.customerName || null,
        productName: normalized.productName || null,
        webhookConfigId: config.id,
        status: normalized.statusRaw,
        processMessage: "E-mail do cliente não informado.",
        rawPayload: rawPayload as Prisma.InputJsonValue,
      },
      update: {
        externalProductId: normalized.productId || null,
        customerName: normalized.customerName || null,
        productName: normalized.productName || null,
        webhookConfigId: config.id,
        status: normalized.statusRaw,
        processMessage: "E-mail do cliente não informado.",
        rawPayload: rawPayload as Prisma.InputJsonValue,
      },
    });

    return {
      success: false,
      httpStatus: 400,
      message: "Pagamento aprovado, mas e-mail do cliente não informado.",
      provider,
      productId: normalized.productId,
      transactionId: normalized.transactionId,
    };
  }

  const linkedSlugs = config.tools.map((entry) => entry.toolSlug);
  if (linkedSlugs.length === 0) {
    return {
      success: false,
      httpStatus: 400,
      message: "Webhook sem ferramentas vinculadas.",
      provider,
      userEmail: normalized.customerEmail,
      transactionId: normalized.transactionId,
    };
  }

  const { tools, missing } = await resolveToolsForWebhook(linkedSlugs);
  if (tools.length === 0) {
    return {
      success: false,
      httpStatus: 400,
      message: `Nenhuma ferramenta válida vinculada. Ausentes: ${missing.join(", ")}`,
      provider,
      userEmail: normalized.customerEmail,
      transactionId: normalized.transactionId,
    };
  }

  const user = await findOrCreateUserByEmail({
    email: normalized.customerEmail,
    name: normalized.customerName || undefined,
  });

  const releasedSlugs: string[] = [];
  let latestExpiresAt: Date | null = null;
  let anyRenewed = false;

  for (const tool of tools) {
    const toolName = tool.displayName ?? tool.name;
    const accessResult = await grantModuleAccess({
      userId: user.id,
      moduleSlug: tool.module.slug,
      source: "webhook",
      sourcePayment: provider,
      externalProductId: normalized.productId || undefined,
      sendEmail: false,
      toolName,
      notes: `Liberação automática via webhook ${config.name} (${normalized.transactionId})`,
    });

    releasedSlugs.push(tool.slug);
    latestExpiresAt = accessResult.expiresAt;
    if (accessResult.renewed) anyRenewed = true;
  }

  const toolNames = tools.map((tool) => tool.displayName ?? tool.name);
  const emailSent = await sendWebhookAccessGrantedEmail({
    name: user.name,
    email: user.email,
    toolNames,
    isNewUser: user.isNew,
    password: user.isNew ? DEFAULT_USER_PASSWORD : undefined,
    expiresAt: latestExpiresAt,
  });

  const processMessage = anyRenewed
    ? `Acesso renovado/adicionado para ${releasedSlugs.length} ferramenta(s).`
    : `Acesso liberado para ${releasedSlugs.length} ferramenta(s).`;

  await prisma.paymentEvent.upsert({
    where: {
      provider_externalEventId: {
        provider,
        externalEventId: normalized.transactionId,
      },
    },
    create: {
      provider,
      externalEventId: normalized.transactionId,
      externalProductId: normalized.productId || null,
      customerEmail: normalized.customerEmail,
      customerName: normalized.customerName || null,
      productName: normalized.productName || null,
      toolSlug: releasedSlugs[0] ?? null,
      toolsReleased: releasedSlugs.join(", "),
      webhookConfigId: config.id,
      emailSent,
      status: normalized.statusRaw,
      processMessage,
      rawPayload: rawPayload as Prisma.InputJsonValue,
    },
    update: {
      externalProductId: normalized.productId || null,
      customerEmail: normalized.customerEmail,
      customerName: normalized.customerName || null,
      productName: normalized.productName || null,
      toolSlug: releasedSlugs[0] ?? null,
      toolsReleased: releasedSlugs.join(", "),
      webhookConfigId: config.id,
      emailSent,
      status: normalized.statusRaw,
      processMessage,
      rawPayload: rawPayload as Prisma.InputJsonValue,
    },
  });

  return {
    success: true,
    httpStatus: 200,
    message: processMessage,
    provider,
    productId: normalized.productId,
    toolSlug: releasedSlugs.join(", "),
    userEmail: user.email,
    userCreated: user.isNew,
    renewed: anyRenewed,
    transactionId: normalized.transactionId,
  };
}
