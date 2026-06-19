"use client";

import { useI18n } from "@/components/LocaleProvider";
import type { Locale } from "@/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  function handleChange(next: Locale) {
    void setLocale(next);
  }

  return (
    <div
      className="flex w-[72px] shrink-0 items-center justify-center rounded-lg border border-divider bg-surface p-0.5 text-xs font-semibold"
      aria-label="Seletor de idioma"
    >
      <button
        type="button"
        onClick={() => handleChange("pt-BR")}
        className={`w-8 rounded-md py-1.5 text-center transition ${
          locale === "pt-BR"
            ? "bg-brand text-white"
            : "text-ink-muted hover:text-ink"
        }`}
        aria-label="Português"
        aria-pressed={locale === "pt-BR"}
      >
        PT
      </button>
      <button
        type="button"
        onClick={() => handleChange("es")}
        className={`w-8 rounded-md py-1.5 text-center transition ${
          locale === "es"
            ? "bg-brand text-white"
            : "text-ink-muted hover:text-ink"
        }`}
        aria-label="Español"
        aria-pressed={locale === "es"}
      >
        ES
      </button>
    </div>
  );
}
