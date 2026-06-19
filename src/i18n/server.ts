import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  getDictionary,
  LOCALE_COOKIE,
  parseLocale,
  type Dictionary,
  type Locale,
} from "@/i18n";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return parseLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE);
}

export async function getServerTranslations(): Promise<{
  locale: Locale;
  t: Dictionary;
}> {
  const locale = await getServerLocale();
  return { locale, t: getDictionary(locale) };
}
