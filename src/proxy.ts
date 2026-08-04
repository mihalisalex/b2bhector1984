import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { recordRedirectHit, resolveRedirect } from "@/lib/redirectEngine";

// Kept as literals (not imported from src/lib/session.ts or src/i18n/config.ts) — those
// modules either pull in `next/headers` (unusable in proxy) or exist for app code, and
// this file must be able to reason about locales/session with zero risk of an unrelated
// import dragging something edge-incompatible along with it. Must stay in sync with
// SESSION_COOKIE in session.ts and the locale list in i18n/config.ts.
const SESSION_COOKIE = "hector_session";
const LOCALE_COOKIE = "hector_locale";
const NON_DEFAULT_LOCALES = ["de", "fr", "el"] as const;
type NonDefaultLocale = (typeof NON_DEFAULT_LOCALES)[number];

const GATED_PREFIXES = [
  "/catalogue",
  "/quick-order",
  "/cart",
  "/checkout",
  "/product",
  "/dashboard",
  "/admin",
];

function isGated(pathname: string): boolean {
  return GATED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function matchLocalePrefix(pathname: string): NonDefaultLocale | null {
  const first = pathname.split("/")[1];
  return (NON_DEFAULT_LOCALES as readonly string[]).includes(first) ? (first as NonDefaultLocale) : null;
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
      if (cookieLocale && (NON_DEFAULT_LOCALES as readonly string[]).includes(cookieLocale)) {
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
  if (isGated(logicalPath) && !request.cookies.has(SESSION_COOKIE)) {
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
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|images/|fonts/).*)",
  ],
};
