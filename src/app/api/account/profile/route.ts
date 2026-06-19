import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserAccessList } from "@/lib/accessControl";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const accesses = await getUserAccessList(user.id);
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
      accesses,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
