import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABEL, GENDER_LABEL, getRelatedStyles, getStyleBySlug, getStyleImageUrl } from "@/lib/data/styles";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { getInventoryForStyle, getInventoryForStyles, type StyleInventory } from "@/lib/data/inventory";
import { listImagesForStyle } from "@/lib/data/styleImages";
import { getCurrentAccount } from "@/lib/session";
import { recordStyleView } from "@/lib/data/styleAnalytics";
import { isFavorite } from "@/lib/data/favorites";
import { formatEUR } from "@/lib/pricing";
import { pickDefaultColorway } from "@/lib/productSelectionDefaults";
import { ColorwaySelectionProvider } from "@/lib/colorway-selection-context";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { StylePlate } from "@/components/product/StylePlate";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductCard } from "@/components/product/ProductCard";
import { SizeChart } from "@/components/product/SizeChart";
import { PrimaryPurchasePanel } from "@/components/product/PrimaryPurchasePanel";
import { TrackRecentlyViewed } from "@/components/product/TrackRecentlyViewed";
import { RecentlyViewedStrip } from "@/components/product/RecentlyViewedStrip";

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

            {/* description is sanitized server-side on write (sanitizeProductDescription) to a
                fixed tag allowlist matching exactly what the admin rich-text editor can produce. */}
            <div
              className="prose mt-6 max-w-xl text-sm leading-relaxed text-ink-soft [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h2]:uppercase [&_h2]:text-ink [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-signal [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: style.description }}
            />

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-stone-300 py-5 sm:grid-cols-3">
              <Spec label="Materials" value={style.materials.join(", ")} wide />
              <Spec label="Weight" value={`${style.weightOz} oz`} />
              <Spec label="MSRP" value={formatEUR(style.msrp)} />
              <Spec label="Sold as" value={`${getAvailableBoxTypes(style).map((b) => b.totalPairs).join(" / ")}-pair boxes`} />
            </dl>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Size chart</h2>
                <a
                  href={`/api/styles/${style.id}/spec-sheet`}
                  className="text-xs font-medium uppercase tracking-wide text-ink hover:underline"
                >
                  Download Spec Sheet
                </a>
              </div>
              <SizeChart style={style} />
            </div>

            {style.lastNote && (
              <p className="mt-4 border-l-2 border-court bg-court-100/60 px-3 py-2 text-sm text-ink-soft">
                <span className="font-semibold text-ink">Rep note — </span>
                {style.lastNote}
              </p>
            )}
          </div>
        </div>
      </ColorwaySelectionProvider>

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
                totalOnHand={totalOnHand(r.id, relatedInventory)}
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

function Spec({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 sm:col-span-3" : undefined}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  );
}

function totalOnHand(styleId: string, inventory: Record<string, StyleInventory>): number {
  const byColorway = inventory[styleId] ?? {};
  return Object.values(byColorway).reduce(
    (sum, byBox) => sum + Object.values(byBox).reduce((s: number, n) => s + (n ?? 0), 0),
    0,
  );
}
