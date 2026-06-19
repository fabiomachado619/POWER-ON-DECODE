"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  getDictionary,
  interpolate,
  type Dictionary,
  type Locale,
} from "@/i18n";

interface I18nContextValue {
  locale: Locale;
  t: Dictionary;
  tr: (template: string, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => Promise<void>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const t = useMemo(() => getDictionary(locale), [locale]);

  const tr = useCallback(
    (template: string, vars?: Record<string, string | number>) =>
      vars ? interpolate(template, vars) : template,
    []
  );

  const setLocale = useCallback(async (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: nextLocale }),
    });
    window.location.reload();
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, t, tr, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: DEFAULT_LOCALE,
      t: getDictionary(DEFAULT_LOCALE),
      tr: (template, vars) =>
        vars ? interpolate(template, vars) : template,
      setLocale: async () => {},
    };
  }
  return context;
}
