import { NextResponse } from "next/server";
import { getPwaSettings } from "@/lib/pwaSettings";

export async function GET() {
  const settings = await getPwaSettings();

  const manifest = {
    name: settings.appName,
    short_name: settings.shortName,
    description: settings.description,
    start_url: "/dashboard",
    display: "standalone",
    background_color: settings.backgroundColor,
    theme_color: settings.themeColor,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=60",
    },
  });
}
