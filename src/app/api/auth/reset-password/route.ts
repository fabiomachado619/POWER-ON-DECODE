import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: parsed.data.token },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() < Date.now()
    ) {
      return NextResponse.json(
        { error: "Token inválido ou expirado." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: await hashPassword(parsed.data.password) },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
