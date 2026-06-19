import type { WebhookPayload } from "../types";

function readString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function pickString(payload: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = readString(payload[key]);
    if (value) return value;
  }
  return "";
}

export function normalizeGenericPayload(
  payload: Record<string, unknown>
): WebhookPayload {
  return {
    customer_name: pickString(payload, [
      "customer_name",
      "customerName",
      "buyer_name",
      "name",
    ]),
    customer_email: pickString(payload, [
      "customer_email",
      "customerEmail",
      "buyer_email",
      "email",
    ]),
    product_id: pickString(payload, [
      "product_id",
      "productId",
      "externalProductId",
      "offer_id",
    ]),
    product_name: pickString(payload, [
      "product_name",
      "productName",
      "offer_name",
    ]),
    status: pickString(payload, ["status", "payment_status", "event"]),
    transaction_id: pickString(payload, [
      "transaction_id",
      "transactionId",
      "externalEventId",
      "event_id",
      "gateway_transaction_id",
      "id",
      "order_id",
    ]),
  };
}

export function normalizeWebhookStatus(rawStatus: string): WebhookPayload["status"] {
  return rawStatus;
}

export function mapToInternalStatus(
  rawStatus: string
): "approved" | "pending" | "refunded" | "cancelled" | "unknown" {
  const status = rawStatus.toLowerCase();

  if (
    [
      "approved",
      "paid",
      "completed",
      "complete",
      "success",
      "active",
      "aprovado",
      "pedido_pago",
    ].includes(status)
  ) {
    return "approved";
  }

  if (["pending", "waiting", "processing", "pendente"].includes(status)) {
    return "pending";
  }

  if (["refunded", "chargeback", "reembolsado"].includes(status)) {
    return "refunded";
  }

  if (["cancelled", "canceled", "failed", "declined", "cancelado"].includes(status)) {
    return "cancelled";
  }

  return "unknown";
}
