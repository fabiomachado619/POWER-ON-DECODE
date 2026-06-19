import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import { requireAdminUser } from "@/lib/adminAuth";
import { saveManufacturerLogo } from "@/lib/imageUpload";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

const updateSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdminUser();
    const manufacturers = await prisma.manufacturer.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ manufacturers });
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

    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug.toLowerCase(),
      },
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: "manufacturer.create",
      targetType: "manufacturer",
      targetId: manufacturer.id,
    });

    return NextResponse.json({ success: true, manufacturer });
  } catch {
    return NextResponse.json({ error: "Erro ao criar montadora." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminUser();
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const id = String(formData.get("id") ?? "");
      const file = formData.get("logo") as File | null;
      if (!id || !file) {
        return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
      }
      const logoUrl = await saveManufacturerLogo(file);
      await prisma.manufacturer.update({ where: { id }, data: { logoUrl } });
      await logAdminAction({
        adminUserId: admin.id,
        action: "manufacturer.upload_logo",
        targetType: "manufacturer",
        targetId: id,
      });
      return NextResponse.json({ success: true, logoUrl });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const { id, ...data } = parsed.data;
    await prisma.manufacturer.update({ where: { id }, data });

    await logAdminAction({
      adminUserId: admin.id,
      action: "manufacturer.update",
      targetType: "manufacturer",
      targetId: id,
      metadata: data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
