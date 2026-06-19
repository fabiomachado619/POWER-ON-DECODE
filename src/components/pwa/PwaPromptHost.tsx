"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { InstallPwaPrompt } from "@/components/pwa/InstallPwaPrompt";

const ALLOWED_PREFIXES = ["/dashboard", "/account", "/shop", "/tools", "/categories", "/modules"];

function isAllowedPath(pathname: string): boolean {
  if (pathname.startsWith("/login")) return false;
  if (pathname.startsWith("/admin")) return false;
  return ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function PwaPromptHost() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  if (!isAllowedPath(pathname)) return null;

  return <InstallPwaPrompt />;
}
