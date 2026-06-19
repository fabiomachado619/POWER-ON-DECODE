import type { NormalizedWebhookPayload, WebhookProviderAdapter } from "./types";
import { customWebhookProvider, toNormalizedStatus } from "./providers/custom";
import {
  mapToInternalStatus,
  normalizeGenericPayload,
} from "./providers/generic";

export const genericWebhookProvider: WebhookProviderAdapter = {
  name: "generic",
  async verify(request, rawBody) {
    return customWebhookProvider.verify(request, rawBody);
  },
  normalize(rawBody) {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    return normalizeGenericPayload(payload);
  },
};

const PROVIDERS: Record<string, WebhookProviderAdapter> = {
  generic: genericWebhookProvider,
  custom: customWebhookProvider,
  kiwify: customWebhookProvider,
  hotmart: customWebhookProvider,
  cartpanda: genericWebhookProvider,
  pepper: genericWebhookProvider,
  kirvano: genericWebhookProvider,
};

export function resolveWebhookProvider(providerName?: string | null) {
  const normalized = (providerName ?? "generic").toLowerCase();
  return PROVIDERS[normalized] ?? genericWebhookProvider;
}

export async function normalizeWebhook(
  request: Request,
  rawBody: string
): Promise<NormalizedWebhookPayload> {
  const providerHeader =
    request.headers.get("x-webhook-provider") ??
    request.headers.get("x-payment-provider") ??
    "generic";

  const provider = resolveWebhookProvider(providerHeader);
  const isValid = await provider.verify(request, rawBody);

  if (!isValid) {
    throw new Error("Webhook rejeitado: assinatura ou segredo inválido.");
  }

  const payload = provider.normalize(rawBody, request.headers);
  const transactionId =
    payload.transaction_id ||
    crypto.randomUUID();

  return {
    ...payload,
    transaction_id: transactionId,
    provider: provider.name,
    normalizedStatus: mapToInternalStatus(payload.status),
    rawPayload: JSON.parse(rawBody) as Record<string, unknown>,
  };
}

export { toNormalizedStatus as isApprovedWebhookStatus };

export function isApprovedWebhook(event: NormalizedWebhookPayload): boolean {
  return event.normalizedStatus === "approved";
}
