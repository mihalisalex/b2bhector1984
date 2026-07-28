import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABEL, GENDER_LABEL, getRelatedStyles, getStyleBySlug, getStyleImageUrl } from "@/lib/data/styles";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { getInventoryForStyle, getInventoryForStyles, type StyleInventory } from "@/lib/data/inventory";
import { listImagesForStyle } from "@/lib/data/styleImages";
import { getCurrentAccount } from "@/lib/session";
import { formatEUR } from "@/lib/pricing";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { StylePlate } from "@/components/product/StylePlate";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductCard } from "@/components/product/ProductCard";
import { SizeChart } from "@/components/product/SizeChart";
import { MatrixOrderGrid } from "@/components/matrix/MatrixOrderGrid";

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

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-ink-soft">
        <Link href="/catalogue" className="hover:text-ink">Catalogue</Link>
        <span>/</span>
        <Link href={`/catalogue?category=${style.category}`} className="hover:text-ink">
          {CATEGORY_LABEL[style.category]}
        </Link>
        <span>/</span>
        <span className="text-ink">{style.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,440px)_1fr]">
        <div>
          {images.length > 0 ? (
            <ProductGallery images={images} styleName={style.name} styleNumber={style.styleNumber} />
          ) : (
            <StylePlate
              swatch={style.colorways[0].swatch}
              styleNumber={style.styleNumber}
              imageUrl={getStyleImageUrl(style)}
              alt={style.name}
              className="aspect-[4/3] w-full"
            />
          )}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {style.colorways.map((c) => (
              <div
                key={c.id}
                role="img"
                aria-label={c.name}
                title={c.name}
                className="flex h-14 overflow-hidden border border-stone-300"
              >
                <span aria-hidden className="h-full w-1/2" style={{ background: c.swatch[0] }} />
                <span aria-hidden className="h-full w-1/2" style={{ background: c.swatch[1] ?? c.swatch[0] }} />
              </div>
            ))}
          </div>
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
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">{style.description}</p>

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

      <div className="mt-10">
        <h2 className="font-display mb-3 text-lg font-bold uppercase tracking-tight text-ink">
          Build Your Order
        </h2>
        <MatrixOrderGrid style={style} inventory={inventory} priceMultiplier={priceMultiplier} />
      </div>

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
