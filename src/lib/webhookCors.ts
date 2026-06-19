import { NextResponse } from "next/server";

const WEBHOOK_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function webhookCorsResponse(
  body: Record<string, unknown> | null,
  status: number
) {
  return NextResponse.json(body ?? {}, {
    status,
    headers: WEBHOOK_CORS_HEADERS,
  });
}

export function webhookOptionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: WEBHOOK_CORS_HEADERS,
  });
}
