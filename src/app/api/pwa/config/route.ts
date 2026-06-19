import { NextResponse } from "next/server";
import { getPwaSettings } from "@/lib/pwaSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getPwaSettings();

  if (!settings.active) {
    return NextResponse.json({ active: false });
  }

  return NextResponse.json({
    active: true,
    appName: settings.appName,
    shortName: settings.shortName,
    description: settings.description,
    themeColor: settings.themeColor,
    promptText: settings.promptText,
  });
}
