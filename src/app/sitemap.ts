import type { MetadataRoute } from "next";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { getAllEntityMeta } from "@/lib/data/seoEntityMeta";
import { getStorefrontStyles } from "@/lib/data/styles";
import { listImagesForStyles } from "@/lib/data/styleImages";
import { getStyleImageUrl } from "@/lib/data/styleLabels";
import { getPublishedJournalPosts } from "@/lib/data/journalPosts";
import { absoluteUrl } from "@/lib/seo";
import { PUBLIC_PAGES } from "@/lib/seoRoutes";
import { LOCALES, type Locale } from "@/i18n/config";
import { headers } from "next/headers";
import { defaultLocaleForHost, localesForHost, urlForLocale } from "@/i18n/domains";

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
 * Rendered per request, for the same reason as robots.txt — see the comment in
 * `src/app/robots.ts`. `revalidatePath` does not reliably evict a cached Route
 * Handler's output, so an hourly cache here meant the sitemap could keep
 * omitting every product long after the policy that excluded them was switched
 * off. The two files have to agree with each other and with each page's robots
 * tag; the cheapest way to guarantee that is for none of them to be cached.
 *
 * The two expensive reads (`getSeoSettings`, `getStorefrontStyles`) are cached
 * for 60s in their own right, and crawlers fetch this a few times a day.
 */
export const dynamic = "force-dynamic";

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
    languages[locale] = urlForLocale(locale, path);
  }
  // x-default -> English on .com: the fallback for a visitor whose language we don't serve.
  languages["x-default"] = urlForLocale("en", path);
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, overrides] = await Promise.all([getSeoSettings(), getAllEntityMeta()]);
  if (!settings.sitemapEnabled) return [];

  /**
   * TWO SITEMAPS, ONE FILE. Each domain lists only the URLs it actually serves:
   *
   *   hectorfootwear.gr/sitemap.xml   -> el URLs only, unprefixed
   *   hectorfootwear.com/sitemap.xml  -> en (unprefixed) plus de and fr (prefixed)
   *
   * Listing a .gr URL in the .com sitemap would be submitting another site's pages, which
   * Search Console rejects for the property it was submitted to. The hreflang alternates on
   * each entry still span BOTH domains — that is what connects the two sitemaps into one
   * translated site rather than two unrelated ones.
   *
   * Already force-dynamic (see the header comment), so reading the request host is free.
   */
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const hostLocales = localesForHost(host);
  const hostDefault = defaultLocaleForHost(host);

  const entries: MetadataRoute.Sitemap = [];

  /** Absolute URL for a path on THIS host, in the given locale. */
  const here = (locale: Locale, path: string) => urlForLocale(locale, path);

  for (const page of PUBLIC_PAGES) {
    const override = overrides.get(`page:${page.path}`);
    // Respect an admin who has deliberately marked a landing page noindex.
    if (override?.robots?.includes("noindex")) continue;
    // An admin-set canonical may deliberately point somewhere else entirely, so only the
    // ordinary (un-overridden) case gets locale alternates — inventing `/de/<their-url>`
    // would fabricate pages that don't exist.
    const custom = override?.canonicalUrl?.trim();
    if (custom) {
      entries.push({
        url: custom,
        lastModified: override?.updatedAt ? new Date(override.updatedAt) : STATIC_PAGE_LAST_MODIFIED,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
      continue;
    }
    // One entry per locale THIS host serves — so .com lists /faq, /de/faq and /fr/faq while
    // .gr lists only its own /faq. Each carries the full cross-domain alternate set.
    for (const locale of hostLocales) {
      entries.push({
        url: here(locale, page.path),
        lastModified: override?.updatedAt ? new Date(override.updatedAt) : STATIC_PAGE_LAST_MODIFIED,
        changeFrequency: page.changeFrequency,
        // The host's own default locale is the one to prioritise; de/fr are secondary
        // editions of the same page and should not compete with it for crawl budget.
        priority: locale === hostDefault ? page.priority : Math.max(0.1, page.priority - 0.2),
        alternates: { languages: localeAlternates(page.path) },
      });
    }
  }

  // The journal is public content, unconditionally advertised — unlike the
  // catalogue below it, it never sits behind `commerce_indexable`.
  // Only this host's own articles: .gr lists the Greek posts, .com the English ones.
  const posts = (await getPublishedJournalPosts()).filter((p) =>
    hostLocales.includes((p.locale as Locale) ?? "en"),
  );
  for (const post of posts) {
    if (post.robots.includes("noindex")) continue;
    entries.push({
      // Journal posts are single rows per language, not translations, so each belongs to
      // exactly one domain — `post.locale` (migration 0037), not the host default.
      url: post.canonicalUrl?.trim() || here((post.locale as Locale) ?? hostDefault, `/journal/${post.slug}`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly",
      priority: post.featured ? 0.7 : 0.5,
      ...(post.featuredImageUrl ? { images: [absoluteUrl(post.featuredImageUrl, hostDefault)] } : {}),
    });
  }

  // Everything below is the gated trade catalogue. It is only ever advertised
  // when the business has opened it to the public.
  if (!settings.commerceIndexable) return entries;

  entries.push({
    url: here(hostDefault, "/catalogue"),
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
        ? gallery.map((image) => absoluteUrl(image.publicUrl, hostDefault))
        : [absoluteUrl(getStyleImageUrl(style), hostDefault)]
      : undefined;

    entries.push({
      url: style.canonicalUrl?.trim() || here(hostDefault, `/product/${style.slug}`),
      lastModified: style.createdAt ? new Date(style.createdAt) : STATIC_PAGE_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: style.featured ? 0.8 : 0.6,
      ...(imageUrls?.length ? { images: imageUrls } : {}),
    });
  }

  return entries;
}
