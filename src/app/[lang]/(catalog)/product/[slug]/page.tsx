import { notFound, redirect } from "next/navigation";
import { getHomepageHero } from "@/lib/data/siteContent";
import { chargesGreekVat } from "@/lib/tax";
import { t } from "@/i18n/format";
import Link from "next/link";
import { CATEGORY_LABEL, getRelatedStyles, getStorefrontStyles, getStyleBySlug, getStyleImageUrl } from "@/lib/data/styles";
import { styleTitle, modelSiblings } from "@/lib/modelColours";
import { ModelColours } from "@/components/product/ModelColours";
import { whatsappHref } from "@/lib/contact";
import { getInventoryForStyle, getInventoryForStyles, totalOnHandForStyle } from "@/lib/data/inventory";
import { getImagesForStyle, listImagesForStyles } from "@/lib/data/styleImages";
import { getAccountForAudience } from "@/lib/session";
import { isFavorite } from "@/lib/data/favorites";
import { pickDefaultColorway } from "@/lib/productSelectionDefaults";
import { ColorwaySelectionProvider } from "@/lib/colorway-selection-context";
import { StylePlate } from "@/components/product/StylePlate";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetails } from "@/components/product/ProductDetails";
import { PrimaryPurchasePanel, BUY_BAR_RELEASE_ID } from "@/components/product/PrimaryPurchasePanel";
import { PublicPurchasePanel } from "@/components/product/PublicPurchasePanel";
import { TrackRecentlyViewed } from "@/components/product/TrackRecentlyViewed";
import { RecentlyViewedStrip } from "@/components/product/RecentlyViewedStrip";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { getGuidesForStyle } from "@/lib/data/guidesForStyle";
import { JsonLd } from "@/components/seo/JsonLd";
import { getDictionary } from "@/i18n/getDictionary";
import { localizeStyle } from "@/lib/localizeStyle";
import { withLocale } from "@/i18n/paths";
import { isSeasonOpenFor } from "@/lib/data/seasonSettings";
import { LinkButton } from "@/components/ui/Button";
import { categoryLabel } from "@/lib/data/styleLabels";
import type { Locale } from "@/i18n/config";
import { productMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildProductSchema } from "@/lib/seoJsonLd";
import { getCategoryPageForCategory } from "@/lib/categoryPages";
import { getSeoSettings } from "@/lib/data/seoSettings";
import type { Metadata } from "next";
import type { SalesRep } from "@/lib/types";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * Pre-migration fallback only.
 *
 * Slug redirects are now managed in the database (`seo_redirects`) and served by
 * `proxy.ts` before this page is ever reached — renaming a product's slug in the
 * admin SEO tab creates the 301 automatically. Migration 0025 seeds the one
 * entry below into that table, so on a migrated database this map is dead code
 * that never fires. It stays as a safety net for an unmigrated deployment.
 *
 * Do not add new entries here — use the redirect manager at /admin/seo/redirects.
 */
const LEGACY_SLUG_REDIRECTS: Record<string, string> = {
  "riviera-loafer": "hector-boat-loafer", // HL-1001, corrected 2026-07-29 — was stale from an earlier product rename
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const style = await getStyleBySlug(slug);
  if (!style) return { title: "Style", robots: { index: false, follow: false } };

  // Everything — title, description, canonical, share card, robots — comes from
  // the product's own SEO fields, falling back to generated copy. The robots
  // value is clamped by the global indexing policy inside `productMetadata`, so
  // a per-product "index,follow" can never leak trade pricing while the
  // catalogue is private.
  const images = await getImagesForStyle(style.id);
  const primary = images.find((image) => image.isPrimary) ?? images[0];
  return productMetadata(style, primary?.publicUrl, lang as Locale);
}

