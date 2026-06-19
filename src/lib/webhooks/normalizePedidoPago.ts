export interface PedidoPagoPayload {
  event?: string;
  event_label?: string;
  timestamp?: string;
  payload?: {
    order?: {
      id?: number | string;
      amount?: number;
      status?: string;
    };
    status?: string;
    product?: {
      id?: string;
      name?: string;
    };
    customer?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    payment?: {
      method?: string;
      gateway_transaction_id?: string;
    };
  };
}

export interface NormalizedPedidoPago {
  event: string;
  customerName: string;
  customerEmail: string;
  productId: string;
  productName: string;
  transactionId: string;
  statusRaw: string;
  approved: boolean;
  rawPayload: Record<string, unknown>;
}

function cleanEmail(value: string): string {
  const trimmed = value.trim();
  const markdownMatch = trimmed.match(/\[([^\]]+)\]\((mailto:[^)]+)\)/i);
  if (markdownMatch) {
    return markdownMatch[1].trim().toLowerCase();
  }
  const mailtoMatch = trimmed.match(/^mailto:(.+)$/i);
  if (mailtoMatch) {
    return mailtoMatch[1].trim().toLowerCase();
  }
  return trimmed.toLowerCase();
}

function readString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

export function normalizePedidoPagoPayload(
  raw: Record<string, unknown>
): NormalizedPedidoPago {
  const body = raw as PedidoPagoPayload;
  const payload = body.payload ?? {};
  const order = payload.order ?? {};
  const product = payload.product ?? {};
  const customer = payload.customer ?? {};
  const payment = payload.payment ?? {};

  const event = readString(body.event);
  const payloadStatus = readString(payload.status);
  const orderStatus = readString(order.status);

  const approved =
    event === "pedido_pago" ||
    payloadStatus === "paid" ||
    orderStatus === "completed";

  const transactionId =
    readString(payment.gateway_transaction_id) ||
    readString(order.id) ||
    `evt_${Date.now()}`;

  const customerEmail = cleanEmail(readString(customer.email));

  return {
    event,
    customerName: readString(customer.name),
    customerEmail,
    productId: readString(product.id),
    productName: readString(product.name),
    transactionId,
    statusRaw: payloadStatus || orderStatus || event || "unknown",
    approved,
    rawPayload: raw,
  };
}

export function isPedidoPagoApproved(normalized: NormalizedPedidoPago): boolean {
  return normalized.approved;
}
