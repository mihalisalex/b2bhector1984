import "server-only";
import { headers } from "next/headers";
import { defaultLocaleForHost, type Locale } from "@/i18n/domains";
import { isLocale } from "@/i18n/config";

/**
 * The locale of the current request, for server contexts that never receive `params.lang`.
 *
 * Three places in this app produce user-facing text with no route params to read:
 *
 *   - **Server Actions** (`src/lib/actions.ts` and friends) — return validation and error
 *     strings straight to the buyer.
 *   - **Route handlers** (`/api/orders/[id]/invoice`, `/api/styles/[id]/spec-sheet`) —
 *     render PDFs, and live outside `app/[lang]` entirely.
 *   - **Transactional email** assembled inside either of the above.
 *
 * Under the old path-prefix scheme there was no good answer for any of them, which is why
 * all three are hardcoded English today. Under domain routing there is: the Host header is
 * present on every request regardless of route shape, so the same header the proxy routes
 * on is available here too.
 *
 * `x-forwarded-host` is checked first — behind Vercel's proxy that is the header carrying
 * the domain the visitor actually typed, while `host` can be the internal deployment host.
 */
export async function getRequestLocale(): Promise<Locale> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return defaultLocaleForHost(host);
}

/**
 * The locale to write copy in for a specific buyer, as opposed to the current request.
 *
 * Prefer the account's stored preference: an order-confirmation email is often sent from a
 * background path, and even when it isn't, the buyer's own language beats whichever domain
 * happened to serve the request. Falls back to the request's locale, then to Greek.
 *
 * This is the function that stops a German retailer receiving a Greek invoice — see the
 * note on `accounts.locale` in migration 0037.
 */
export async function getLocaleForAccount(accountLocale: string | null | undefined): Promise<Locale> {
  if (accountLocale && isLocale(accountLocale)) return accountLocale;
  return getRequestLocale();
}
