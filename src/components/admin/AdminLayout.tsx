"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/LocaleProvider";
import { isSuperAdminRole } from "@/lib/roles";
import type { SessionUser } from "@/types";

type NavItem = {
  href: string;
  label: string;
  superAdminOnly?: boolean;
};

export function AdminLayout({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const isSuperAdmin = isSuperAdminRole(user.role);

  const navItems: NavItem[] = [
    { href: "/admin", label: t.admin.dashboard },
    { href: "/admin/users", label: t.admin.users },
    { href: "/admin/access", label: t.admin.access },
    { href: "/admin/tools", label: t.admin.showcase },
    { href: "/admin/product-mappings", label: t.admin.productMappings },
    { href: "/admin/categories", label: t.admin.categories },
    { href: "/admin/manufacturers", label: t.admin.manufacturers },
    { href: "/admin/email-marketing", label: t.admin.emailMarketing },
    { href: "/admin/pwa-settings", label: t.admin.pwaSettings },
    { href: "/admin/webhooks", label: t.admin.webhooks },
    { href: "/admin/administrators", label: t.admin.administrators, superAdminOnly: true },
    { href: "/admin/email-settings", label: t.admin.smtp, superAdminOnly: true },
    { href: "/admin/email-templates", label: t.admin.templates, superAdminOnly: true },
    { href: "/admin/decode-logs", label: t.admin.decodeLogs },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-divider bg-surface shadow-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <div>
            <p className="text-lg font-black text-ink">
              POWER ON <span className="text-brand">DECODE</span>{" "}
              <span className="text-sm font-semibold text-brand-dark">Admin</span>
            </p>
            <p className="text-xs text-ink-muted">
              {t.admin.panel}
              {isSuperAdmin ? " · Super Admin" : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <LanguageSwitcher />
            <Link href="/dashboard" className="btn-ghost text-sm">
              {t.admin.viewClientArea}
            </Link>
            <span className="hidden text-sm text-ink-muted md:inline">{user.email}</span>
            <button onClick={handleLogout} className="btn-secondary">
              {t.nav.logout}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        <aside className="card h-fit w-full shrink-0 lg:w-64">
          <nav className="flex flex-col gap-1">
            {visibleNavItems.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-brand-muted text-brand-dark"
                      : "text-ink-muted hover:bg-canvas hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
