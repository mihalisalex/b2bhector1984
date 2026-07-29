import { Suspense } from "react";
import Link from "next/link";
import { getAllStyles, searchStyleIds } from "@/lib/data/styles";
import { filterStyles, parseFilters } from "@/lib/catalogFilters";
import { isSortKey, pairsSoldByStyle, sortStyles } from "@/lib/catalogSort";
import { getInventoryForStyles, type StyleInventory } from "@/lib/data/inventory";
import { getFavoriteStyleIds } from "@/lib/data/favorites";
import { getCurrentAccount } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { BoxPolicyBanner } from "@/components/catalog/BoxPolicyBanner";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductListRow } from "@/components/product/ProductListRow";
import { RecentlyViewedStrip } from "@/components/product/RecentlyViewedStrip";

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
  const matchedIds = filters.q ? await searchStyleIds(filters.q) : undefined;
  const filtered = filterStyles(styles, filters, matchedIds);

  const sortParam = typeof sp.sort === "string" ? sp.sort : "newest";
  const sort = isSortKey(sortParam) ? sortParam : "newest";
  const view = sp.view === "list" ? "list" : "grid";

  const [inventory, account, { data: orderLineRows }] = await Promise.all([
    getInventoryForStyles(filtered.map((s) => s.id)),
    getCurrentAccount(),
    sort === "best_selling"
      ? supabaseAdmin.from("order_lines").select("style_id, box_type_id, qty")
      : Promise.resolve({ data: null }),
  ]);
  const favoriteIds = account ? await getFavoriteStyleIds(account.id) : new Set<string>();
  const priceMultiplier = account?.priceMultiplier ?? 1;
  const results = sortStyles(filtered, sort, orderLineRows ? pairsSoldByStyle(orderLineRows) : undefined);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
      <nav className="mb-3 text-xs text-ink-soft">
        <Link href="/dashboard" className="hover:text-ink">Home</Link> <span className="mx-1">/</span> <span className="text-ink">Catalog</span>
      </nav>
      <div className="mb-6 flex flex-col gap-2 border-b border-stone-300 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Catalog</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {styles.length} styles across Summer and Winter collections. Wholesale price is set by payment terms at checkout.
          </p>
        </div>
      </div>

      <BoxPolicyBanner />

      {!filters.q && (
        <div className="mb-6">
          <RecentlyViewedStrip />
        </div>
      )}

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
          ) : view === "list" ? (
            <div className="flex flex-col gap-3">
              {results.map((style) => (
                <ProductListRow
                  key={style.id}
                  style={style}
                  totalOnHand={totalOnHand(style.id, inventory)}
                  priceMultiplier={priceMultiplier}
                  favorited={account ? favoriteIds.has(style.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((style) => (
                <ProductCard
                  key={style.id}
                  style={style}
                  totalOnHand={totalOnHand(style.id, inventory)}
                  priceMultiplier={priceMultiplier}
                  favorited={account ? favoriteIds.has(style.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
