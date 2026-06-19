"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ToolCategoryInfo, ManufacturerInfo } from "@/types";
import { useI18n } from "@/components/LocaleProvider";

interface ShopFiltersProps {
  categories: ToolCategoryInfo[];
  manufacturers: ManufacturerInfo[];
  currentCategory?: string;
  currentManufacturer?: string;
}

export function ShopFilters({
  categories,
  manufacturers,
  currentCategory,
  currentManufacturer,
}: ShopFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/shop?${params.toString()}`);
  }

  return (
    <div className="card flex flex-wrap gap-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-ink-muted">
          {t.shop.filterCategory}
        </label>
        <select
          className="input-field min-w-[160px]"
          value={currentCategory ?? "all"}
          onChange={(e) => updateFilter("category", e.target.value)}
        >
          <option value="all">{t.shop.filterAll}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {t.categories[c.slug as keyof typeof t.categories] ?? c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-ink-muted">
          {t.shop.filterManufacturer}
        </label>
        <select
          className="input-field min-w-[160px]"
          value={currentManufacturer ?? "all"}
          onChange={(e) => updateFilter("manufacturer", e.target.value)}
        >
          <option value="all">{t.common.allBrands}</option>
          {manufacturers.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
