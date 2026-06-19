import { processCustomWebhook } from "@/lib/webhooks/processCustomWebhook";
import { webhookCorsResponse, webhookOptionsResponse } from "@/lib/webhookCors";

interface RouteParams {
  params: { slug: string };
}

export async function OPTIONS() {
  return webhookOptionsResponse();
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const rawBody = await request.text();
    const result = await processCustomWebhook(params.slug, rawBody);

    return webhookCorsResponse(
      {
        success: result.success,
        message: result.message,
        transactionId: result.transactionId,
        userEmail: result.userEmail,
        toolsReleased: result.toolSlug,
      },
      result.httpStatus ?? (result.success ? 200 : 400)
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao processar webhook.";
    return webhookCorsResponse({ success: false, message }, 500);
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  return webhookCorsResponse(
    {
      endpoint: `/api/webhooks/custom/${params.slug}`,
      method: "POST",
      contentType: "application/json",
      instructions:
        "Copie este link e cole na plataforma de pagamento para receber notificações JSON.",
      expectedFormat: {
        event: "pedido_pago",
        payload: {
          order: { id: 140, status: "completed" },
          status: "paid",
          product: { id: "produto-externo", name: "Nome do produto" },
          customer: { name: "Cliente", email: "cliente@exemplo.com" },
          payment: { gateway_transaction_id: "transacao-unica" },
        },
      },
    },
    200
  );
}
