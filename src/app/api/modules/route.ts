import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserModules } from "@/lib/accessControl";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const modules = await getUserModules(user.id);
  return NextResponse.json({ modules });
}
