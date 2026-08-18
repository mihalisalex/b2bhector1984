import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABEL, GENDER_LABEL, getRelatedStyles, getStyleBySlug, getStyleImageUrl } from "@/lib/data/styles";
import { getInventoryForStyle, getInventoryForStyles, totalOnHandForStyle } from "@/lib/data/inventory";
import { listImagesForStyle, listImagesForStyles } from "@/lib/data/styleImages";
import { getCurrentAccount } from "@/lib/session";
import { recordStyleView } from "@/lib/data/styleAnalytics";
import { isFavorite } from "@/lib/data/favorites";
import { pickDefaultColorway } from "@/lib/productSelectionDefaults";
import { ColorwaySelectionProvider } from "@/lib/colorway-selection-context";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { StylePlate } from "@/components/product/StylePlate";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetails } from "@/components/product/ProductDetails";
import { PrimaryPurchasePanel, BUY_BAR_RELEASE_ID } from "@/components/product/PrimaryPurchasePanel";
import { TrackRecentlyViewed } from "@/components/product/TrackRecentlyViewed";
import { RecentlyViewedStrip } from "@/components/product/RecentlyViewedStrip";
import { JsonLd } from "@/components/seo/JsonLd";
import { productMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildProductSchema } from "@/lib/seoJsonLd";
import { getSeoSettings } from "@/lib/data/seoSettings";
import type { Metadata } from "next";
import type { SalesRep } from "@/lib/types";

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const style = await getStyleBySlug(slug);
  if (!style) return { title: "Style", robots: { index: false, follow: false } };

  // Everything — title, description, canonical, share card, robots — comes from
  // the product's own SEO fields, falling back to generated copy. The robots
  // value is clamped by the global indexing policy inside `productMetadata`, so
  // a per-product "index,follow" can never leak trade pricing while the
  // catalogue is private.
  const images = await listImagesForStyle(style.id);
  const primary = images.find((image) => image.isPrimary) ?? images[0];
  return productMetadata(style, primary?.publicUrl);
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (LEGACY_SLUG_REDIRECTS[slug]) redirect(`/product/${LEGACY_SLUG_REDIRECTS[slug]}`);
  const style = await getStyleBySlug(slug);
  // A draft/archived product, or one with no colorways yet (every card/gallery below
  // assumes colorways[0] exists), should 404 rather than crash the page for anyone who
  // hits the URL — including via a stale cart/search/bookmark link.
  if (!style || (style.status ?? "active") !== "active" || style.colorways.length === 0) notFound();
  const [inventory, images, related, account] = await Promise.all([
    getInventoryForStyle(style.id),
    listImagesForStyle(style.id),
    getRelatedStyles(style),
    getCurrentAccount(),
  ]);
  const [relatedInventory, relatedImages] = await Promise.all([
    getInventoryForStyles(related.map((s) => s.id)),
    listImagesForStyles(related.map((s) => s.id)),
  ]);
  const priceMultiplier = account?.priceMultiplier ?? 1;
  const favorited = account ? await isFavorite(account.id, style.id) : false;
  void recordStyleView(style.id, account?.id ?? null);

  // Structured data. Both builders return null when the corresponding schema
  // type is switched off in the SEO settings, and JsonLd renders nothing for a
  // null — so an admin can disable either without touching this page.
  const seoSettings = await getSeoSettings();
  const productSchema = buildProductSchema(style, seoSettings, {
    imageUrls: images.length > 0 ? images.map((image) => image.publicUrl) : [getStyleImageUrl(style)],
    // `inventory` here is this style's own colorway→box map (not the batched
    // styleId-keyed record `totalOnHandForStyle` expects), so it sums directly.
    inStock: totalOnHandForStyle(style.id, { [style.id]: inventory }) > 0,
  });
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Catalogue", path: "/catalogue" },
      { name: CATEGORY_LABEL[style.category], path: `/catalogue?category=${style.category}` },
      { name: style.name, path: `/product/${style.slug}` },
    ],
    seoSettings,
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
        <nav className="mb-4 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.06em] text-ink-soft">
          <Link href="/catalogue" className="hover:text-ink">Catalogue</Link>
          <span>/</span>
          <Link href={`/catalogue?category=${style.category}`} className="hover:text-ink">
            {CATEGORY_LABEL[style.category]}
          </Link>
          <span>/</span>
          <span className="text-ink">{style.name}</span>
        </nav>

        <ColorwaySelectionProvider initialColorwayId={pickDefaultColorway(style, inventory, images)}>
          {/* The grid lives INSIDE the provider on purpose: the gallery and the purchase
              panel are two halves of one colorway selection, so they have to stay under the
              same provider no matter how they're arranged. `items-start` keeps the details
              column from stretching to the photo's height. */}
          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-12">
            {/* Photo column. min-w-0 on both halves so a wide gallery can't blow the grid
                track out past 50% — grid items default to min-width:auto. */}
            <div className="lg:min-w-0">
              {images.length > 0 ? (
                <ProductGallery images={images} styleName={style.name} styleNumber={style.styleNumber} colorways={style.colorways} />
              ) : (
                // Full-bleed below lg: breaking out of the page's own horizontal padding is
                // what makes the photo feel large rather than inset in a box. Reverts at lg,
                // where the column above has already capped/centered the width, so there's
                // nothing left to break out of.
                <div className="-mx-6 lg:mx-0">
                  <StylePlate
                    swatch={style.colorways[0].swatch}
                    styleNumber={style.styleNumber}
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
              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 lg:mt-0">
                {/* Same conflict as the catalogue card: the purchase panel below already
                    states the real fulfilment ("Made to order — ships in ~N days"), so
                    "Available now" beside it read as a contradiction. */}
                <AvailabilityBadge
                  style={style}
                  stockOverridden={totalOnHandForStyle(style.id, { [style.id]: inventory }) === 0}
                />
                <span className="font-mono-tab text-[11px] uppercase tracking-[0.14em] text-ink-soft">
                  {style.styleNumber}
                </span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-ink-soft">
                  {CATEGORY_LABEL[style.category]} · {GENDER_LABEL[style.gender]}
                </span>
              </div>

              <h1 className="font-display mt-4 text-[2.25rem] font-bold uppercase leading-[0.95] tracking-[-0.02em] text-ink">
                {style.name}
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{style.tagline}</p>

              <div className="mt-6">
                <PrimaryPurchasePanel
                  style={style}
                  inventory={inventory}
                  priceMultiplier={priceMultiplier}
                  initialFavorited={favorited}
                />
              </div>

              <TrustStrip rep={account?.rep} />
            </div>
          </div>
        </ColorwaySelectionProvider>

        <ProductDetails style={style} minOrderPairs={account?.minOrderPairs} />
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
                images={relatedImages[r.id] ?? []}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-14 border-t border-stone-300 pt-8">
        <RecentlyViewedStrip excludeStyleId={style.id} />
      </div>
    </div>
  );
}

/** Reassurance row under the buy box — every line is a real policy or real account data, never a generic badge. */
function TrustStrip({ rep }: { rep?: SalesRep }) {
  return (
    <ul className="mt-4 grid grid-cols-1 gap-2 text-xs text-ink-soft sm:grid-cols-2">
      <TrustItem>Fixed pre-pack boxes — EU 40–45 run, no broken sizes</TrustItem>
      <TrustItem>Prepay 10% off · Net 30 5% off · Net 60 at list</TrustItem>
      <TrustItem>Live stock — availability updates as orders are placed</TrustItem>
      {rep ? (
        <TrustItem>
          Your rep{" "}
          <a href={`mailto:${rep.email}`} className="font-medium text-ink underline hover:text-signal">
            {rep.name}
          </a>
          {rep.phone ? ` · ${rep.phone}` : ""}
        </TrustItem>
      ) : (
        <TrustItem>Territory rep assigned to every approved account</TrustItem>
      )}
    </ul>
  );
}

function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 leading-snug">
      <span aria-hidden className="mt-[3px] text-ink">
        ✓
      </span>
      <span>{children}</span>
    </li>
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
