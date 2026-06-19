import { NextResponse } from "next/server";
import { processAccessExpirationNotifications } from "@/lib/accessExpirationJob";

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace("Bearer ", "");

  if (!cronSecret || providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const result = await processAccessExpirationNotifications();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
