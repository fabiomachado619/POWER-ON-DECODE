import { ptBR, type Dictionary } from "./pt-BR";
import { es } from "./es";

export type Locale = "pt-BR" | "es";

export const DEFAULT_LOCALE: Locale = "pt-BR";
export const LOCALE_COOKIE = "podt_locale";

const dictionaries: Record<Locale, Dictionary> = {
  "pt-BR": ptBR,
  es,
};

export function parseLocale(value: string | undefined | null): Locale {
  if (value === "es") return "es";
  return "pt-BR";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function interpolate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? `{${key}}`)
  );
}

export type { Dictionary } from "./pt-BR";
export { ptBR, es };
