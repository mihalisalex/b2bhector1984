import "server-only";

/**
 * Cross-request cache tags for the storefront's hot read paths (Phase 1 of the LCP work,
 * 2026-08-13).
 *
 * Context: every storefront request was hitting Supabase for the full catalog, the hero row
 * and the season settings, because the marketing layout reads cookies (`getCurrentAccount`)
 * and so the route can never be statically cached. Measured TTFB was ~0.75s on the homepage
 * vs a ~0.19s network floor, and since the hero image's preload can't be emitted until the
 * document renders, that server time lands directly on LCP.
 *
 * These reads are safe to cache across requests: nothing under `src/lib/data/` touches
 * `cookies()`/`headers()` (it all goes through the service-role `supabaseAdmin` client), and
 * every cached return value is plain JSON — no `Date`, `Map` or `Set` — so it survives the
 * cache's serialization round trip unchanged.
 *
 * Note this is deliberately NOT React's `cache()`, which only dedupes within a single
 * request's render tree. Both layers are in play: `cache()` still collapses the repeat calls
 * inside one render (the layout and the page both read the hero), while `unstable_cache`
 * persists across requests.
 */
export const CACHE_TAGS = {
  /** The catalog: `styles` + `colorways` + `style_images`. */
  styles: "styles",
  /** `season_settings` rows — which seasons are enabled, their labels and teaser images. */
  seasons: "season-settings",
  /** The `site_content` hero/announcement row edited from /admin/content. */
  siteContent: "site-content",
  /** SEO settings edited from /admin/seo. */
  seo: "seo-settings",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/**
 * Safety-net TTL, in seconds, applied to every cached read below.
 *
 * Tag invalidation (see `invalidateCache`) is the primary mechanism and makes admin edits
 * appear immediately. This TTL exists because tag coverage is the fragile part: ~45 mutating
 * functions touch these tables, and a write path that forgets to invalidate would otherwise
 * serve stale content until the next deploy. With the TTL, the worst case for a missed tag
 * degrades from "wrong indefinitely" to "at most a minute behind" — which matters on a live
 * storefront where an admin publishing a product and not seeing it is a support call.
 *
 * 60s is short enough to be invisible operationally and long enough that a burst of traffic
 * still collapses onto one set of queries.
 */
export const CACHE_TTL_SECONDS = 60;
