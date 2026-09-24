export const LOCALES = ["en", "de", "fr", "el"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Each language's name in that language — what a reader looks for in a language link. */
export const LOCALE_NAME: Record<Locale, string> = { en: "English", de: "Deutsch", fr: "Français", el: "Ελληνικά" };

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
