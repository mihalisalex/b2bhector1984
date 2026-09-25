/**
 * The cached storefront for logged-out visitors.
 *
 * `src/proxy.ts` sends a request here — `/{lang}/public/…` — when it carries no session
 * cookie AND its path is one of `PUBLIC_CACHEABLE` in `@/lib/audience`. Every other request
 * goes to the live tree (`src/app/[lang]/(marketing|catalog|shop)`) exactly as before.
 *
 * Why two trees and not one: Next decides per ROUTE whether a page is cached or rendered
 * live, not per visitor. A single cacheable route cannot also read a buyer's session — the
 * render fails with DYNAMIC_SERVER_USAGE (tried on 2026-09-25). So the pages a logged-out
 * visitor can see exist a second time here, as wrappers around the live page components
 * that pass `audience: "public"`. `getAccountForAudience` then returns null without ever
 * reading cookies, which is what makes these routes cacheable — and why a cached page can
 * never contain a buyer's prices.
 *
 * Each wrapper is a few lines and holds no page logic, so there is nothing to keep in sync:
 * change the live page and the public one follows. Add a page here only together with its
 * path in `PUBLIC_CACHEABLE`, or the proxy will route to a page that does not exist.
 */
export const revalidate = 60;

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
