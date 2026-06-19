import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import { requireAdminUser } from "@/lib/adminAuth";
import { saveToolCoverImage } from "@/lib/imageUpload";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  id: z.string(),
  categoryId: z.string().optional(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  purchaseUrl: z.string().optional(),
  buttonText: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  featured: z.boolean().optional(),
  visible: z.boolean().optional(),
  showInStore: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdminUser();
    const tools = await prisma.tool.findMany({
      include: { manufacturer: true, module: true, category: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ tools });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminUser();
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const id = String(formData.get("id") ?? "");
      const file = formData.get("coverImage") as File | null;
      if (!id || !file) {
        return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
      }
      const coverImageUrl = await saveToolCoverImage(file);
      await prisma.tool.update({
        where: { id },
        data: { coverImageUrl },
      });
      await logAdminAction({
        adminUserId: admin.id,
        action: "tool.upload_cover",
        targetType: "tool",
        targetId: id,
      });
      return NextResponse.json({ success: true, coverImageUrl });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const { id, ...raw } = parsed.data;
    const data = {
      ...raw,
      ...(raw.purchaseUrl !== undefined
        ? { purchaseUrl: raw.purchaseUrl.trim() || null }
        : {}),
      ...(raw.buttonText !== undefined
        ? { buttonText: raw.buttonText.trim() || null }
        : {}),
      ...(raw.displayName !== undefined
        ? { displayName: raw.displayName.trim() || null }
        : {}),
    };

    await prisma.tool.update({ where: { id }, data });

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/catalog");

    await logAdminAction({
      adminUserId: admin.id,
      action: "tool.update_showcase",
      targetType: "tool",
      targetId: id,
      metadata: data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
