import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { LocaleProvider } from "@/components/LocaleProvider";
import { PwaPromptHost } from "@/components/pwa/PwaPromptHost";
import { getServerLocale } from "@/i18n/server";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "POWER ON DECODE TOOL",
  description:
    "Ferramentas técnicas automotivas para decode, reset, odômetro e checksum.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Power On Decode",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#10B981",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <LocaleProvider locale={locale}>
          {children}
          <PwaPromptHost />
        </LocaleProvider>
      </body>
    </html>
  );
}
