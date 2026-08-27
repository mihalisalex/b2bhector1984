import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { defaultLocaleForHost, originForLocale } from "@/i18n/domains";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { ALWAYS_DISALLOWED, COMMERCE_PREFIXES, PUBLIC_PAGES } from "@/lib/seoRoutes";

/**
 * robots.txt, assembled from the admin's SEO settings rather than hardcoded.
 *
 * Rendered per request, deliberately.
 *
 * This used to be `revalidate = 3600` on the assumption that
 * `revalidateSeoSurfaces` would purge it the moment an admin saved. It does not:
 * `robots.ts` is a *cached Route Handler*, and `revalidatePath` against one
 * invalidates the data read inside it rather than reliably evicting the rendered
 * output. Observed on 18 Aug 2026 — the indexing policy was switched on, the
 * product pages' robots tags flipped to `index, follow` within their 60s data
 * cache, and this file went on serving `Disallow: /catalogue` and
 * `Disallow: /product`. The site contradicted itself, and the only thing
 * standing between the catalogue and Google was the stale copy.
 *
 * Per-request costs nothing worth counting here: crawlers fetch this a handful
 * of times a day, and `getSeoSettings` is itself cached for 60s, so the
 * database sees no additional load. A cache that can silently strand the whole
 * indexing policy is a bad trade for a document this small.
 */
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Each domain serves its OWN robots.txt, pointing at its own sitemap and declaring
  // itself as Host. Already force-dynamic (see above), so reading the request host costs
  // nothing extra — and a single hardcoded SITE_URL would have hectorfootwear.com telling
  // crawlers its canonical host and sitemap were both on hectorfootwear.gr.
  const h = await headers();
  const origin = originForLocale(defaultLocaleForHost(h.get("x-forwarded-host") ?? h.get("host")));
  const settings = await getSeoSettings();

  // The kill switch. Turning robots off blocks the whole site — only ever
  // wanted for a staging domain, and the admin UI says so.
  if (!settings.robotsEnabled) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  // Commerce surfaces are disallowed unless the business has explicitly opened
  // the catalogue to the public. Everything in ALWAYS_DISALLOWED stays blocked
  // either way — carts, checkouts and dashboards are per-account and have no
  // business in an index under any policy.
  const disallow = [
    ...ALWAYS_DISALLOWED,
    ...(settings.commerceIndexable ? [] : COMMERCE_PREFIXES),
    ...settings.extraDisallow,
  ];

  const allow = [
    ...PUBLIC_PAGES.map((page) => page.path),
    ...(settings.commerceIndexable ? COMMERCE_PREFIXES : []),
    ...settings.extraAllow,
  ];

  return {
    rules: {
      userAgent: "*",
      allow: Array.from(new Set(allow)),
      disallow: Array.from(new Set(disallow)),
      ...(settings.crawlDelay ? { crawlDelay: settings.crawlDelay } : {}),
    },
    sitemap: settings.sitemapEnabled ? `${origin}/sitemap.xml` : undefined,
    host: origin,
  };
}
