import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { recordRedirectHit, resolveRedirect } from "@/lib/redirectEngine";

// Kept as a literal (not imported from src/lib/session.ts) — that module pulls
// in `next/headers`, which can only be used inside request-scoped Server
// Components/Actions, not proxy. Must stay in sync with SESSION_COOKIE there.
const SESSION_COOKIE = "hector_session";

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

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname, search } = request.nextUrl;

  // ---- 1. Admin-managed redirects -----------------------------------------
  // Checked before the auth gate on purpose: a retired product URL should send
  // the visitor (and Googlebot) to its replacement with a real 301, not bounce
  // them to /login where the redirect is invisible to a crawler. The engine
  // fails open, so a redirect-table outage can never take the site down.
  const redirect = await resolveRedirect(pathname);
  if (redirect) {
    const destination = /^https?:\/\//i.test(redirect.destination)
      ? new URL(redirect.destination)
      : new URL(`${redirect.destination}${search}`, request.url);
    // `waitUntil` keeps the instance alive for the counter without the visitor
    // waiting on it.
    event.waitUntil(recordRedirectHit(redirect.ruleId));
    return NextResponse.redirect(destination, redirect.statusCode);
  }

  // ---- 2. Auth gate --------------------------------------------------------
  if (!isGated(pathname)) return NextResponse.next();
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Broadened from the gated-routes-only list so the redirect manager can
  // retire *any* URL, not just ones behind the login. Static assets, image
  // optimisation, API routes and the SEO metadata files are excluded — a
  // redirect rule must never be able to shadow robots.txt or the sitemap.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|images/|fonts/).*)",
  ],
};
