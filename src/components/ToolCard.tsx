"use client";

import Link from "next/link";
import type { ToolCatalogItem } from "@/types";
import { useI18n } from "@/components/LocaleProvider";

function CoverPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-muted to-canvas">
      <span className="text-4xl font-black text-brand-dark/40">{initials}</span>
    </div>
  );
}

function LockOverlayIcon() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 ring-2 ring-white/30 backdrop-blur-sm">
        <svg
          className="h-7 w-7 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5M4.5 10.5h15v9.75h-15V10.5z"
          />
        </svg>
      </div>
    </div>
  );
}

function daysUntil(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const ms = new Date(isoDate).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

interface ToolCardProps {
  tool: ToolCatalogItem;
  variant?: "horizontal" | "grid";
}

export function ToolCard({ tool, variant = "horizontal" }: ToolCardProps) {
  const { t, tr, locale } = useI18n();
  const locked = !tool.hasAccess && !tool.isExpired;
  const expired = tool.isExpired;
  const unlocked = tool.hasAccess;
  const comingSoon =
    !tool.registryImplemented || tool.registryMissing || !tool.isImplemented;
  const canOpen = unlocked && !comingSoon && tool.toolRoute;
  const daysLeft = daysUntil(tool.expiresAt);
  const nearExpiry = unlocked && daysLeft !== null && daysLeft <= 30;
  const widthClass =
    variant === "horizontal" ? "min-w-[280px] max-w-[280px]" : "w-full";
  const displayTitle = tool.displayName || tool.name;
  const dateLocale = locale === "es" ? "es-ES" : "pt-BR";
  const categoryLabel =
    t.categories[tool.category.slug as keyof typeof t.categories] ??
    tool.category.name;

  const imageClass = unlocked
    ? "h-full w-full object-cover"
    : expired
      ? "h-full w-full object-cover opacity-50"
      : "h-full w-full object-cover opacity-60 grayscale";

  return (
    <article
      className={`card card-hover relative flex h-full flex-col overflow-hidden p-0 ${widthClass} ${
        locked ? "border-divider" : unlocked ? "border-brand/20" : "border-orange-200"
      }`}
    >
      <div className="relative h-[150px] w-full shrink-0 overflow-hidden rounded-t-2xl">
        {tool.coverImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tool.coverImageUrl}
              alt={displayTitle}
              className={imageClass}
            />
            {locked && (
              <>
                <div className="card-cover-overlay" />
                <LockOverlayIcon />
              </>
            )}
            {expired && <div className="absolute inset-0 bg-orange-950/10" />}
          </>
        ) : (
          <CoverPlaceholder name={tool.manufacturer.name} />
        )}

        <div className="absolute right-3 top-3">
          {unlocked ? (
            <span className="badge-unlocked">{t.card.unlocked}</span>
          ) : expired ? (
            <span className="badge-expired">{t.card.expired}</span>
          ) : (
            <span className="badge-blocked">{t.card.blocked}</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-dark">
          {tool.manufacturer.name}
        </p>
        <h3 className="mt-1 text-base font-bold leading-snug text-ink">
          {displayTitle}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-ink-muted">
          {tool.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="tag">{categoryLabel}</span>
          {tool.eepromType && <span className="tag">{tool.eepromType}</span>}
        </div>

        {tool.expiresAt && (unlocked || expired) && (
          <p className="mt-2 text-xs text-ink-muted">
            {expired
              ? t.card.accessExpired
              : tr(t.card.validUntil, {
                  date: new Date(tool.expiresAt).toLocaleDateString(dateLocale),
                })}
          </p>
        )}

        <div className="mt-auto pt-4">
          {canOpen ? (
          <Link href={tool.toolRoute!} className="btn-primary w-full">
            {t.card.openTool}
          </Link>
          ) : expired || nearExpiry ? (
            tool.purchaseUrl ? (
              <a
                href={tool.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-renew w-full"
              >
                {t.card.renewAccess}
              </a>
            ) : (
              <button disabled className="btn-secondary w-full">
                {t.common.soon}
              </button>
            )
          ) : locked ? (
            tool.purchaseUrl ? (
              <a
                href={tool.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full"
              >
                {t.card.buyAccess}
              </a>
            ) : (
              <button disabled className="btn-secondary w-full">
                {t.common.soon}
              </button>
            )
          ) : (
            <button disabled className="btn-secondary w-full">
              {t.common.soon}
            </button>
          )}
        </div>

        {expired && (
          <p className="mt-3 text-xs text-orange-700">{t.card.expiredMessage}</p>
        )}
      </div>
    </article>
  );
}
