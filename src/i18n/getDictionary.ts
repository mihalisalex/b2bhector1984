import "server-only";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("@/i18n/dictionaries/en").then((m) => m.default),
  de: () => import("@/i18n/dictionaries/de").then((m) => m.default),
  fr: () => import("@/i18n/dictionaries/fr").then((m) => m.default),
  el: () => import("@/i18n/dictionaries/el").then((m) => m.default),
};

/** Server-only: loads only the requested locale's dictionary, not all four. */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}
