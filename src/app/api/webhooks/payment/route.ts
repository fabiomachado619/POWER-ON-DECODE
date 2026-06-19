import { NextResponse } from "next/server";
import { processPaymentWebhook } from "@/lib/webhookController";

export async function POST(request: Request) {
  try {
    const result = await processPaymentWebhook(request);
    const status = result.success ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao processar webhook.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/payment",
    method: "POST",
    description:
      "Recebe webhook JSON de qualquer plataforma de pagamento. A liberação depende apenas do product_id mapeado no admin.",
    expectedPayload: {
      customer_name: "",
      customer_email: "",
      product_id: "",
      product_name: "",
      status: "",
      transaction_id: "",
    },
    headers: {
      "x-webhook-provider": "generic | custom | kiwify | hotmart | cartpanda | pepper | kirvano",
      "x-webhook-secret": "opcional — deve coincidir com PAYMENT_WEBHOOK_SECRET",
    },
  });
}
