import { processWebhook } from "@/lib/webhooks/processWebhook";

export type { WebhookProcessResult } from "@/lib/webhooks/types";

export async function processPaymentWebhook(request: Request) {
  return processWebhook(request);
}
