import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import { requireAdminUser } from "@/lib/adminAuth";
import { upsertProductMapping } from "@/lib/productMapping";
import { prisma } from "@/lib/prisma";

const mappingSchema = z.object({
  id: z.string().optional(),
  externalProductId: z.string().min(1),
  toolSlug: z.string().min(1),
  active: z.boolean().default(true),
});

export async function GET() {
  try {
    await requireAdminUser();
    const mappings = await prisma.productMapping.findMany({
      orderBy: [{ active: "desc" }, { externalProductId: "asc" }],
    });
    return NextResponse.json({ mappings });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const parsed = mappingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const tool = await prisma.tool.findFirst({
      where: { slug: parsed.data.toolSlug, active: true },
    });
    if (!tool) {
      return NextResponse.json(
        { error: "Ferramenta não encontrada na vitrine." },
        { status: 404 }
      );
    }

    const mapping = await upsertProductMapping(parsed.data);

    await logAdminAction({
      adminUserId: admin.id,
      action: "product_mapping.upsert",
      targetType: "product_mapping",
      targetId: mapping.id,
      metadata: parsed.data,
    });

    return NextResponse.json({ success: true, mapping });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  return POST(request);
}
