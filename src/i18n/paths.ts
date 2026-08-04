import { DEFAULT_LOCALE, LOCALES, type Locale, isLocale } from "@/i18n/config";

/**
 * Prefixes a site-relative path with its locale segment, except the default
 * locale which is deliberately never shown in the URL (see src/proxy.ts).
 * Absolute URLs (e.g. an admin-entered `mailto:`/`https://` CTA href) pass through
 * untouched — only genuine site-relative paths ever get a locale prefix.
 */
export function withLocale(locale: Locale, path: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return normalized;
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

/**
 * Splits a pathname into its locale (defaulting to the site default when no
 * recognized prefix is present) and the locale-stripped "logical" path.
 * Mirrors the prefix detection in src/proxy.ts.
 */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  const [, maybeLocale, ...rest] = pathname.split("/");
  if (maybeLocale && isLocale(maybeLocale)) {
    const path = `/${rest.join("/")}`;
    return { locale: maybeLocale, path: path === "/" ? "/" : path.replace(/\/$/, "") || "/" };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

export { LOCALES, DEFAULT_LOCALE, isLocale };
export type { Locale };