export default async function ProductPage({ params }: { params: Promise<{ lang: string; audience?: string; slug: string }> }) {
  const { lang, audience, slug } = await params;
  const locale = lang as Locale;
  if (LEGACY_SLUG_REDIRECTS[slug]) redirect(`/product/${LEGACY_SLUG_REDIRECTS[slug]}`);
  const style = await getStyleBySlug(slug);
  // A draft/archived product, or one with no colorways yet (every card/gallery below
  // assumes colorways[0] exists), should 404 rather than crash the page for anyone who
  // hits the URL — including via a stale cart/search/bookmark link.
  if (!style || (style.status ?? "active") !== "active" || style.colorways.length === 0) notFound();
  // Related styles come from the cached catalogue and the dictionary is a local import, so
  // both resolve without a database trip. That lets every real query below go out in ONE
  // parallel batch — this used to be two batches back to back, then a third for favourites.
  const [related, dict, allStyles] = await Promise.all([getRelatedStyles(style), getDictionary(locale), getStorefrontStyles()]);
  // The same shoe in its other colours — separate products, linked from here (owner's call).
  const siblings = modelSiblings(style, allStyles);
  const relatedIds = related.map((s) => s.id);
  const [inventory, images, account, relatedInventory, relatedImages, guides, seoSettings, hero] = await Promise.all([
    getInventoryForStyle(style.id),
    getImagesForStyle(style.id),
    getAccountForAudience(audience),
    getInventoryForStyles(relatedIds),
    listImagesForStyles(relatedIds),
    getGuidesForStyle(style, locale, categoryLabel(dict, style.category)),
    getSeoSettings(),
    getHomepageHero(),
  ]);
  const leadTimeDays = hero.productionLeadTimeDays;
  // The page stays up for old links and search engines; it just can't be ordered from.
  const seasonClosed = !(await isSeasonOpenFor(style.season));
  const priceMultiplier = account?.priceMultiplier ?? 1;
  const favorited = account ? await isFavorite(account.id, style.id) : false;

  // This page is public so it can be indexed, but everything priced or orderable
  // belongs to an approved account. One flag drives all of it, so there is no way
  // to add a price to this page and forget the logged-out case.
  const showPricing = account !== null;

  // Structured data. Both builders return null when the corresponding schema
  // type is switched off in the SEO settings, and JsonLd renders nothing for a
  // null — so an admin can disable either without touching this page.
  const productSchema = buildProductSchema(style, seoSettings, {
    imageUrls: images.length > 0 ? images.map((image) => image.publicUrl) : [getStyleImageUrl(style)],
    // `inventory` here is this style's own colorway→box map (not the batched
    // styleId-keyed record `totalOnHandForStyle` expects), so it sums directly.
    inStock: totalOnHandForStyle(style.id, { [style.id]: inventory }) > 0,
    showPricing,
    locale,
  });
  // Paths stay unprefixed on purpose — product pages keep the English canonical (see the
  // pre-launch audit). `locale` here only picks the ORIGIN, so .gr stops publishing
  // breadcrumbs that claim to live on .com and vice versa.
  //
  // The category crumb points at the category's landing page where one exists — the
  // indexable page for that category — rather than a catalogue filter URL Google folds into
  // /catalogue.
  const categoryPage = getCategoryPageForCategory(style.category);
  const categoryHref = categoryPage ? `/collections/${categoryPage.slug}` : `/catalogue?category=${style.category}`;
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Catalogue", path: "/catalogue" },
      { name: CATEGORY_LABEL[style.category], path: categoryHref },
      { name: style.name, path: `/product/${style.slug}` },
    ],
    seoSettings,
    locale,
  );

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-8 pt-4 lg:px-10 lg:pt-8">
      <JsonLd schema={[productSchema, breadcrumbSchema].filter((schema) => schema !== null)} />
      <TrackRecentlyViewed styleId={style.id} />

      {/* Desktop is a 50-50 photo | details split (2026-08-13). This page previously kept a
          single centred column at every size deliberately; the split was reviewed against
          the live page and adopted because it puts the whole buying decision — title, box
          size, lead time, price, trust strip — on one screen instead of below a tall photo.
          Mobile and tablet are unchanged, still one stacked column; the split starts at lg.
          The cap widens 600px -> 1200px so each half lands at roughly the old single-column
          width rather than halving the photo. */}
      <div className="lg:mx-auto lg:max-w-[1200px]">
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-ink-soft">
          <Link href={withLocale(locale, "/catalogue")} className="hover:text-ink">{dict.nav.catalogue}</Link>
          <span>/</span>
          {/* Buyers go to the orderable catalogue filter; everyone else (crawlers included)
              to the category's public landing page. */}
          <Link
            href={withLocale(locale, showPricing ? `/catalogue?category=${style.category}` : categoryHref)}
            className="hover:text-ink"
          >
            {categoryLabel(dict, style.category)}
          </Link>
          <span>/</span>
          <span className="text-ink">{styleTitle(style)}</span>
        </nav>

        <ColorwaySelectionProvider initialColorwayId={pickDefaultColorway(style, inventory, images)}>
          {/* The grid lives INSIDE the provider on purpose: the gallery and the purchase
              panel are two halves of one colorway selection, so they have to stay under the
              same provider no matter how they're arranged. `items-start` keeps the details
              column from stretching to the photo's height. */}
          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-16">
            {/* Photo column. min-w-0 on both halves so a wide gallery can't blow the grid
                track out past 50% — grid items default to min-width:auto. */}
            <div className="lg:min-w-0">
              {images.length > 0 ? (
                <ProductGallery images={images} styleName={style.name} colorways={style.colorways} />
              ) : (
                // Full-bleed below lg: breaking out of the page's own horizontal padding is
                // what makes the photo feel large rather than inset in a box. Reverts at lg,
                // where the column above has already capped/centered the width, so there's
                // nothing left to break out of.
                <div className="-mx-6 lg:mx-0">
                  <StylePlate
                    swatch={style.colorways[0].swatch}
                    imageUrl={getStyleImageUrl(style)}
                    alt={style.name}
                    className="aspect-[3/4] w-full"
                  />
                </div>
              )}
            </div>

            {/* Details column. `lg:mt-0` on the first child so it aligns with the top of the
                photo instead of inheriting the stacked-layout gap. */}
            <div className="lg:min-w-0">
              {/* Name, what it is, a sentence. The style number lives in the specifications:
                  it was on this screen three times, next to two "made to order" badges. */}
              <h1 className="font-display mt-8 text-4xl leading-[1.08] text-ink sm:text-5xl lg:mt-0">{styleTitle(style)}</h1>
              <p className="mt-2 text-sm text-ink-soft">{categoryLabel(dict, style.category)}</p>
              {/* localizeStyle, not style.tagline — the Greek copy is in tagline_el. */}
              <p className="mt-6 text-[15px] leading-relaxed text-ink-soft">{localizeStyle(style, locale).tagline}</p>

              <div className="mt-7">
                <ModelColours current={style} siblings={siblings} locale={locale} dict={dict} />
              </div>

              <div className="mt-8">
                {seasonClosed ? (
                  <div>
                    <p className="font-display text-2xl text-ink">{dict.catalog.seasonClosedTitle}</p>
                    <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{dict.catalog.seasonClosedBody}</p>
                    <LinkButton href={withLocale(locale, "/catalogue")} size="lg" className="mt-6">
                      {dict.catalog.seasonClosedCta}
                    </LinkButton>
                  </div>
                ) : showPricing ? (
                  <PrimaryPurchasePanel
                    style={style}
                    inventory={inventory}
                    priceMultiplier={priceMultiplier}
                    initialFavorited={favorited}
                  />
                ) : (
                  <PublicPurchasePanel
                    style={style}
                    inventory={inventory}
                    applyHref={withLocale(locale, "/apply")}
                    loginHref={withLocale(locale, `/login?next=${encodeURIComponent(`/product/${style.slug}`)}`)}
                    dict={dict}
                    leadTimeDays={leadTimeDays}
                  />
                )}
              </div>

              <ProductContact rep={account?.rep} dict={dict} styleName={style.name} />
            </div>
          </div>
        </ColorwaySelectionProvider>

        <ProductDetails
          style={style}
          locale={locale}
          dict={dict}
          minOrderPairs={account?.minOrderPairs}
          showPricing={showPricing}
          leadTimeDays={leadTimeDays}
          chargesVat={chargesGreekVat(account?.country)}
        />
      </div>

      {/* Watched by the mobile buy bar: once this scrolls into view the buyer has moved
          from deciding on this style to browsing the category, and the bar releases. */}
      <div id={BUY_BAR_RELEASE_ID} aria-hidden className="h-px" />

      {related.length > 0 && (
        <div className="mt-14 border-t border-stone-300 pt-8">
          <h2 className="font-display mb-4 text-lg font-bold uppercase tracking-tight text-ink">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((r) => (
              <ProductCard
                key={r.id}
                style={r}
                totalOnHand={totalOnHandForStyle(r.id, relatedInventory)}
                priceMultiplier={priceMultiplier}
                showPricing={showPricing}
                images={relatedImages[r.id] ?? []}
              />
            ))}
          </div>
        </div>
      )}

      {/* Articles link into the catalogue; until this block nothing linked back out. Same
          heading treatment as "You May Also Like" above so the two read as one band. See
          getGuidesForStyle for how the three are chosen. */}
      {guides.length > 0 && (
        <div className="mt-14 border-t border-stone-300 pt-8">
          <h2 className="font-display mb-4 text-lg font-bold uppercase tracking-tight text-ink">
            {dict.catalog.relatedGuides}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((post) => (
              <ArticleCard key={post.id} post={post} locale={locale} dict={dict} />
            ))}
          </div>
        </div>
      )}

      {/* Reads the catalog context to resolve the ids it keeps in localStorage, and that
          provider is only mounted for signed-in buyers — `useCatalog` throws rather than
          degrading, so this cannot render for an anonymous visitor. */}
      {showPricing && (
        <div className="mt-14 border-t border-stone-300 pt-8">
          <RecentlyViewedStrip excludeStyleId={style.id} />
        </div>
      )}
    </div>
  );
}

