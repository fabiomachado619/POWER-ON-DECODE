import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import { requireAdminUser } from "@/lib/adminAuth";
import {
  buildWebhookPublicUrl,
  createWebhookConfig,
  isValidWebhookSlug,
  listWebhookConfigs,
  slugifyWebhook,
} from "@/lib/webhookConfig";

const slugSchema = z
  .string()
  .min(3)
  .max(64)
  .refine((value) => isValidWebhookSlug(slugifyWebhook(value)), {
    message: "Slug inválido.",
  });

const createSchema = z.object({
  name: z.string().min(2),
  slug: slugSchema.optional(),
  description: z.string().optional(),
  toolSlugs: z.array(z.string()).min(1),
});

export async function GET() {
  try {
    await requireAdminUser();
    const configs = await listWebhookConfigs();
    return NextResponse.json({
      webhooks: configs.map((config) => ({
        id: config.id,
        name: config.name,
        slug: config.slug,
        urlPath: config.urlPath,
        publicUrl: buildWebhookPublicUrl(config.slug),
        active: config.active,
        description: config.description,
        toolSlugs: config.tools.map((tool) => tool.toolSlug),
        toolsCount: config.tools.length,
        eventsCount: config._count.paymentEvents,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const config = await createWebhookConfig({
      name: parsed.data.name,
      slug: parsed.data.slug ? slugifyWebhook(parsed.data.slug) : undefined,
      description: parsed.data.description,
      toolSlugs: parsed.data.toolSlugs,
      createdById: admin.id,
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: "webhook_config.created",
      targetType: "webhook_config",
      targetId: config.id,
      metadata: {
        name: config.name,
        slug: config.slug,
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
