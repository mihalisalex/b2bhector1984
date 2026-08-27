import { DEFAULT_LOCALE, LOCALES, type Locale, isLocale } from "@/i18n/config";
import { pathForLocale } from "@/i18n/domains";

/**
 * Prefixes a site-relative path with its locale segment, where the domain split calls for
 * one. Absolute URLs (an admin-entered `mailto:`/`https://` CTA href) pass through
 * untouched — only genuine site-relative paths are ever prefixed.
 *
 * THE RULE CHANGED WITH THE DOMAIN SPLIT, and this is the single place it is expressed.
 *
 * It used to be "everything except the default locale gets a prefix", with English as the
 * one default — so Greek was `/el/faq`. Now el is the ONLY locale on hectorfootwear.gr and
 * en is the default on hectorfootwear.com, so both are unprefixed and only de/fr carry a
 * segment. Left unchanged, every internal link on the Greek site pointed at `/el/...`,
 * which the proxy then 301s to `/...` — a redirect hop on every click and every crawl of
 * ~27 files' worth of links.
 *
 * Delegates to `pathForLocale` rather than restating the rule, so the prefix logic lives in
 * exactly one file alongside the host mapping it belongs to.
 */
export function withLocale(locale: Locale, path: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
  return pathForLocale(locale, path);
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
