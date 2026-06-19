import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import { requireAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(1),
  icon: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
});

const updateSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdminUser();
    const categories = await prisma.toolCategory.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { tools: true } } },
    });
    return NextResponse.json({ categories });
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

    const category = await prisma.toolCategory.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug.toLowerCase(),
        description: parsed.data.description,
        icon: parsed.data.icon,
        displayOrder: parsed.data.displayOrder ?? 0,
      },
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: "category.create",
      targetType: "tool_category",
      targetId: category.id,
    });

    return NextResponse.json({ success: true, category });
  } catch {
    return NextResponse.json({ error: "Erro ao criar categoria." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminUser();
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const { id, ...data } = parsed.data;
    if (data.slug) data.slug = data.slug.toLowerCase();

    await prisma.toolCategory.update({ where: { id }, data });

    await logAdminAction({
      adminUserId: admin.id,
      action: "category.update",
      targetType: "tool_category",
      targetId: id,
      metadata: data,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 });
  }
}
