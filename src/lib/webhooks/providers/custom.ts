import type { WebhookPayload, WebhookProviderAdapter } from "../types";
import {
  mapToInternalStatus,
  normalizeGenericPayload,
} from "./generic";

function readNested(
  payload: Record<string, unknown>,
  path: string[]
): Record<string, unknown> {
  let current: unknown = payload;
  for (const key of path) {
    if (!current || typeof current !== "object") return {};
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "object" && current !== null
    ? (current as Record<string, unknown>)
    : {};
}

function flattenForCustom(payload: Record<string, unknown>): WebhookPayload {
  const base = normalizeGenericPayload(payload);

  const order = readNested(payload, ["order"]);
  const data = readNested(payload, ["data"]);
  const innerPayload = readNested(payload, ["payload"]);
  const buyer = readNested(data, ["buyer"]);
  const product =
    readNested(innerPayload, ["product"]) ||
    readNested(data, ["product"]);
  const purchase = readNested(data, ["purchase"]);
  const customer =
    readNested(innerPayload, ["customer"]) ||
    readNested(order, ["Customer"]);
  const payment = readNested(innerPayload, ["payment"]);

  return {
    customer_name:
      base.customer_name ||
      normalizeGenericPayload(innerPayload).customer_name ||
      normalizeGenericPayload(order).customer_name ||
      normalizeGenericPayload(customer).customer_name ||
      normalizeGenericPayload(buyer).customer_name,
    customer_email:
      base.customer_email ||
      normalizeGenericPayload(innerPayload).customer_email ||
      normalizeGenericPayload(order).customer_email ||
      normalizeGenericPayload(customer).customer_email ||
      normalizeGenericPayload(buyer).customer_email,
    product_id:
      base.product_id ||
      normalizeGenericPayload(innerPayload).product_id ||
      normalizeGenericPayload(order).product_id ||
      normalizeGenericPayload(product).product_id,
    product_name:
      base.product_name ||
      normalizeGenericPayload(innerPayload).product_name ||
      normalizeGenericPayload(order).product_name ||
      normalizeGenericPayload(product).product_name,
    status:
      base.status ||
      normalizeGenericPayload(innerPayload).status ||
      normalizeGenericPayload(order).status ||
      normalizeGenericPayload(purchase).status ||
      readString(payload.event),
    transaction_id:
      base.transaction_id ||
      normalizeGenericPayload(payment).transaction_id ||
      normalizeGenericPayload(innerPayload).transaction_id ||
      normalizeGenericPayload(order).transaction_id ||
      normalizeGenericPayload(purchase).transaction_id,
  };
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export const customWebhookProvider: WebhookProviderAdapter = {
  name: "custom",
  async verify(request) {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) return true;

    const headerSecret =
      request.headers.get("x-webhook-secret") ??
      request.headers.get("x-payment-secret");

    return headerSecret === secret;
  },
  normalize(rawBody) {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    return flattenForCustom(payload);
  },
};

export function toNormalizedStatus(status: string) {
  return mapToInternalStatus(status);
}
