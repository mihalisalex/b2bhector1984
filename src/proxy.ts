import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { recordRedirectHit, resolveRedirect } from "@/lib/redirectEngine";
// Safe to import here, unlike session.ts/i18n/config.ts below: seoRoutes.ts is pure data
// plus pure functions with zero imports of its own, so it can't drag anything
// edge-incompatible into this bundle. It is also the declared single source of truth for
// which routes are gated — this file used to keep its own copy of that list, and the two
// had already drifted (`/linesheet` was gated there but not here), which is the exact
// failure seoRoutes.ts was introduced to stop.
import { isGatedPath } from "@/lib/seoRoutes";
// Also import-safe for the same reason: i18n/config.ts is constants and a type guard with
// no imports at all. Deriving the list here means adding a locale to that one file is
// enough — the hard-coded copy this replaced would have left any new locale silently
// unroutable in the middleware while the rest of the app happily served it.
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/config";

// Kept as literals: session.ts pulls in `next/headers` (unusable here), and
// i18n/localeCookie.ts carries a `document`-touching helper that has no business in an
// edge bundle. Must stay in sync with SESSION_COOKIE in session.ts and LOCALE_COOKIE in
// i18n/localeCookie.ts.
const SESSION_COOKIE = "hector_session";
const LOCALE_COOKIE = "hector_locale";

const NON_DEFAULT_LOCALES: readonly string[] = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

function matchLocalePrefix(pathname: string): Locale | null {
  const first = pathname.split("/")[1];
  return NON_DEFAULT_LOCALES.includes(first) ? (first as Locale) : null;
}

/**
 * Locale routing, layered on top of the existing admin-redirect + auth-gate logic.
 *
 * English is the default locale and deliberately never shown in the URL (`/catalogue`,
 * not `/en/catalogue`) — least disruptive to the site's existing indexed URLs. German,
 * French and Greek are always prefixed (`/de/...`, `/fr/...`, `/el/...`). Since the actual
 * route tree lives under `app/[lang]/...`, an unprefixed request still needs `lang=en`
 * under the hood — handled with a `rewrite` (invisible to the browser), not a redirect.
 *
 * `/admin` is completely excluded from all of this: it never gets a locale prefix, is
 * never rewritten, and its own redirect/gating behavior is untouched from before this
 * feature existed.
 */
export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname, search } = request.nextUrl;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  let locale = "en";
  let logicalPath = pathname;
  let hadPrefix = false;

  if (!isAdmin) {
    const prefixLocale = matchLocalePrefix(pathname);
    if (prefixLocale) {
      locale = prefixLocale;
      hadPrefix = true;
      const rest = pathname.slice(`/${prefixLocale}`.length);
      logicalPath = rest === "" ? "/" : rest;
    } else if (pathname === "/en" || pathname.startsWith("/en/")) {
      // Canonicalize away the default locale's own prefix — `/en/x` and `/x` must never
      // both be live, or every storefront page would have a live duplicate.
      const target = pathname === "/en" ? "/" : pathname.slice(3);
      return NextResponse.redirect(new URL(`${target}${search}`, request.url), 308);
    } else {
      // No prefix in the URL — default to English, unless a remembered choice says
      // otherwise, in which case redirect (not rewrite) so the address bar reflects it.
      const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
      if (cookieLocale && NON_DEFAULT_LOCALES.includes(cookieLocale)) {
        const target = pathname === "/" ? `/${cookieLocale}` : `/${cookieLocale}${pathname}`;
        return NextResponse.redirect(new URL(`${target}${search}`, request.url), 307);
      }
      locale = "en";
      logicalPath = pathname;
    }
  }

  // ---- 1. Admin-managed redirects -----------------------------------------
  // Checked before the auth gate on purpose: a retired product URL should send the
  // visitor (and Googlebot) to its replacement with a real redirect, not bounce them to
  // /login where the redirect is invisible to a crawler. The engine fails open, so a
  // redirect-table outage can never take the site down. Rules are keyed on the
  // locale-stripped path, so nothing in `seo_redirects` needs to change for this feature.
  const redirect = await resolveRedirect(logicalPath);
  if (redirect) {
    let destination: URL;
    if (/^https?:\/\//i.test(redirect.destination)) {
      destination = new URL(redirect.destination);
    } else {
      const prefixed = !isAdmin && locale !== "en" ? `/${locale}${redirect.destination}` : redirect.destination;
      destination = new URL(`${prefixed}${search}`, request.url);
    }
    // `waitUntil` keeps the instance alive for the counter without the visitor waiting on it.
    event.waitUntil(recordRedirectHit(redirect.ruleId));
    return NextResponse.redirect(destination, redirect.statusCode);
  }

  // ---- 2. Auth gate ----------------------------------------------------------
  if (isGatedPath(logicalPath) && !request.cookies.has(SESSION_COOKIE)) {
    const loginPath = !isAdmin && locale !== "en" ? `/${locale}/login` : "/login";
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // ---- 3. Default-locale rewrite ----------------------------------------------
  if (!isAdmin && !hadPrefix) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Broadened from the gated-routes-only list so the redirect manager can retire *any*
  // URL, not just ones behind the login. Static assets, image optimisation, API routes
  // and the SEO metadata files are excluded — a redirect rule must never be able to
  // shadow robots.txt or the sitemap, and locale routing has no business touching them.
  // `llms.txt` belongs to that same set: it lives at the site root, not under a locale
  // prefix, and without the exclusion the locale rewrite turns it into /en/llms.txt and
  // it 404s.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|llms.txt|images/|fonts/).*)",
  ],
};
