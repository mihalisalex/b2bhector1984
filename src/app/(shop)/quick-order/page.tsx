import { Suspense } from "react";
import { getAllStyles, searchStyleIds } from "@/lib/data/styles";
import { filterStyles, parseFilters } from "@/lib/catalogFilters";
import { getInventoryForStyles } from "@/lib/data/inventory";
import { getCurrentAccount } from "@/lib/session";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { LinesheetToolbar } from "@/components/catalog/LinesheetToolbar";
import { OrderableLinesheet } from "@/components/catalog/OrderableLinesheet";

export const metadata = { title: "Quick Order", robots: { index: false, follow: false } };

export default async function QuickOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const styles = await getAllStyles();
  const filters = parseFilters(sp);
  const matchedIds = filters.q ? await searchStyleIds(filters.q) : undefined;
  const results = filterStyles(styles, filters, matchedIds);
  const [inventory, account] = await Promise.all([
    getInventoryForStyles(results.map((s) => s.id)),
    getCurrentAccount(),
  ]);
  const priceMultiplier = account?.priceMultiplier ?? 1;

  return (
    <div className="mx-auto max-w-[1800px] px-6 py-8 lg:px-10 print:px-0 print:py-0">
      <div className="mb-6 flex flex-col gap-3 border-b border-stone-300 pb-6 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Quick Order</h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">
            The full collection at list price — find a style and press + or − to build boxes directly in
            the table below. Payment terms (and any discount) are set at checkout.
          </p>
        </div>
        <LinesheetToolbar styles={results} priceMultiplier={priceMultiplier} />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="print:hidden">
          <Suspense fallback={null}>
            <CatalogFilters resultCount={results.length} />
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
