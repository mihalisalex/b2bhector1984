import type { MetadataRoute } from "next";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { getAllEntityMeta } from "@/lib/data/seoEntityMeta";
import { getStorefrontStyles } from "@/lib/data/styles";
import { listImagesForStyles } from "@/lib/data/styleImages";
import { getStyleImageUrl } from "@/lib/data/styleLabels";
import { getPublishedJournalPosts } from "@/lib/data/journalPosts";
import { absoluteUrl } from "@/lib/seo";
import { PUBLIC_PAGES } from "@/lib/seoRoutes";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, overrides] = await Promise.all([getSeoSettings(), getAllEntityMeta()]);
  if (!settings.sitemapEnabled) return [];

  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const page of PUBLIC_PAGES) {
    const override = overrides.get(`page:${page.path}`);
    // Respect an admin who has deliberately marked a landing page noindex.
    if (override?.robots?.includes("noindex")) continue;
    entries.push({
      url: absoluteUrl(override?.canonicalUrl?.trim() || page.path),
      lastModified: override?.updatedAt ? new Date(override.updatedAt) : now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
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
    lastModified: now,
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
      lastModified: style.createdAt ? new Date(style.createdAt) : now,
      changeFrequency: "weekly",
      priority: style.featured ? 0.8 : 0.6,
      ...(imageUrls?.length ? { images: imageUrls } : {}),
    });
  }

  return entries;
}
