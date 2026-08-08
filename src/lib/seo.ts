import "server-only";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import { LOCALES, DEFAULT_LOCALE, type Locale, withLocale } from "@/i18n/paths";
import { getSeoSettings, type SeoSettings } from "@/lib/data/seoSettings";
import { getEntityMeta } from "@/lib/data/seoEntityMeta";
import {
  generateArticleDescription,
  generateArticleTitle,
  generateProductDescription,
  generateProductTitle,
  type ArticleSeoSource,
  type ProductSeoSource,
} from "@/lib/seoAutogen";
import type { JournalPost, Style } from "@/lib/types";

/**
 * The single place page metadata is assembled.
 *
 * Two things this exists to get right, both of which were once wrong:
 *
 *  - **Canonical.** Next resolves `alternates.canonical` against `metadataBase`,
 *    so a single `canonical: "/"` in the root layout would point *every* page at
 *    the homepage and actively deindex the rest. Canonicals are therefore always
 *    declared per route, which is what `path` is for.
 *  - **Open Graph title/url.** The root layout hardcoded both, so every share
 *    card read "Hector Footwear — Wholesale" and linked to the site root regardless
 *    of the page. Here they're derived from the page's own title and path.
 *
 * Everything is admin-overridable: values come from `seo_entity_meta` (per page
 * or per entity) first, fall back to the caller's compile-time defaults, and
 * only then to generated copy. Nothing here ever needs a deploy to change.
 */

/** Absolute URL for a site-relative path. Absolute inputs pass through untouched. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Parses the `index,follow` string shape stored on products and entity meta
 * into the object Next expects. Unknown/empty values fall back to indexable,
 * because a malformed override should never silently deindex a page.
 */
/** og:locale wants the `language_TERRITORY` form (e.g. `el_GR`), not the bare ISO code the
 * rest of this module (and hreflang) uses — Facebook's crawler in particular is picky about it. */
const OG_LOCALE: Record<Locale, string> = { en: "en_US", de: "de_DE", fr: "fr_FR", el: "el_GR" };

