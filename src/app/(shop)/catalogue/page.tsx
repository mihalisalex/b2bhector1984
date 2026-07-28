import { Suspense } from "react";
import { getAllStyles } from "@/lib/data/styles";
import { filterStyles, parseFilters } from "@/lib/catalogFilters";
import { getInventoryForStyles, type StyleInventory } from "@/lib/data/inventory";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { BoxPolicyBanner } from "@/components/catalog/BoxPolicyBanner";
import { ProductCard } from "@/components/product/ProductCard";

function totalOnHand(styleId: string, inventory: Record<string, StyleInventory>): number {
  const byColorway = inventory[styleId] ?? {};
  return Object.values(byColorway).reduce(
    (sum, byBox) => sum + Object.values(byBox).reduce((s: number, n) => s + (n ?? 0), 0),
    0,
  );
}

export const metadata = { title: "Catalog", robots: { index: false, follow: false } };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const styles = await getAllStyles();
  const filters = parseFilters(sp);
  const results = filterStyles(styles, filters);
  const inventory = await getInventoryForStyles(results.map((s) => s.id));

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
      <div className="mb-6 flex flex-col gap-2 border-b border-stone-300 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Catalog</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {styles.length} styles across Summer and Winter collections. Wholesale price is set by payment terms at checkout.
          </p>
        </div>
      </div>

      <BoxPolicyBanner />

      <div className="flex flex-col gap-8 lg:flex-row">
        <Suspense fallback={null}>
          <CatalogFilters resultCount={results.length} />
        </Suspense>

        <div className="flex-1">
          <div className="mb-4 hidden items-center justify-between lg:flex">
            <span className="font-mono-tab text-xs text-ink-soft">{results.length} styles</span>
          </div>

          {results.length === 0 ? (
            <div className="border border-dashed border-stone-300 bg-stone-100 px-6 py-20 text-center">
              <p className="font-display text-lg font-bold uppercase text-ink">No styles match this filter</p>
              <p className="mt-2 text-sm text-ink-soft">
                Try clearing a filter or searching a different style name or number.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((style) => (
                <ProductCard key={style.id} style={style} totalOnHand={totalOnHand(style.id, inventory)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
