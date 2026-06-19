import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import { requireAdminUser } from "@/lib/adminAuth";
import {
  buildWebhookPublicUrl,
  getWebhookConfigById,
  getWebhookLogs,
  isValidWebhookSlug,
  slugifyWebhook,
  updateWebhookConfig,
} from "@/lib/webhookConfig";

const updateSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(3)
    .max(64)
    .refine((value) => isValidWebhookSlug(slugifyWebhook(value)), {
      message: "Slug inválido.",
    }),
  description: z.string().optional(),
  active: z.boolean(),
  toolSlugs: z.array(z.string()).min(1),
});

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireAdminUser();
    const config = await getWebhookConfigById(params.id);
    if (!config) {
      return NextResponse.json({ error: "Webhook não encontrado." }, { status: 404 });
    }

    const logs = await getWebhookLogs(params.id);

    return NextResponse.json({
      webhook: {
        id: config.id,
        name: config.name,
        slug: config.slug,
        urlPath: config.urlPath,
        publicUrl: buildWebhookPublicUrl(config.slug),
        active: config.active,
        description: config.description,
        toolSlugs: config.tools.map((tool) => tool.toolSlug),
      },
      logs: logs.map((event) => ({
        id: event.id,
        createdAt: event.createdAt.toISOString(),
        customerName: event.customerName,
        customerEmail: event.customerEmail,
        status: event.status,
        externalProductId: event.externalProductId,
        productName: event.productName,
        toolsReleased: event.toolsReleased,
        externalEventId: event.externalEventId,
        processMessage: event.processMessage,
        emailSent: event.emailSent,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const admin = await requireAdminUser();
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const existing = await getWebhookConfigById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Webhook não encontrado." }, { status: 404 });
    }

    const config = await updateWebhookConfig({
      id: params.id,
      name: parsed.data.name,
      slug: slugifyWebhook(parsed.data.slug),
      description: parsed.data.description,
      active: parsed.data.active,
      toolSlugs: parsed.data.toolSlugs,
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: "webhook_config.updated",
      targetType: "webhook_config",
      targetId: config.id,
      metadata: {
        slug: config.slug,
        active: config.active,
        toolSlugs: parsed.data.toolSlugs,
      },
    });

    return NextResponse.json({
      success: true,
      webhook: {
        id: config.id,
        name: config.name,
        slug: config.slug,
        urlPath: config.urlPath,
        publicUrl: buildWebhookPublicUrl(config.slug),
        active: config.active,
        description: config.description,
        toolSlugs: config.tools.map((tool) => tool.toolSlug),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
