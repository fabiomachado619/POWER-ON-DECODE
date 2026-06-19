import { prisma } from "@/lib/prisma";

export function slugifyWebhook(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function buildWebhookUrlPath(slug: string): string {
  return `/api/webhooks/custom/${slug}`;
}

export function getAppBaseUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export function buildWebhookPublicUrl(slug: string): string {
  return `${getAppBaseUrl()}${buildWebhookUrlPath(slug)}`;
}

export function buildWebhookProviderKey(webhookConfigId: string): string {
  return `custom_webhook:${webhookConfigId}`;
}

export function isValidWebhookSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3;
}

export async function resolveUniqueWebhookSlug(
  base: string,
  excludeId?: string
): Promise<string> {
  let slug = slugifyWebhook(base) || "webhook";
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await prisma.webhookConfig.findUnique({
      where: { slug: candidate },
    });
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
  }
}

export async function assertWebhookSlugAvailable(
  slug: string,
  excludeId?: string
): Promise<void> {
  if (!isValidWebhookSlug(slug)) {
    throw new Error(
      "Slug inválido. Use apenas letras minúsculas, números e hífens."
    );
  }

  const existing = await prisma.webhookConfig.findUnique({ where: { slug } });
  if (existing && existing.id !== excludeId) {
    throw new Error("Este slug já está em uso. Escolha outro.");
  }
}

export async function listWebhookConfigs() {
  const configs = await prisma.webhookConfig.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tools: { orderBy: { toolSlug: "asc" } },
      _count: { select: { paymentEvents: true } },
    },
  });

  await Promise.all(
    configs.map(async (config) => {
      const expectedPath = buildWebhookUrlPath(config.slug);
      if (config.urlPath !== expectedPath) {
        await prisma.webhookConfig.update({
          where: { id: config.id },
          data: { urlPath: expectedPath },
        });
        config.urlPath = expectedPath;
      }
    })
  );

  return configs;
}

export async function getWebhookConfigBySlug(slug: string) {
  const config = await prisma.webhookConfig.findUnique({
    where: { slug },
    include: { tools: true },
  });
  if (config) return config;

  return prisma.webhookConfig.findUnique({
    where: { token: slug },
    include: { tools: true },
  });
}

export async function getWebhookConfigById(id: string) {
  return prisma.webhookConfig.findUnique({
    where: { id },
    include: { tools: true },
  });
}

export async function createWebhookConfig(params: {
  name: string;
  slug?: string;
  description?: string;
  toolSlugs: string[];
  createdById: string;
}) {
  const slug = params.slug
    ? slugifyWebhook(params.slug)
    : await resolveUniqueWebhookSlug(params.name);

  await assertWebhookSlugAvailable(slug);
  const urlPath = buildWebhookUrlPath(slug);

  return prisma.webhookConfig.create({
    data: {
      name: params.name,
      slug,
      token: slug,
      urlPath,
      description: params.description ?? null,
      createdById: params.createdById,
      tools: {
        create: params.toolSlugs.map((toolSlug) => ({ toolSlug })),
      },
    },
    include: { tools: true },
  });
}

export async function updateWebhookConfig(params: {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  toolSlugs: string[];
}) {
  const current = await prisma.webhookConfig.findUnique({
    where: { id: params.id },
  });
  if (!current) {
    throw new Error("Webhook não encontrado.");
  }

  const slug = slugifyWebhook(params.slug);
  await assertWebhookSlugAvailable(slug, params.id);
  const urlPath = buildWebhookUrlPath(slug);

  await prisma.webhookConfigTool.deleteMany({
    where: { webhookConfigId: params.id },
  });

  return prisma.webhookConfig.update({
    where: { id: params.id },
    data: {
      name: params.name,
      slug,
      urlPath,
      description: params.description ?? null,
      active: params.active,
      tools: {
        create: params.toolSlugs.map((toolSlug) => ({ toolSlug })),
      },
    },
    include: { tools: true },
  });
}

export async function getWebhookLogs(webhookConfigId: string, take = 50) {
  return prisma.paymentEvent.findMany({
    where: { webhookConfigId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export const SAMPLE_WEBHOOK_PAYLOAD = {
  event: "pedido_pago",
  payload: {
    order: {
      id: 140,
      amount: 97,
      status: "completed",
    },
    status: "paid",
    product: {
      id: "79e9d259-2223-47a8-b93b-db011142b76d",
      name: "Script UPA-USB 2025.2",
    },
    customer: {
      name: "Christian",
      email: "cliente@exemplo.com",
      phone: "5563992726536",
    },
    payment: {
      method: "pix",
      gateway_transaction_id: "f473114396194d18a2cc869c08fb5551",
    },
  },
  timestamp: "2026-06-12T07:28:09-03:00",
  event_label: "Pedido pago",
} as const;
