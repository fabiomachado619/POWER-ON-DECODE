import type { Dictionary } from "@/i18n/pt-BR";

type CategorySlug = keyof Dictionary["categories"];

export function getCategoryLabel(
  slug: string,
  t: Dictionary
): string {
  return t.categories[slug as CategorySlug] ?? slug;
}

export function getCategoryDescription(
  slug: string,
  t: Dictionary
): string {
  return t.categoryDescriptions[slug as CategorySlug] ?? "";
}
