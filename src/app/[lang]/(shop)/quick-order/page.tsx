import { Suspense } from "react";
import { getStorefrontStyles, searchStyleIds } from "@/lib/data/styles";
import { filterStyles, parseFilters } from "@/lib/catalogFilters";
import { isSortKey, sortStyles } from "@/lib/catalogSort";
import { getInventoryForStyles, totalOnHandForStyle } from "@/lib/data/inventory";
import { getCurrentAccount } from "@/lib/session";
import { getSeasonSettings, toSeasonOptions } from "@/lib/data/seasonSettings";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { LinesheetToolbar } from "@/components/catalog/LinesheetToolbar";
import { OrderableLinesheet } from "@/components/catalog/OrderableLinesheet";
import { commerceMetadata } from "@/lib/seo";

/** Robots follows the global indexing policy — see the catalogue page's note. */
export function generateMetadata() {
  return commerceMetadata({
    title: "Quick Order",
    description:
      "Build a wholesale order across many styles at once — a linesheet view with live stock and box quantities.",
    path: "/quick-order",
  });
}

export default async function QuickOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const sortParam = typeof sp.sort === "string" ? sp.sort : "newest";
  const sort = isSortKey(sortParam) ? sortParam : "newest";

  const [styles, seasonSettings, account] = await Promise.all([
    getStorefrontStyles(),
    getSeasonSettings(),
    getCurrentAccount(),
  ]);
  const seasonOptions = toSeasonOptions(seasonSettings);
  // Whole-catalogue inventory (not just the filtered subset) so the "in stock now"
  // filter can be evaluated before we know what survives — matching /catalogue.
  const [matchedIds, inventory] = await Promise.all([
    filters.q ? searchStyleIds(filters.q) : Promise.resolve(undefined),
    getInventoryForStyles(styles.map((s) => s.id)),
  ]);
  const inStockIds = new Set(styles.filter((s) => totalOnHandForStyle(s.id, inventory) > 0).map((s) => s.id));
  const results = sortStyles(filterStyles(styles, filters, matchedIds, inStockIds), sort);
  const priceMultiplier = account?.priceMultiplier ?? 1;

  return (
    <div className="mx-auto max-w-[1800px] px-6 py-8 lg:px-10 print:px-0 print:py-0">
      <div className="mb-6 flex flex-col gap-3 border-b border-stone-300 pb-6 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Quick Order</h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">
            The full collection at list price — press + or − on any box size to add it straight to your
            cart. Payment terms (and any discount) are set at checkout.
          </p>
        </div>
        <LinesheetToolbar styles={results} priceMultiplier={priceMultiplier} />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="print:hidden">
          <Suspense fallback={null}>
            <CatalogFilters resultCount={results.length} showViewToggle={false} seasonOptions={seasonOptions} />
          </Suspense>
        </div>

        <div className="min-w-0 flex-1">
          {results.length === 0 ? (
            <div className="border border-dashed border-stone-300 bg-stone-100 px-6 py-20 text-center">
              <p className="font-display text-lg font-bold uppercase text-ink">No styles match this filter</p>
              <p className="mt-2 text-sm text-ink-soft">Clear a filter to see more of the collection.</p>
            </div>
          ) : (
            <OrderableLinesheet styles={results} inventory={inventory} priceMultiplier={priceMultiplier} />
          )}
        </div>
      </div>
    </div>
  );
}
