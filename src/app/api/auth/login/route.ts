import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/roles";

const loginSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(1, "Senha obrigatória."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email ou senha incorretos." },
        { status: 401 }
      );
    }

    const validPassword = await verifyPassword(
      parsed.data.password,
      user.passwordHash
    );

    if (!validPassword) {
      return NextResponse.json(
        { error: "Email ou senha incorretos." },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
    };

    const token = await createSessionToken(sessionUser);
    await setSessionCookie(token);

    return NextResponse.json({ user: sessionUser });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao processar login." },
      { status: 500 }
    );
  }
}
