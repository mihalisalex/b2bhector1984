import type { MetadataRoute } from "next";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { getAllEntityMeta } from "@/lib/data/seoEntityMeta";
import { getStorefrontStyles } from "@/lib/data/styles";
import { listImagesForStyles } from "@/lib/data/styleImages";
import { getStyleImageUrl } from "@/lib/data/styleLabels";
import { getPublishedJournalPosts } from "@/lib/data/journalPosts";
import { absoluteUrl } from "@/lib/seo";
import { PUBLIC_PAGES } from "@/lib/seoRoutes";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";

/**
 * XML sitemap.
 *
 * Two rules govern what goes in here:
 *
 *  1. **Never list a URL that robots.txt disallows.** A sitemap entry for a
 *     disallowed path is a direct contradiction and Search Console reports it
 *     as "Submitted URL blocked by robots.txt". Product and catalogue URLs are
 *     therefore included only when `commerce_indexable` is on — the same single
 *     setting that opens them up in robots.txt.
 *  2. **Never list a URL that canonicalises elsewhere.** A page whose admin
 *     override sets a foreign canonical, or which is marked noindex, is
 *     excluded rather than listed and then contradicted by its own head.
 *
 * Re-rendered hourly, and revalidated on demand when SEO settings or a product
 * slug change (see `revalidateSeoSurfaces`).
 */
export const revalidate = 3600;

/**
 * Fallback `lastModified` for pages with no real modification date of their own.
 *
 * Deliberately **not** `new Date()`. This route re-renders hourly, so "now" meant every
 * static page claimed to have changed on every fetch — and a sitemap whose `lastmod` is
 * always current is a signal Google learns to ignore entirely, taking the *accurate* dates
 * on journal posts and products down with it. A fixed date is honest: these pages genuinely
 * haven't changed since it, and bumping it is a deliberate act.
 */
const STATIC_PAGE_LAST_MODIFIED = new Date("2026-08-17T00:00:00Z");

/**
 * The storefront serves four locales: English unprefixed (`/collections`) and the rest
 * prefixed (`/de/collections`). Every marketing page therefore exists four times, and each
 * copy has to declare the others via `hreflang` or Google has no way to connect them.
 *
 * The sitemap previously listed English only, with no alternates at all — so three quarters
 * of the translated site had no discovery path, despite each page already emitting correct
 * `hreflang` tags in its own `<head>`. `x-default` points at English, matching the canonical.
 */
function localeAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[locale] = absoluteUrl(locale === DEFAULT_LOCALE ? path : `/${locale}${path === "/" ? "" : path}`);
  }
  languages["x-default"] = absoluteUrl(path);
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, overrides] = await Promise.all([getSeoSettings(), getAllEntityMeta()]);
  if (!settings.sitemapEnabled) return [];

  const entries: MetadataRoute.Sitemap = [];

  for (const page of PUBLIC_PAGES) {
    const override = overrides.get(`page:${page.path}`);
    // Respect an admin who has deliberately marked a landing page noindex.
    if (override?.robots?.includes("noindex")) continue;
    // An admin-set canonical may deliberately point somewhere else entirely, so only the
    // ordinary (un-overridden) case gets locale alternates — inventing `/de/<their-url>`
    // would fabricate pages that don't exist.
    const custom = override?.canonicalUrl?.trim();
    entries.push({
      url: absoluteUrl(custom || page.path),
      lastModified: override?.updatedAt ? new Date(override.updatedAt) : STATIC_PAGE_LAST_MODIFIED,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      ...(custom ? {} : { alternates: { languages: localeAlternates(page.path) } }),
    });
  }

  // The journal is public content, unconditionally advertised — unlike the
  // catalogue below it, it never sits behind `commerce_indexable`.
  const posts = await getPublishedJournalPosts();
  for (const post of posts) {
    if (post.robots.includes("noindex")) continue;
    entries.push({
      url: absoluteUrl(post.canonicalUrl?.trim() || `/journal/${post.slug}`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly",
      priority: post.featured ? 0.7 : 0.5,
      ...(post.featuredImageUrl ? { images: [absoluteUrl(post.featuredImageUrl)] } : {}),
    });
  }

  // Everything below is the gated trade catalogue. It is only ever advertised
  // when the business has opened it to the public.
  if (!settings.commerceIndexable) return entries;

  entries.push({
    url: absoluteUrl("/catalogue"),
    lastModified: STATIC_PAGE_LAST_MODIFIED,
    changeFrequency: "daily",
    priority: 0.9,
  });

  const styles = await getStorefrontStyles();
  const imagesByStyle = settings.sitemapIncludeImages
    ? await listImagesForStyles(styles.map((style) => style.id))
    : {};

  for (const style of styles) {
    if (style.robots?.includes("noindex")) continue;

    // Image sitemap entries: every gallery photo, falling back to the single
    // primary/category image when a style has no gallery rows yet (which is
    // most of them — see getStyleImageUrl).
    const gallery = imagesByStyle[style.id] ?? [];
    const imageUrls = settings.sitemapIncludeImages
      ? gallery.length > 0
        ? gallery.map((image) => absoluteUrl(image.publicUrl))
        : [absoluteUrl(getStyleImageUrl(style))]
      : undefined;

    entries.push({
      url: absoluteUrl(style.canonicalUrl?.trim() || `/product/${style.slug}`),
      lastModified: style.createdAt ? new Date(style.createdAt) : STATIC_PAGE_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: style.featured ? 0.8 : 0.6,
      ...(imageUrls?.length ? { images: imageUrls } : {}),
    });
  }

  return entries;
}
