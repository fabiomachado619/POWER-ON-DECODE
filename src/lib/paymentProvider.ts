import type { PaymentWebhookPayload } from "@/types";

export type PaymentProviderName =
  | "generic"
  | "kiwify"
  | "hotmart"
  | "cartpanda"
  | "pepper"
  | "kirvano";

export interface NormalizedPaymentEvent {
  provider: PaymentProviderName;
  externalEventId: string;
  externalProductId: string;
  customerEmail: string;
  customerName?: string;
  status: "approved" | "pending" | "refunded" | "cancelled" | "unknown";
  rawPayload: Record<string, unknown>;
}

export interface PaymentProviderAdapter {
  name: PaymentProviderName;
  verifyWebhook(
    request: Request,
    rawBody: string
  ): Promise<boolean>;
  parseWebhook(
    rawBody: string,
    headers: Headers
  ): NormalizedPaymentEvent;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function normalizeStatus(rawStatus: string): NormalizedPaymentEvent["status"] {
  const status = rawStatus.toLowerCase();

  if (
    ["approved", "paid", "completed", "complete", "success", "active"].includes(
      status
    )
  ) {
    return "approved";
  }

  if (["pending", "waiting", "processing"].includes(status)) {
    return "pending";
  }

  if (["refunded", "chargeback"].includes(status)) {
    return "refunded";
  }

  if (["cancelled", "canceled", "failed", "declined"].includes(status)) {
    return "cancelled";
  }

  return "unknown";
}

const genericAdapter: PaymentProviderAdapter = {
  name: "generic",
  async verifyWebhook(request, rawBody) {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) return true;

    const headerSecret =
      request.headers.get("x-webhook-secret") ??
      request.headers.get("x-payment-secret");

    return headerSecret === secret;
  },
  parseWebhook(rawBody, headers) {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const providerHeader = headers.get("x-payment-provider") ?? "generic";

    return {
      provider: providerHeader as PaymentProviderName,
      externalEventId:
        readString(payload.externalEventId) ??
        readString(payload.event_id) ??
        readString(payload.id) ??
        crypto.randomUUID(),
      externalProductId:
        readString(payload.externalProductId) ??
        readString(payload.product_id) ??
        readString(payload.offer_id) ??
        "",
      customerEmail:
        readString(payload.customerEmail) ??
        readString(payload.buyer_email) ??
        readString(payload.email) ??
        "",
      customerName:
        readString(payload.customerName) ??
        readString(payload.buyer_name) ??
        readString(payload.name),
      status: normalizeStatus(
        readString(payload.status) ??
          readString(payload.payment_status) ??
          "unknown"
      ),
      rawPayload: payload,
    };
  },
};

const kiwifyAdapter: PaymentProviderAdapter = {
  ...genericAdapter,
  name: "kiwify",
  parseWebhook(rawBody) {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const order = (payload.order ?? payload) as Record<string, unknown>;
    const customer = (order.Customer ?? {}) as Record<string, unknown>;

    return {
      provider: "kiwify",
      externalEventId:
        readString(order.order_id) ??
        readString(payload.event_id) ??
        crypto.randomUUID(),
      externalProductId:
        readString(order.product_id) ?? readString(order.offer_id) ?? "",
      customerEmail:
        readString(customer.email) ??
        readString(order.customer_email) ??
        "",
      customerName:
        readString(customer.full_name) ??
        readString(order.customer_name),
      status: normalizeStatus(
        readString(order.order_status) ?? readString(payload.event) ?? "unknown"
      ),
      rawPayload: payload,
    };
  },
};

const hotmartAdapter: PaymentProviderAdapter = {
  ...genericAdapter,
  name: "hotmart",
  parseWebhook(rawBody) {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const data = (payload.data ?? payload) as Record<string, unknown>;
    const buyer = (data.buyer ?? {}) as Record<string, unknown>;
    const product = (data.product ?? {}) as Record<string, unknown>;
    const purchase = (data.purchase ?? {}) as Record<string, unknown>;

    return {
      provider: "hotmart",
      externalEventId:
        readString(purchase.transaction) ??
        readString(payload.id) ??
        crypto.randomUUID(),
      externalProductId: readString(product.id) ?? "",
      customerEmail: readString(buyer.email) ?? "",
      customerName: readString(buyer.name),
      status: normalizeStatus(
        readString(purchase.status) ??
          readString(payload.event) ??
          "unknown"
      ),
      rawPayload: payload,
    };
  },
};

const PROVIDERS: Record<PaymentProviderName, PaymentProviderAdapter> = {
  generic: genericAdapter,
  kiwify: kiwifyAdapter,
  hotmart: hotmartAdapter,
  cartpanda: genericAdapter,
  pepper: genericAdapter,
  kirvano: genericAdapter,
};

export function resolvePaymentProvider(
  providerName?: string | null
): PaymentProviderAdapter {
  const normalized = (providerName ?? "generic").toLowerCase() as PaymentProviderName;
  return PROVIDERS[normalized] ?? genericAdapter;
}

export function isApprovedPayment(
  event: NormalizedPaymentEvent
): boolean {
  return event.status === "approved";
}

export type { PaymentWebhookPayload };
