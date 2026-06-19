import { NextResponse } from "next/server";
import { diagnosePublicBaseUrl, getPublicBaseUrl } from "@/lib/publicUrl";

export async function GET() {
  const baseUrl = getPublicBaseUrl();
  const diagnosis = await diagnosePublicBaseUrl(baseUrl);

  return NextResponse.json({
    status: "ok",
    service: "power-on-decode-tool",
    baseUrl,
    dnsResolvable: diagnosis.dnsResolvable,
    warning: diagnosis.warning,
    timestamp: new Date().toISOString(),
  });
}
