import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABEL, GENDER_LABEL, getRelatedStyles, getStyleBySlug, getStyleImageUrl } from "@/lib/data/styles";
import { getInventoryForStyle, getInventoryForStyles, totalOnHandForStyle } from "@/lib/data/inventory";
import { listImagesForStyle } from "@/lib/data/styleImages";
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
import { PrimaryPurchasePanel } from "@/components/product/PrimaryPurchasePanel";
import { TrackRecentlyViewed } from "@/components/product/TrackRecentlyViewed";
import { RecentlyViewedStrip } from "@/components/product/RecentlyViewedStrip";
import type { SalesRep } from "@/lib/types";

/** Old slugs from before a product's name/slug was corrected — kept so existing
 * bookmarks/backlinks 301 instead of 404ing. Add an entry here (never rename the DB
 * `slug` column and just delete the old mapping) whenever a live slug changes. */
const LEGACY_SLUG_REDIRECTS: Record<string, string> = {
  "riviera-loafer": "hector-boat-loafer", // HL-1001, corrected 2026-07-29 — was stale from an earlier product rename
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const style = await getStyleBySlug(slug);
  return {
    title: style ? style.name : "Style",
    description: style?.tagline,
    robots: { index: false, follow: false },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (LEGACY_SLUG_REDIRECTS[slug]) redirect(`/product/${LEGACY_SLUG_REDIRECTS[slug]}`);
  const style = await getStyleBySlug(slug);
  if (!style) notFound();
  const [inventory, images, related, account] = await Promise.all([
    getInventoryForStyle(style.id),
    listImagesForStyle(style.id),
    getRelatedStyles(style),
    getCurrentAccount(),
  ]);
  const relatedInventory = await getInventoryForStyles(related.map((s) => s.id));
  const priceMultiplier = account?.priceMultiplier ?? 1;
  const favorited = account ? await isFavorite(account.id, style.id) : false;
  void recordStyleView(style.id, account?.id ?? null);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
      <TrackRecentlyViewed styleId={style.id} />
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-ink-soft">
        <Link href="/catalogue" className="hover:text-ink">Catalogue</Link>
        <span>/</span>
        <Link href={`/catalogue?category=${style.category}`} className="hover:text-ink">
          {CATEGORY_LABEL[style.category]}
        </Link>
        <span>/</span>
        <span className="text-ink">{style.name}</span>
      </nav>

      <ColorwaySelectionProvider initialColorwayId={pickDefaultColorway(style, inventory)}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,440px)_1fr]">
          <div>
            {images.length > 0 ? (
              <ProductGallery images={images} styleName={style.name} styleNumber={style.styleNumber} colorways={style.colorways} />
            ) : (
              <StylePlate
                swatch={style.colorways[0].swatch}
                styleNumber={style.styleNumber}
                imageUrl={getStyleImageUrl(style)}
                alt={style.name}
                className="aspect-[4/3] w-full"
              />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <AvailabilityBadge availability={style.availability} shipWindow={style.shipWindow} />
              <span className="font-mono-tab text-xs uppercase tracking-wide text-ink-soft">{style.styleNumber}</span>
              <span className="text-xs uppercase tracking-wide text-ink-soft">
                {CATEGORY_LABEL[style.category]} · {GENDER_LABEL[style.gender]}
              </span>
            </div>

            <h1 className="font-display mt-3 text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
              {style.name}
            </h1>
            <p className="mt-2 max-w-xl text-base text-ink-soft">{style.tagline}</p>

            <div className="mt-5">
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

      <ProductDetails style={style} />

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
          </a>{" "}
          · {rep.phone}
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
