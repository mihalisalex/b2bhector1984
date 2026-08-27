import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { recordRedirectHit, resolveRedirect } from "@/lib/redirectEngine";
// Safe to import here, unlike session.ts below: seoRoutes.ts is pure data plus pure
// functions with zero imports of its own, so it can't drag anything edge-incompatible into
// this bundle. It is also the declared single source of truth for which routes are gated —
// this file used to keep its own copy of that list, and the two had already drifted
// (`/linesheet` was gated there but not here).
import { isGatedPath } from "@/lib/seoRoutes";
// Import-safe for the same reason: config.ts is constants and a type guard with no imports,
// and domains.ts adds only pure string functions over it.
import { LOCALES, type Locale } from "@/i18n/config";
import { defaultLocaleForHost, localesForHost, originForLocale } from "@/i18n/domains";

// Kept as a literal: session.ts pulls in `next/headers`, which is unusable here. Must stay
// in sync with SESSION_COOKIE in session.ts.
const SESSION_COOKIE = "hector_session";

function matchLocalePrefix(pathname: string): Locale | null {
  const first = pathname.split("/")[1];
  return (LOCALES as readonly string[]).includes(first) ? (first as Locale) : null;
}

/**
 * Locale is resolved from the HOST, not the path.
 *
 *   hectorfootwear.gr   -> el.            The primary market. No prefix, ever.
 *   hectorfootwear.com  -> en, de, fr.    English unprefixed; German and French prefixed.
 *
 * The route tree still lives under `app/[lang]/...`, so a request is REWRITTEN to carry the
 * locale internally — invisible to the browser and to Google. `/catalogue` on .gr is served
 * by `/el/catalogue` and stays `/catalogue` in the address bar.
 *
 * Why this shape rather than keeping locale in the URL: under path routing every page had
 * to remember to read its own `lang` param, and four of them didn't — the journal, the
 * product page, the dashboard and the account page all silently ignored their locale
 * segment and rendered English inside a Greek site. Making locale a property of the request
 * removes the opportunity for that class of bug entirely.
 *
 * There is deliberately NO geo/IP detection and no cookie-based redirect. A visitor who
 * types a URL gets that URL's language. The only way to change language is the explicit
 * switcher, which links to the same page on the other domain. The previous cookie redirect
 * has been removed: it made the same URL serve different languages to different people,
 * which is precisely what breaks both caching and search indexing.
 *
 * `/admin` is excluded from all of it — English-only, never prefixed, never rewritten.
 */
export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname, search } = request.nextUrl;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  // Behind Vercel's proxy `x-forwarded-host` carries the domain the visitor actually typed;
  // `host` can be the internal deployment host.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const hostLocale = defaultLocaleForHost(host);
  const allowedHere = localesForHost(host);

  let locale: Locale = hostLocale;
  let logicalPath = pathname;
  let hadPrefix = false;

  if (!isAdmin) {
    const prefix = matchLocalePrefix(pathname);

    if (prefix) {
      const rest = pathname.slice(`/${prefix}`.length) || "/";

      if (!allowedHere.includes(prefix)) {
        // This locale lives on the OTHER domain. Send it there, once, permanently.
        // e.g. hectorfootwear.gr/de/catalogue -> hectorfootwear.com/de/catalogue
        //      hectorfootwear.com/el/catalogue -> hectorfootwear.gr/catalogue
        const targetOrigin = originForLocale(prefix);
        // `defaultLocaleForHost` takes a HOST, not an origin — handed the full
        // "https://www.hectorfootwear.com" it parses the scheme as the hostname and falls
        // through to its default, which sent /en/faq to .com/en/faq instead of .com/faq.
        const targetIsDefaultThere = prefix === defaultLocaleForHost(new URL(targetOrigin).host);
        const targetPath = targetIsDefaultThere ? rest : `/${prefix}${rest === "/" ? "" : rest}`;
        return NextResponse.redirect(`${targetOrigin}${targetPath}${search}`, 301);
      }

      if (prefix === hostLocale) {
        // The host's own default locale must never also appear as a prefix, or every page
        // has a live duplicate. `/el/catalogue` on .gr -> `/catalogue`.
        return NextResponse.redirect(new URL(`${rest}${search}`, request.url), 301);
      }

      // A legitimately prefixed locale for this host (de/fr on .com).
      locale = prefix;
      logicalPath = rest;
      hadPrefix = true;
    } else {
      locale = hostLocale;
      logicalPath = pathname;
    }
  }

  // ---- 1. Admin-managed redirects -----------------------------------------
  // Checked before the auth gate on purpose: a retired product URL should send the visitor
  // (and Googlebot) to its replacement with a real redirect, not bounce them to /login where
  // the redirect is invisible to a crawler. The engine fails open, so a redirect-table
  // outage can never take the site down. Rules are keyed on the locale-stripped path, so
  // nothing in `seo_redirects` changes for this feature.
  const redirect = await resolveRedirect(logicalPath);
  if (redirect) {
    let destination: URL | string;
    if (/^https?:\/\//i.test(redirect.destination)) {
      destination = new URL(redirect.destination);
    } else {
      const prefixed = !isAdmin && hadPrefix ? `/${locale}${redirect.destination}` : redirect.destination;
      destination = new URL(`${prefixed}${search}`, request.url);
    }
    // `waitUntil` keeps the instance alive for the counter without the visitor waiting on it.
    event.waitUntil(recordRedirectHit(redirect.ruleId));
    return NextResponse.redirect(destination, redirect.statusCode);
  }

  // ---- 2. Auth gate ----------------------------------------------------------
  if (isGatedPath(logicalPath) && !request.cookies.has(SESSION_COOKIE)) {
    const loginPath = !isAdmin && hadPrefix ? `/${locale}/login` : "/login";
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // ---- 3. Rewrite the locale into the route tree ------------------------------
  // Always, for every non-admin request — including the prefixed de/fr ones, whose prefix
  // already matches the segment the router wants. Rewriting unconditionally means the
  // `[lang]` segment is populated the same way on every path through this function.
  if (!isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = logicalPath === "/" ? `/${locale}` : `/${locale}${logicalPath}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Broadened from the gated-routes-only list so the redirect manager can retire *any* URL,
  // not just ones behind the login. Static assets, image optimisation, API routes and the
  // SEO metadata files are excluded — a redirect rule must never be able to shadow
  // robots.txt or the sitemap, and locale routing has no business touching them.
  //
  // Note the trap this exclusion list exists to avoid: anything NOT listed here gets the
  // locale rewrite applied, so a file dropped at the public root (say /brochure.pdf) is
  // rewritten to /el/brochure.pdf and 404s. Put new static files under /images or /fonts,
  // or add them here.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|llms.txt|images/|fonts/).*)",
  ],
};
