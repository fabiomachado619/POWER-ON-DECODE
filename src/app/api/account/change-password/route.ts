import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "Nova senha deve ter ao menos 6 caracteres."),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const valid = await verifyPassword(
      parsed.data.currentPassword,
      dbUser.passwordHash
    );
    if (!valid) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
