/**
 * Which storefront requests get the cached public tree (`src/app/[lang]/public`) — see that
 * folder's layout for the full story. Plain constants and pure functions with no imports, so
 * `src/proxy.ts` can use them too.
 */
export const AUDIENCES = { public: "public", member: "member" } as const;

export type Audience = (typeof AUDIENCES)[keyof typeof AUDIENCES];

/** Exact (locale-stripped) paths that have a cached public version. */
const PUBLIC_EXACT = new Set([
  "/",
  "/brand-story",
  "/contact",
  "/cookies",
  "/faq",
  "/privacy",
  "/terms",
  "/apply",
  "/login",
  "/forgot-password",
]);

/** Prefixes whose single-segment children have a cached public version (`/product/<slug>`). */
const PUBLIC_PREFIXES = ["/collections/", "/journal/", "/product/"];

/**
 * True when a logged-out request for this path can be served from the public tree. Must match
 * the wrapper files under `src/app/[lang]/public/` exactly — a path listed here without a
 * wrapper would 404. Pages that read `?query` (catalogue, /collections, /journal) are left
 * out on purpose: reading searchParams makes a page live anyway.
 */
export function isPublicCacheable(path: string): boolean {
  if (PUBLIC_EXACT.has(path)) return true;
  return PUBLIC_PREFIXES.some((prefix) => {
    if (!path.startsWith(prefix)) return false;
    const rest = path.slice(prefix.length);
    return rest.length > 0 && !rest.includes("/");
  });
}
