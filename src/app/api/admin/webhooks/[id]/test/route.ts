import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/auditLog";
import { requireAdminUser } from "@/lib/adminAuth";
import {
  getWebhookConfigById,
  SAMPLE_WEBHOOK_PAYLOAD,
  buildWebhookPublicUrl,
} from "@/lib/webhookConfig";
import { diagnosePublicBaseUrl } from "@/lib/publicUrl";
import { processCustomWebhook } from "@/lib/webhooks/processCustomWebhook";

interface RouteParams {
  params: { id: string };
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const admin = await requireAdminUser();
    const config = await getWebhookConfigById(params.id);
    if (!config) {
      return NextResponse.json({ error: "Webhook não encontrado." }, { status: 404 });
    }

    const testPayload = {
      ...SAMPLE_WEBHOOK_PAYLOAD,
      payload: {
        ...SAMPLE_WEBHOOK_PAYLOAD.payload,
        customer: {
          ...SAMPLE_WEBHOOK_PAYLOAD.payload.customer,
          email: admin.email,
          name: admin.name,
        },
        payment: {
          ...SAMPLE_WEBHOOK_PAYLOAD.payload.payment,
          gateway_transaction_id: `test_${Date.now()}`,
        },
      },
    };

    const result = await processCustomWebhook(
      config.slug,
      JSON.stringify(testPayload)
    );

    const publicUrl = buildWebhookPublicUrl(config.slug);
    const publicUrlConfig = await diagnosePublicBaseUrl();

    await logAdminAction({
      adminUserId: admin.id,
      action: "webhook_config.tested",
      targetType: "webhook_config",
      targetId: config.id,
      metadata: {
        success: result.success,
        transactionId: result.transactionId,
      },
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      transactionId: result.transactionId,
      userEmail: result.userEmail,
      toolsReleased: result.toolSlug,
      publicUrl,
      publicUrlConfig,
      note: publicUrlConfig.dnsResolvable
        ? "Teste interno concluído. Plataformas externas devem enviar POST para o link público acima."
        : "Teste interno concluído, mas o domínio público ainda não resolve no DNS. Corrija APP_URL/WEBHOOK_PUBLIC_BASE_URL e o DNS antes de testar na plataforma de pagamento.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
