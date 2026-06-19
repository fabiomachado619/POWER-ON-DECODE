"use client";

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

export function PublicToolCard({ tool }: { tool: ToolCatalogItem }) {
  const { t } = useI18n();
  const displayTitle = tool.displayName || tool.name;
  const categoryLabel =
    t.categories[tool.category.slug as keyof typeof t.categories] ??
    tool.category.name;
  const hasPurchaseUrl = Boolean(tool.purchaseUrl?.trim());

  return (
    <article className="card card-hover flex h-full flex-col overflow-hidden p-0">
      <div className="relative h-[150px] w-full shrink-0 overflow-hidden rounded-t-2xl">
        {tool.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tool.coverImageUrl}
            alt={displayTitle}
            className="h-full w-full object-cover"
          />
        ) : (
          <CoverPlaceholder name={tool.manufacturer.name} />
        )}
        <div className="absolute right-3 top-3">
          <span className="badge-unlocked">{t.home.available}</span>
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
        <div className="mt-3">
          <span className="tag">{categoryLabel}</span>
        </div>
        <div className="mt-auto pt-4">
          {hasPurchaseUrl ? (
            <a
              href={tool.purchaseUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full"
            >
              {t.home.buyAccess}
            </a>
          ) : (
            <button type="button" disabled className="btn-secondary w-full">
              {t.home.comingSoon}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