/** Reassurance row under the buy box — every line is a real policy or real account data, never a generic badge. */
/**
 * A person to ask. The policy points that used to be a five-tick list here are in the
 * "Ordering, shipping & returns" section below, for whoever wants them.
 */
function ProductContact({ rep, dict, styleName }: { rep?: SalesRep; dict: Dictionary; styleName: string }) {
  return (
    <p className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
      {rep && (
        <span>
          {dict.dashboard.yourRep}{" "}
          <a href={`mailto:${rep.email}`} className="text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
            {rep.name}
          </a>
        </span>
      )}
      {/* The floating WhatsApp button hides on a phone's product page (the buy bar sits
          there), so the same way to ask is offered here — with the product named. */}
      <a
        href={whatsappHref(t(dict.contact.whatsappProductMessage, { name: styleName }))}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
      >
        {dict.contact.whatsappAria}
      </a>
    </p>
  );
}

/**
 * This route deliberately has **no `loading.tsx`**.
 *
 * It had one, and that Suspense boundary opted the segment into streaming: Next flushed the
 * 200 shell before the page body ran, so by the time `notFound()` threw, the status line was
 * already sent. A bad product slug then answered **HTTP 200** with a client-rendered 404 —
 * a soft 404, confirmed against production, not just dev. The visitor saw the right screen;
 * a crawler saw a valid page at every misspelled URL.
 *
 * The trade is a skeleton on navigation versus a truthful status code. The status wins,
 * especially with `commerce_indexable` due to be switched on. If a skeleton is wanted back,
 * it has to come with the product lookup resolved *above* the boundary, not inside it.
 */
