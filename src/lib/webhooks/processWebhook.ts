import type { Prisma } from "@prisma/client";
import {
  findOrCreateUserByEmail,
  grantModuleAccess,
} from "@/lib/accessControl";
import { DEFAULT_USER_PASSWORD } from "@/lib/constants";
import { sendAccessGrantedEmail } from "@/lib/emailService";
import { prisma } from "@/lib/prisma";
import { resolveAccessFromProductId } from "@/lib/productMapping";
import type { WebhookProcessResult } from "./types";
import { isApprovedWebhook, normalizeWebhook } from "./normalizeWebhook";

export async function processWebhook(
  request: Request
): Promise<WebhookProcessResult> {
  const rawBody = await request.text();

  let event;
  try {
    event = await normalizeWebhook(request, rawBody);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Payload do webhook inválido.",
    };
  }

  await prisma.paymentEvent.upsert({
    where: {
      provider_externalEventId: {
        provider: event.provider,
        externalEventId: event.transaction_id,
      },
    },
    create: {
      provider: event.provider,
      externalEventId: event.transaction_id,
      externalProductId: event.product_id,
      customerEmail: event.customer_email,
      customerName: event.customer_name || null,
      productName: event.product_name || null,
      toolSlug: null,
      status: event.normalizedStatus,
      rawPayload: event.rawPayload as Prisma.InputJsonValue,
    },
    update: {
      externalProductId: event.product_id,
      customerEmail: event.customer_email,
      customerName: event.customer_name || null,
      productName: event.product_name || null,
      status: event.normalizedStatus,
      rawPayload: event.rawPayload as Prisma.InputJsonValue,
    },
  });

  if (!isApprovedWebhook(event)) {
    return {
      success: true,
      message: `Evento registrado com status "${event.status}". Nenhum acesso liberado.`,
      provider: event.provider,
      productId: event.product_id,
      userEmail: event.customer_email,
      transactionId: event.transaction_id,
    };
  }

  if (!event.customer_email) {
    return {
      success: false,
      message: "Compra aprovada, mas e-mail do cliente não informado.",
      provider: event.provider,
      productId: event.product_id,
      transactionId: event.transaction_id,
    };
  }

  if (!event.product_id) {
    return {
      success: false,
      message: "Compra aprovada, mas product_id não informado.",
      provider: event.provider,
      userEmail: event.customer_email,
      transactionId: event.transaction_id,
    };
  }

  const resolved = await resolveAccessFromProductId(event.product_id);
  if (!resolved) {
    return {
      success: false,
      message: `Produto "${event.product_id}" não mapeado para nenhuma ferramenta.`,
      provider: event.provider,
      productId: event.product_id,
      userEmail: event.customer_email,
      transactionId: event.transaction_id,
    };
  }

  const user = await findOrCreateUserByEmail({
    email: event.customer_email,
    name: event.customer_name || undefined,
  });

  const toolName =
    resolved.tool.displayName ??
    resolved.tool.name ??
    event.product_name ??
    resolved.tool.slug;

  const accessResult = await grantModuleAccess({
    userId: user.id,
    moduleSlug: resolved.moduleSlug,
    source: "webhook",
    sourcePayment: event.provider,
    externalProductId: event.product_id,
    sendEmail: false,
    toolName,
    notes: `Liberação automática via webhook (${event.transaction_id})`,
  });

  await sendAccessGrantedEmail({
    name: user.name,
    email: user.email,
    toolName,
    isNewUser: user.isNew,
    password: user.isNew ? DEFAULT_USER_PASSWORD : undefined,
    expiresAt: accessResult.expiresAt,
  });

  await prisma.paymentEvent.update({
    where: {
      provider_externalEventId: {
        provider: event.provider,
        externalEventId: event.transaction_id,
      },
    },
    data: {
      toolSlug: resolved.tool.slug,
      processMessage: accessResult.renewed
        ? "Acesso renovado por 365 dias."
        : "Acesso liberado com sucesso.",
    },
  });

  return {
    success: true,
    message: accessResult.renewed
      ? "Acesso renovado por mais 365 dias."
      : "Acesso à ferramenta liberado com sucesso.",
    provider: event.provider,
    productId: event.product_id,
    toolSlug: resolved.tool.slug,
    moduleSlug: resolved.moduleSlug,
    userEmail: user.email,
    userCreated: user.isNew,
    renewed: accessResult.renewed,
    transactionId: event.transaction_id,
  };
}
