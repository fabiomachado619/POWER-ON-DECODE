"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/LocaleProvider";
import { canAccessAdminArea } from "@/lib/roles";
import type { SessionUser } from "@/types";

export function PublicHeader({ user }: { user: SessionUser | null }) {
  const { t } = useI18n();

  const primaryHref = user
    ? canAccessAdminArea(user.role)
      ? "/admin"
      : "/dashboard"
    : "/login";

  const primaryLabel = user ? t.home.goToMyArea : t.home.accessNow;

  return (
    <header className="border-b border-divider bg-surface shadow-header">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <Link href="/" className="shrink-0">
          <p className="text-lg font-black text-ink">
            POWER ON <span className="text-brand">DECODE</span>
          </p>
          <p className="text-xs text-ink-muted">{t.nav.tagline}</p>
        </Link>

        <div className="flex shrink-0 items-center gap-4">
          <LanguageSwitcher />
          <Link href={primaryHref} className="btn-primary text-sm">
            {primaryLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
