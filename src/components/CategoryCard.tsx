"use client";

import Link from "next/link";
import type { CategoryWithStats } from "@/types";
import { useI18n } from "@/components/LocaleProvider";
import { getCategoryDescription, getCategoryLabel } from "@/i18n/helpers";

const DEFAULT_ICONS: Record<string, string> = {
  decode: "🔓",
  reset: "🔄",
  odometro: "📊",
  checksum: "✓",
};

interface CategoryCardProps {
  category: CategoryWithStats;
  variant?: "large" | "compact";
}

export function CategoryCard({ category, variant = "large" }: CategoryCardProps) {
  const { t, tr } = useI18n();
  const icon = category.icon ?? DEFAULT_ICONS[category.slug] ?? "🔧";
  const categoryName = getCategoryLabel(category.slug, t);
  const categoryDesc = getCategoryDescription(category.slug, t);

  if (variant === "compact") {
    return (
      <Link
        href={`/categories/${category.slug}`}
        className="card card-hover flex items-center gap-4"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-muted text-2xl">
          {icon}
        </span>
        <div>
          <h3 className="font-bold text-ink">{categoryName}</h3>
          <p className="text-xs text-ink-muted">
            {tr(
              category.unlockedCount === 1
                ? t.card.unlockedCount
                : t.card.unlockedCountPlural,
              { count: category.unlockedCount }
            )}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <article className="card card-hover flex h-full flex-col">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-muted text-3xl">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-ink">{categoryName}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-muted">
        {categoryDesc}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="badge-unlocked">
          {tr(
            category.unlockedCount === 1
              ? t.card.unlockedCount
              : t.card.unlockedCountPlural,
            { count: category.unlockedCount }
          )}
        </span>
        <span className="badge-locked">
          {tr(t.card.forPurchase, { count: category.shopCount })}
        </span>
      </div>
      <Link
        href={`/categories/${category.slug}`}
        className="btn-primary mt-5 w-full"
      >
        {t.card.viewTools}
      </Link>
    </article>
  );
}
