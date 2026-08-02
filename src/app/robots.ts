import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { ALWAYS_DISALLOWED, COMMERCE_PREFIXES, PUBLIC_PAGES } from "@/lib/seoRoutes";

/**
 * robots.txt, assembled from the admin's SEO settings rather than hardcoded.
 *
 * Re-rendered hourly, and explicitly revalidated the moment an admin saves the
 * SEO settings (see `revalidateSeoSurfaces` in seoActions.ts) so a policy
 * change takes effect immediately instead of on the next deploy.
 */
export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
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
    sitemap: settings.sitemapEnabled ? `${SITE_URL}/sitemap.xml` : undefined,
    host: SITE_URL,
  };
}