export function parseRobots(value: string | undefined): Metadata["robots"] {
  const tokens = (value ?? "").toLowerCase().split(",").map((t) => t.trim());
  const index = !tokens.includes("noindex");
  const follow = !tokens.includes("nofollow");
  return {
    index,
    follow,
    googleBot: { index, follow, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  };
}

export interface BuildMetadataInput {
  title: string;
  description: string;
  /** Route path with a leading slash; "/" for the homepage. */
  path: string;
  /** Overrides the computed canonical. Used for paginated and filtered views. */
  canonicalPath?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  ogType?: "website" | "article" | "profile";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImageUrl?: string;
  twitterCard?: string;
  keywords?: string[];
  /** Which locale this render is for — drives the canonical's locale prefix and the
   * hreflang alternate set (see the block below). Defaults to the site's default locale
   * (English, unprefixed) so every existing call site keeps its current behavior untouched. */
  locale?: Locale;
  /** Set to `false` for pages whose content doesn't actually vary per locale yet (e.g. the
   * journal, whose posts have no per-locale rows) — suppresses hreflang alternates so the
   * tag set never claims a translated sibling that doesn't really exist. The canonical still
   * gets the current locale's own prefix either way. Defaults to `true`. */
  hasLocaleVariants?: boolean;
}

function buildMetadata(input: BuildMetadataInput, settings: SeoSettings): Metadata {
  const isHome = input.path === "/";
  // The root layout's title template only applies to `title`, not to
  // openGraph/twitter, so the full form is built once here to keep share cards
  // consistent with the browser tab. The homepage opts out of the template via
  // `absolute` — it already carries the brand name, and letting the suffix
  // append would render "… Wholesale — … Wholesale".
  const fullTitle = isHome ? input.title : settings.titleTemplate.replace("%s", input.title);

  const ogImage = input.ogImageUrl ?? settings.defaultOgImageUrl;
  const twitterImage = input.twitterImageUrl ?? ogImage;
  const locale = input.locale ?? DEFAULT_LOCALE;
  // An admin-entered canonical override is respected verbatim — it may deliberately point
  // cross-domain or at a different path, and silently layering an auto-computed locale
  // prefix on top of someone's explicit choice would rewrite it into something they never
  // set. Only the auto-computed canonical (the common, no-override case) gets prefixed —
  // this is also what makes every locale variant of a page self-canonical instead of every
  // one of them pointing back at the English URL, which used to tell Google there was only
  // ever one indexable version and the /de, /fr, /el pages didn't need a look.
  const canonical = input.canonicalPath ? input.canonicalPath : withLocale(locale, input.path);

  // hreflang: every locale's URL for this same logical page, plus x-default pointing at the
  // site's default-locale (English, unprefixed) version — the standard pattern once one
  // locale is unprefixed. Skipped when an admin canonical override is in play (see above,
  // same reasoning) or when the page has no real per-locale variants to point at.
  const languages =
    !input.canonicalPath && input.hasLocaleVariants !== false
      ? (Object.fromEntries([
          ...LOCALES.map((loc) => [loc, absoluteUrl(withLocale(loc, input.path))]),
          ["x-default", absoluteUrl(withLocale(DEFAULT_LOCALE, input.path))],
        ]) as Record<string, string>)
      : undefined;

  return {
    title: isHome ? { absolute: input.title } : input.title,
    description: input.description,
    keywords: input.keywords?.length ? input.keywords : undefined,
    alternates: { canonical, languages },
    robots: parseRobots(input.robots),
    openGraph: {
      title: input.ogTitle?.trim() || fullTitle,
      description: input.ogDescription?.trim() || input.description,
      url: canonical,
      siteName: settings.siteName,
      type: input.ogType ?? "website",
      locale: OG_LOCALE[locale],
      images: ogImage ? [{ url: absoluteUrl(ogImage) }] : undefined,
    },
    twitter: {
      card: (input.twitterCard ?? settings.defaultTwitterCard) as "summary" | "summary_large_image",
      site: settings.twitterSite,
      creator: settings.twitterCreator,
      title: input.twitterTitle?.trim() || input.ogTitle?.trim() || fullTitle,
      description: input.twitterDescription?.trim() || input.ogDescription?.trim() || input.description,
      images: twitterImage ? [absoluteUrl(twitterImage)] : undefined,
    },
  };
}

/**
 * Metadata for a fixed marketing/landing page, with admin overrides applied.
 *
 * `pageKey` is the route path ("/faq"), which is what the admin SEO editor
 * lists these under. The `title`/`description` arguments are the in-code
 * defaults — they still ship if nobody has ever opened the SEO editor.
 *
 * Only use this for routes allowed in robots.txt. The gated commerce surfaces
 * go through `commerceMetadata` instead, which respects the indexing policy.
 */
export async function pageMetadata({
  title,
  description,
  path,
  locale,
  hasLocaleVariants,
}: {
  title: string;
  description: string;
  path: string;
  /** Which locale this render is for — see `BuildMetadataInput.locale`. Defaults to English. */
  locale?: Locale;
  /** See `BuildMetadataInput.hasLocaleVariants`. Defaults to `true`. */
  hasLocaleVariants?: boolean;
}): Promise<Metadata> {
  const [settings, override] = await Promise.all([getSeoSettings(), getEntityMeta("page", path)]);
  return buildMetadata(
    {
      title: override?.seoTitle?.trim() || title,
      description: override?.metaDescription?.trim() || description,
      path,
      // Only a *real* admin override goes here — leaving this `undefined` in the common case
      // (no override) is what lets `buildMetadata` auto-prefix the canonical with the current
      // locale and generate hreflang alternates. This used to unconditionally fall back to
      // `path`, which made every call site's canonicalPath permanently non-empty and silently
      // disabled that logic entirely.
      canonicalPath: override?.canonicalUrl?.trim() || undefined,
      locale,
      hasLocaleVariants,
      robots: override?.robots,
      ogTitle: override?.ogTitle,
      ogDescription: override?.ogDescription,
      ogImageUrl: override?.ogImageUrl,
      twitterTitle: override?.twitterTitle,
      twitterDescription: override?.twitterDescription,
      twitterImageUrl: override?.twitterImageUrl,
      twitterCard: override?.twitterCard,
      keywords: override?.secondaryKeywords,
    },
    settings,
  );
}

/**
 * Metadata for a gated trade surface (catalogue, product, quick-order,
 * linesheet).
 *
 * The important part is the robots decision. These pages are behind a login
 * and `robots.txt` disallows them, so by default they must also declare
 * `noindex` — belt and braces, because a `Disallow` only stops crawling, not
 * indexing of a URL discovered elsewhere. The `commerce_indexable` setting is
 * the one lever that changes this, and it changes robots.txt, the sitemap and
 * this tag together so they can never disagree.
 *
 * A per-product `robots` override can only ever make a page *less* indexable,
 * never more — an admin ticking "index,follow" on one product must not be able
 * to leak trade pricing while the global policy says the catalogue is private.
 */
function commerceRobots(settings: SeoSettings, override?: string): string {
  if (!settings.commerceIndexable) return "noindex,nofollow";
  const tokens = (override ?? "index,follow").toLowerCase();
  return tokens;
}

export interface CommerceMetadataInput {
  title: string;
  description: string;
  path: string;
  canonicalPath?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImageUrl?: string;
  twitterCard?: string;
  keywords?: string[];
  ogType?: "website" | "article";
}

export async function commerceMetadata(input: CommerceMetadataInput): Promise<Metadata> {
  const settings = await getSeoSettings();
  return buildMetadata({ ...input, robots: commerceRobots(settings, input.robots) }, settings);
}

/**
 * Full product metadata: admin overrides → generated copy → nothing blank.
 *
 * Share cards matter here even though the page is noindex — reps paste product
 * links into email and WhatsApp constantly, and an unfurled card with a real
 * photo and the style name is the whole point of the Open Graph fields on a
 * gated page.
 */
export async function productMetadata(style: Style, imageUrl?: string): Promise<Metadata> {
  const settings = await getSeoSettings();
  const source: ProductSeoSource = {
    name: style.name,
    styleNumber: style.styleNumber,
    category: style.category,
    season: style.season,
    tagline: style.tagline,
    description: style.description,
    brandName: style.brandName,
    materials: style.materials,
    tags: style.tags,
  };

  const title = style.seoTitle?.trim() || generateProductTitle(source, settings.siteName);
  const description = style.metaDescription?.trim() || generateProductDescription(source);
  const image = style.ogImageUrl?.trim() || imageUrl || style.primaryImageUrl;

  return buildMetadata(
    {
      title,
      description,
      path: `/product/${style.slug}`,
      canonicalPath: style.canonicalUrl?.trim() || `/product/${style.slug}`,
      robots: commerceRobots(settings, style.robots),
      ogTitle: style.ogTitle,
      ogDescription: style.ogDescription,
      ogImageUrl: image,
      ogType: "website",
      twitterTitle: style.twitterTitle,
      twitterDescription: style.twitterDescription,
      twitterImageUrl: style.twitterImageUrl,
      twitterCard: style.twitterCard,
      keywords: style.seoKeywords,
    },
    settings,
  );
}

/**
 * Full journal article metadata: admin overrides → generated copy → nothing
 * blank — the same override cascade as `productMetadata`, since a journal
 * post carries its own first-class SEO columns rather than going through the
 * polymorphic `seo_entity_meta` table (see migration 0027's header comment).
 * Always public/indexable — the journal is a marketing content hub, not a
 * gated commerce surface, so unlike products this never runs through
 * `commerceRobots`.
 */
export async function articleMetadata(post: JournalPost): Promise<Metadata> {
  const settings = await getSeoSettings();
  const source: ArticleSeoSource = {
    title: post.title,
    excerpt: post.excerpt,
    contentHtml: post.contentHtml,
    category: post.category,
    siteName: settings.siteName,
  };

  const title = post.seoTitle?.trim() || generateArticleTitle(source);
  const description = post.metaDescription?.trim() || generateArticleDescription(source);
  const image = post.ogImageUrl?.trim() || post.featuredImageUrl;

  return buildMetadata(
    {
      title,
      description,
      path: `/journal/${post.slug}`,
      canonicalPath: post.canonicalUrl?.trim() || `/journal/${post.slug}`,
      robots: post.robots,
      ogImageUrl: image,
      ogType: "article",
    },
    settings,
  );
}
