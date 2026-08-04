import "server-only";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("@/i18n/dictionaries/en").then((m) => m.default),
  de: () => import("@/i18n/dictionaries/de").then((m) => m.default),
  fr: () => import("@/i18n/dictionaries/fr").then((m) => m.default),
  el: () => import("@/i18n/dictionaries/el").then((m) => m.default),
};

/**
 * Server-only: loads only the requested locale's dictionary, not all four.
 *
 * Falls back to English rather than trusting the type. `[lang]` reaches here as a raw
 * `string` cast to `Locale` (the route layouts have to type it that way to satisfy Next's
 * generated route validator), so nothing actually stops an unexpected value at runtime —
 * and an unindexed lookup here throws `loaders[locale] is not a function` from the root
 * layout, which takes down every page on the site rather than one. A wrong-but-rendered
 * English page is the better failure, and matches how the rest of this codebase degrades.
 */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const safe = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return loaders[safe]();
}
