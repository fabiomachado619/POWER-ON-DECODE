"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/LocaleProvider";
import { canAccessAdminArea } from "@/lib/roles";
import type { SessionUser } from "@/types";

interface AppHeaderProps {
  user: SessionUser;
  unlockedCount?: number;
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  );
}

export function AppHeader({ user, unlockedCount = 0 }: AppHeaderProps) {
  const pathname = usePathname();
  const { t, tr } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: t.nav.myTools },
    { href: "/categories/decode", label: t.nav.decode },
    { href: "/categories/reset", label: t.nav.reset },
    { href: "/categories/odometro", label: t.nav.odometro },
    { href: "/categories/checksum", label: t.nav.checksum },
    { href: "/shop", label: t.nav.shop },
    { href: "/catalog", label: t.nav.catalog },
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href.startsWith("/categories/")) return pathname.startsWith(href);
    return pathname.startsWith(href);
  }

  function navLinkClass(active: boolean, compact = false) {
    const size = compact
      ? "whitespace-nowrap rounded-lg px-1.5 py-2 text-xs font-medium xl:px-2.5 xl:text-sm 2xl:px-3"
      : "block rounded-lg px-4 py-3 text-sm font-medium";

    return `${size} transition ${
      active
        ? "bg-brand-muted text-brand-dark"
        : "text-ink-muted hover:bg-canvas hover:text-ink"
    }`;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-divider bg-surface shadow-header">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between gap-3 py-3 lg:gap-4 lg:py-4">
          {/* ESQUERDA — logo */}
          <div className="min-w-0 shrink-0">
            <Link href="/dashboard" className="group block">
              <p className="text-base font-black tracking-tight text-ink sm:text-lg">
                POWER ON <span className="text-brand">DECODE</span>
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-ink-muted sm:text-[11px] sm:tracking-[0.15em]">
                {t.nav.tagline}
              </p>
            </Link>
          </div>

          {/* CENTRO — menu principal (tablet/desktop) */}
          <nav
            className="hidden min-w-0 flex-1 items-center justify-center lg:flex lg:flex-nowrap lg:gap-0.5 xl:gap-1 2xl:gap-1.5"
            aria-label="Menu principal"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(isActive(item.href), true)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* DIREITA — idioma, conta, sair */}
          <div className="flex shrink-0 items-center gap-4">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-divider text-ink-muted transition hover:bg-canvas hover:text-ink lg:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-main-nav"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              <MenuIcon open={mobileMenuOpen} />
            </button>

            <LanguageSwitcher />

            {unlockedCount > 0 && (
              <span className="badge-unlocked hidden xl:inline-flex">
                {tr(
                  unlockedCount === 1
                    ? t.card.unlockedCount
                    : t.card.unlockedCountPlural,
                  { count: unlockedCount }
                )}
              </span>
            )}

            {canAccessAdminArea(user.role) && (
              <Link
                href="/admin"
                className="btn-ghost hidden whitespace-nowrap text-sm xl:inline-flex"
              >
                {t.nav.admin}
              </Link>
            )}

            <Link href="/account" className="btn-ghost whitespace-nowrap text-sm">
              {t.nav.myAccount}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="btn-ghost whitespace-nowrap text-sm"
            >
              {t.nav.logout}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE — menu hamburger */}
      {mobileMenuOpen && (
        <nav
          id="mobile-main-nav"
          className="border-t border-divider bg-surface px-4 py-3 lg:hidden"
          aria-label="Menu principal mobile"
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(isActive(item.href))}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
