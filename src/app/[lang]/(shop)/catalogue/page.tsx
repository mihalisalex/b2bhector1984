import { Suspense } from "react";
import Link from "next/link";
import { getStorefrontStyles, searchStyleIds } from "@/lib/data/styles";
import { filterStyles, parseFilters } from "@/lib/catalogFilters";
import { isSortKey, pairsSoldByStyle, sortStyles } from "@/lib/catalogSort";
import { getInventoryForStyles, totalOnHandForStyle } from "@/lib/data/inventory";
import { listImagesForStyles } from "@/lib/data/styleImages";
import { getFavoriteStyleIds } from "@/lib/data/favorites";
import { getCurrentAccount } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSeasonSettings, toSeasonOptions } from "@/lib/data/seasonSettings";
import { CatalogSearchInput, CatalogFiltersPanel, CatalogResultsToolbar } from "@/components/catalog/CatalogToolbar";
import { SaleBanner } from "@/components/catalog/SaleBanner";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductListRow } from "@/components/product/ProductListRow";
import { commerceMetadata } from "@/lib/seo";

/**
 * Robots comes from the global indexing policy rather than being hardcoded, so
 * this page, robots.txt and the sitemap always agree. It resolves to
 * `noindex,nofollow` while the trade catalogue is private, which is the default.
 */
export function generateMetadata() {
  return commerceMetadata({
    title: "Catalogue",
    description:
      "The full Hector Footwear wholesale catalogue — every style, colourway and box configuration, with live stock and trade pricing.",
    path: "/catalogue",
  });
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const sortParam = typeof sp.sort === "string" ? sp.sort : "newest";
  const sort = isSortKey(sortParam) ? sortParam : "newest";
  const view = sp.view === "list" ? "list" : "grid";

  // Everything here is independent of the filter result, so it all goes out at once.
  // Inventory covers the *whole* catalogue rather than the filtered subset: the
  // "in stock now" filter has to be evaluated before we know what's left, and Quick Add
  // needs per-colorway stock for whatever survives anyway.
  const [styles, seasonSettings, account, { data: orderLineRows }] = await Promise.all([
    getStorefrontStyles(),
    getSeasonSettings(),
    getCurrentAccount(),
    sort === "best_selling"
      ? supabaseAdmin.from("order_lines").select("style_id, box_type_id, qty")
      : Promise.resolve({ data: null }),
  ]);
  const seasonOptions = toSeasonOptions(seasonSettings);
  const [matchedIds, inventory] = await Promise.all([
    filters.q ? searchStyleIds(filters.q) : Promise.resolve(undefined),
    getInventoryForStyles(styles.map((s) => s.id)),
  ]);
  const inStockIds = new Set(styles.filter((s) => totalOnHandForStyle(s.id, inventory) > 0).map((s) => s.id));
  const filtered = filterStyles(styles, filters, matchedIds, inStockIds);

  const favoriteIds = account ? await getFavoriteStyleIds(account.id) : new Set<string>();
  const priceMultiplier = account?.priceMultiplier ?? 1;
  const results = sortStyles(filtered, sort, orderLineRows ? pairsSoldByStyle(orderLineRows) : undefined);
  // Only for what's actually rendered this request — cheaper than batching the whole catalogue.
  const imagesByStyle = view === "grid" ? await listImagesForStyles(results.map((s) => s.id)) : {};

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
      <nav className="mb-3 text-xs text-ink-soft">
        <Link href="/dashboard" className="hover:text-ink">Home</Link> <span className="mx-1">/</span> <span className="text-ink">Catalog</span>
      </nav>
      <div className="mb-6 flex flex-col gap-3 border-b border-stone-300 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">Catalog</h1>
        </div>
        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <CatalogSearchInput />
          </Suspense>
          <Suspense fallback={null}>
            <CatalogFiltersPanel seasonOptions={seasonOptions} />
          </Suspense>
        </div>
      </div>

      <div className="mb-4 mt-6">
        <Suspense fallback={null}>
          <CatalogResultsToolbar resultCount={results.length} />
        </Suspense>
      </div>

      {/* Reads the currently-visible results, not the whole catalogue, so the figures always
          describe what's actually on screen — and it disappears on its own when no discounted
          style is in view. */}
      <SaleBanner styles={results} seasonFiltered={filters.season.length > 0} />

      {results.length === 0 ? (
        <div className="border border-dashed border-stone-300 bg-stone-100 px-6 py-20 text-center">
          <p className="font-display text-lg font-bold uppercase text-ink">No styles match this filter</p>
          <p className="mt-2 text-sm text-ink-soft">
            {`${styles.length} styles are available — the current combination just doesn’t overlap.`}
          </p>
          {/* A dead-end empty state is the one place a buyer is most likely to give up, so it
              carries the recovery action rather than only describing it. */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/catalogue"
              className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
            >
              Clear all filters
            </Link>
            <Link
              href="/quick-order"
              className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white"
            >
              Browse full linesheet
            </Link>
          </div>
        </div>
      ) : view === "list" ? (
        <div className="flex flex-col gap-3">
          {results.map((style) => (
            <ProductListRow
              key={style.id}
              style={style}
              totalOnHand={totalOnHandForStyle(style.id, inventory)}
              priceMultiplier={priceMultiplier}
              favorited={account ? favoriteIds.has(style.id) : undefined}
            />
          ))}
        </div>
      ) : (
        // Two big columns on phones/tablets, three from `lg` up. Still deliberately not a
        // 1→2→3 ramp: the point is tall photos that read as "premium fashion editorial"
        // rather than a dense product grid, so it never drops to a single column and never
        // goes past three. `lg` (not `md`) is the desktop step used across the rest of the
        // site, and it keeps tablets on the roomier 2-up. A hairline 2px gap is the only
        // separation between products and from the page edges — breaks out of the page's
        // own horizontal padding (-mx-6/lg:-mx-10) to get there.
        <div className="-mx-6 lg:-mx-10">
          <div className="grid grid-cols-2 gap-0.5 px-0.5 lg:grid-cols-3">
            {results.map((style, i) => (
              <ProductCard
                key={style.id}
                style={style}
                totalOnHand={totalOnHandForStyle(style.id, inventory)}
                priceMultiplier={priceMultiplier}
                favorited={account ? favoriteIds.has(style.id) : undefined}
                inventory={account ? inventory[style.id] : undefined}
                images={imagesByStyle[style.id] ?? []}
                // Deliberately still 2, not 3, even though `lg` now fits three per row: this
                // preloads, and on a phone (where LCP is actually measured) the third card
                // is below the fold, so a third preload would compete with the two visible
                // ones for bandwidth — the same mistake that cost the homepage hero on
                // 2026-08-13. The desktop third card lazy-loads, but it's in the viewport
                // on load so the browser fetches it immediately anyway.
                priority={i < 2}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
