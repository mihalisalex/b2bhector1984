import { LOCALES, isLocale, type Locale } from "@/i18n/config";

/**
 * The domain ⇄ locale map. This is the spine of the domain-split: from here on, "which
 * locale is this?" and "which host is this?" are two views of the same fact.
 *
 *   hectorfootwear.gr   → el only.       The primary market.
 *   hectorfootwear.com  → en, de, fr.    English unprefixed, German and French prefixed.
 *
 * Two properties are worth stating because the rest of the codebase leans on them:
 *
 *  1. **The mapping locale → host is total and single-valued.** Every locale belongs to
 *     exactly one host. That is what lets `originForLocale` be a pure function, which in
 *     turn lets canonicals, hreflang, JSON-LD and the sitemaps be built without reading
 *     `headers()`. Nothing in the metadata path becomes request-bound, so pages that
 *     prerender today keep prerendering.
 *
 *  2. **The mapping host → locale is NOT single-valued** for .com, which serves three.
 *     So a host gives you a *default* locale plus the set that is reachable there; the
 *     path prefix (on .com only) picks within that set. `defaultLocaleForHost` and
 *     `localesForHost` are therefore separate functions and must not be conflated.
 *
 * Both origins are overridable by env so preview deployments and any future staging
 * hostname can be pointed somewhere real without a code change.
 */

const GR_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN_EL ?? "https://www.hectorfootwear.gr";
const COM_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN_EN ?? "https://www.hectorfootwear.com";

/** Locales served from hectorfootwear.com, in the order the footer switcher lists them. */
const COM_LOCALES: readonly Locale[] = ["en", "de", "fr"];
/** Locales served from hectorfootwear.gr. */
const GR_LOCALES: readonly Locale[] = ["el"];

/**
 * Local development and preview deployments have no .gr/.com to read, so they need an
 * explicit answer. `LOCALE_OVERRIDE` supplies it; `el` is the fallback because Greek is
 * the primary market and the locale most likely to be wrong if nobody looks at it.
 *
 * Note this is read at module scope on purpose — it is a deploy-time constant on Vercel,
 * not something that varies per request.
 */
const OVERRIDE: Locale | null = (() => {
  const raw = process.env.LOCALE_OVERRIDE?.trim().toLowerCase();
  return raw && isLocale(raw) ? raw : null;
})();

/** Strips port and any leading `www.`, lowercases. `null`/empty survive as "". */
function normalizeHost(host: string | null | undefined): string {
  return (host ?? "").toLowerCase().split(":")[0].replace(/^www\./, "");
}

export function isGreekHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host);
  return h === "hectorfootwear.gr" || h.endsWith(".hectorfootwear.gr") || h.endsWith(".gr");
}

export function isInternationalHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host);
  return h === "hectorfootwear.com" || h.endsWith(".hectorfootwear.com") || h.endsWith(".com");
}

/**
 * The locale a bare, unprefixed request to this host should serve.
 *
 * Resolution order, and the order matters:
 *   1. A `<locale>.localhost` hostname — so `el.localhost:3000` and `en.localhost:3000`
 *      exercise this very function during local dev rather than bypassing it. Chrome and
 *      Firefox resolve `*.localhost` to 127.0.0.1 with no hosts-file edit.
 *   2. A real .gr / .com suffix.
 *   3. `LOCALE_OVERRIDE` — for `*.vercel.app` previews and bare `localhost`.
 *   4. `el`. Greek is the default because .gr is the primary market; an unrecognised host
 *      is far more likely to be a preview of the Greek site than of the international one.
 */
export function defaultLocaleForHost(host: string | null | undefined): Locale {
  const h = normalizeHost(host);

  const [maybeLocale, ...rest] = h.split(".");
  if (rest.join(".") === "localhost" && isLocale(maybeLocale)) return maybeLocale;

  if (isGreekHost(h)) return "el";
  if (isInternationalHost(h)) return "en";

  return OVERRIDE ?? "el";
}

/**
 * Every locale reachable on this host. Used by the proxy to decide whether a `/de/...`
 * prefix is legitimate or has to be redirected to the other domain, and by the sitemap
 * to decide what it is allowed to list.
 */
export function localesForHost(host: string | null | undefined): readonly Locale[] {
  return defaultLocaleForHost(host) === "el" ? GR_LOCALES : COM_LOCALES;
}

/** The origin (scheme + host, no trailing slash) that serves this locale. */
export function originForLocale(locale: Locale): string {
  return locale === "el" ? GR_ORIGIN : COM_ORIGIN;
}

/**
 * Absolute URL for a locale's copy of a logical path.
 *
 * The locale prefix rule is per-domain, not global: `el` is unprefixed because it is the
 * only locale on .gr, and `en` is unprefixed because it is .com's default. `de`/`fr` are
 * prefixed. This replaces the old single-domain `withLocale`, whose "default locale is
 * never shown" rule assumed one site with one default.
 */
export function urlForLocale(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const origin = originForLocale(locale);
  const prefixed = locale === "el" || locale === "en" ? normalized : `/${locale}${normalized === "/" ? "" : normalized}`;
  return `${origin}${prefixed === "/" ? "/" : prefixed.replace(/\/$/, "")}`;
}

/** Path-only form of {@link urlForLocale} — what an `href` on the same domain needs. */
export function pathForLocale(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === "el" || locale === "en") return normalized;
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

export { LOCALES, isLocale };
export type { Locale };
