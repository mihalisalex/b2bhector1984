import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Kept as a literal (not imported from src/lib/session.ts) — that module pulls
// in `next/headers`, which can only be used inside request-scoped Server
// Components/Actions, not proxy. Must stay in sync with SESSION_COOKIE there.
const SESSION_COOKIE = "hector_session";

export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const next = request.nextUrl.pathname + request.nextUrl.search;
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/catalog/:path*",
    "/quick-order/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/product/:path*",
    "/dashboard/:path*",
  ],
};
