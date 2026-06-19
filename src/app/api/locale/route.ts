import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale } from "@/i18n";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const locale = parseLocale(body.locale);

    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE, locale, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({ success: true, locale });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar idioma." }, { status: 400 });
  }
}
