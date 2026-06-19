export interface WebhookPayload {
  customer_name: string;
  customer_email: string;
  product_id: string;
  product_name: string;
  status: string;
  transaction_id: string;
}

export type WebhookStatus =
  | "approved"
  | "pending"
  | "refunded"
  | "cancelled"
  | "unknown";

export interface NormalizedWebhookPayload extends WebhookPayload {
  provider: string;
  normalizedStatus: WebhookStatus;
  rawPayload: Record<string, unknown>;
}

export interface WebhookProcessResult {
  success: boolean;
  message: string;
  provider?: string;
  productId?: string;
  toolSlug?: string;
  moduleSlug?: string;
  userEmail?: string;
  userCreated?: boolean;
  renewed?: boolean;
  transactionId?: string;
}

export interface WebhookProviderAdapter {
  name: string;
  verify(request: Request, rawBody: string): Promise<boolean>;
  normalize(rawBody: string, headers: Headers): WebhookPayload;
}
