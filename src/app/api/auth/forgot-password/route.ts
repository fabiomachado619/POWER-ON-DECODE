import { NextResponse } from "next/server";
import { z } from "zod";
import { PASSWORD_RESET_EXPIRY_HOURS } from "@/lib/constants";
import { sendPasswordResetEmail } from "@/lib/emailService";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      const appUrl = process.env.APP_URL ?? "http://localhost:3000";
      await sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        resetUrl: `${appUrl}/reset-password/${token}`,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.",
    });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
