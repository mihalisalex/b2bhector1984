import { withLocale } from "@/i18n/paths";
import { Suspense } from "react";
import Link from "next/link";
import { getStorefrontStyles, searchStyleIds } from "@/lib/data/styles";
import { availableFlagOptions, boxOptionsFromStyles, colorOptionsFromStyles, filterStyles, parseFilters } from "@/lib/catalogFilters";
import { t } from "@/i18n/format";
import { getHomepageHero } from "@/lib/data/siteContent";
import { estimatedArrivalIso } from "@/lib/delivery";
import { formatDayMonth } from "@/lib/format";
import { isSortKey, pairsSoldByStyle, sortStyles } from "@/lib/catalogSort";
import { getInventoryForStyles, totalOnHandForStyle } from "@/lib/data/inventory";
import { listImagesForStyles } from "@/lib/data/styleImages";
import { getFavoriteStyleIds } from "@/lib/data/favorites";
import { getAccountForAudience } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSeasonSettings, toSeasonOptions } from "@/lib/data/seasonSettings";
import { CatalogSearchInput, CatalogFiltersPanel, CatalogResultsToolbar } from "@/components/catalog/CatalogToolbar";
import { SaleBanner } from "@/components/catalog/SaleBanner";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductListRow } from "@/components/product/ProductListRow";
import { commerceMetadata } from "@/lib/seo";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";

/**
 * Robots comes from the global indexing policy rather than being hardcoded, so
 * this page, robots.txt and the sitemap always agree. It resolves to
 * `noindex,nofollow` while the trade catalogue is private, which is the default.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return commerceMetadata({
    title: dict.seo.catalogueTitle,
    description: dict.seo.catalogueDescription,
    path: "/catalogue",
    locale,
  });
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; audience?: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang, audience } = await params;
  const locale = lang as Locale;
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const sortParam = typeof sp.sort === "string" ? sp.sort : "newest";
  const sort = isSortKey(sortParam) ? sortParam : "newest";
  const view = sp.view === "list" ? "list" : "grid";

  // Everything here is independent of the filter result, so it all goes out at once.
  // Inventory covers the *whole* catalogue rather than the filtered subset: the
  // "in stock now" filter has to be evaluated before we know what's left, and Quick Add
  // needs per-colorway stock for whatever survives anyway.
  const [styles, seasonSettings, account, { data: orderLineRows }, hero] = await Promise.all([
    getStorefrontStyles(),
    getSeasonSettings(),
    getAccountForAudience(audience),
    sort === "best_selling"
      ? supabaseAdmin
          .from("order_lines")
          // Cancelled orders never sold anything; keep them out of "best selling".
          .select("style_id, box_type_id, qty, orders!inner(status)")
          .neq("orders.status", "cancelled")
      : Promise.resolve({ data: null }),
    getHomepageHero(),
  ]);
  const arrivalLabel = formatDayMonth(estimatedArrivalIso(hero.productionLeadTimeDays), locale);
  const seasonOptions = toSeasonOptions(seasonSettings);
  const dict = await getDictionary(locale);
  const [matchedIds, inventory] = await Promise.all([
    filters.q ? searchStyleIds(filters.q) : Promise.resolve(undefined),
    getInventoryForStyles(styles.map((s) => s.id)),
  ]);
  const inStockIds = new Set(styles.filter((s) => totalOnHandForStyle(s.id, inventory) > 0).map((s) => s.id));
  const filtered = filterStyles(styles, filters, matchedIds, inStockIds);

  const favoriteIds = account ? await getFavoriteStyleIds(account.id) : new Set<string>();
  const priceMultiplier = account?.priceMultiplier ?? 1;
  // Public so it can be indexed; priced only for approved accounts. Same single flag as
  // the product page — see the note there.
  const showPricing = account !== null;
  const results = sortStyles(filtered, sort, orderLineRows ? pairsSoldByStyle(orderLineRows) : undefined);
  // Only for what's actually rendered this request — cheaper than batching the whole catalogue.
  const imagesByStyle = view === "grid" ? await listImagesForStyles(results.map((s) => s.id)) : {};

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
      {/* "Home" used to point at /dashboard, which redirects a signed-out visitor to
          /login — a dead end on a page that is now public, and a crawlable link into a
          gated route. Signed-in buyers still get their dashboard. */}
      <nav className="mb-3 text-xs text-ink-soft">
        <Link href={withLocale(locale, account ? "/dashboard" : "/")} className="hover:text-ink">
          {dict.catalog.home}
        </Link>{" "}
        <span className="mx-1">/</span> <span className="text-ink">{dict.nav.catalogue}</span>
      </nav>
      <div className="mb-6 flex flex-col gap-3 border-b border-stone-300 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {/* Real per-locale keyword copy. This page carries all 31 products and became
              publicly indexable on 18 Aug, at which point its H1 was the single word
              "Catalog" — no keyword, and inconsistent with the "Catalogue" spelling used
              everywhere else on the site. */}
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
            {dict.seo.catalogueHeading}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{dict.seo.catalogueIntro}</p>
        </div>
        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <CatalogSearchInput />
          </Suspense>
          <Suspense fallback={null}>
            <CatalogFiltersPanel
              seasonOptions={seasonOptions}
              colorOptions={colorOptionsFromStyles(styles)}
              flagOptions={availableFlagOptions(styles, inStockIds)}
              boxOptions={boxOptionsFromStyles(styles)}
              showPricing={showPricing}
            />
          </Suspense>
        </div>
      </div>

      <div className="mb-4 mt-6">
        <Suspense fallback={null}>
          <CatalogResultsToolbar resultCount={results.length} showPricing={showPricing} />
        </Suspense>
      </div>

      {/* Reads the currently-visible results, not the whole catalogue, so the figures always
          describe what's actually on screen — and it disappears on its own when no discounted
          style is in view. */}
      {/* Quotes a discount rate and says it is "already applied to the prices below" —
          meaningless, and slightly misleading, when there are no prices below. */}
      {showPricing && <SaleBanner styles={results} seasonFiltered={filters.season.length > 0} dict={dict} locale={locale} />}

      {results.length === 0 ? (
        <div className="border border-dashed border-stone-300 bg-stone-100 px-6 py-20 text-center">
          <p className="font-display text-lg font-bold uppercase text-ink">{dict.catalog.emptyTitle}</p>
          <p className="mt-2 text-sm text-ink-soft">{t(dict.catalog.emptyBody, { count: styles.length })}</p>
          {/* A dead-end empty state is the one place a buyer is most likely to give up, so it
              carries the recovery action rather than only describing it. */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={withLocale(locale, "/catalogue")}
              className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
            >
              {dict.catalog.clearAllFilters}
            </Link>
            {/* The order sheet needs an account; a visitor would only bounce off the login. */}
            {showPricing && (
              <Link
                href={withLocale(locale, "/quick-order")}
                className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white"
              >
                {dict.catalog.browseLinesheet}
              </Link>
            )}
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
              showPricing={showPricing}
              favorited={account ? favoriteIds.has(style.id) : undefined}
              locale={locale}
              dict={dict}
              arrivalLabel={arrivalLabel}
            />
          ))}
        </div>
      ) : (
        // Denser than the original editorial 2→3 grid (2026-09-25): buyers compare ~30
        // styles, and three tall 4:5 cards meant about six per laptop screen. With 4:3
        // photos and four columns from `xl` the same screen holds about twelve, each card
        // carrying its own pair/box price and delivery date. Never one column on a phone.
        // A hairline gap is the only separation, breaking out of the page padding.
        <div className="-mx-6 lg:-mx-10">
          <div className="grid grid-cols-2 gap-0.5 bg-stone-200 px-0.5 md:grid-cols-3 xl:grid-cols-4">
            {results.map((style, i) => (
              <ProductCard
                key={style.id}
                style={style}
                totalOnHand={totalOnHandForStyle(style.id, inventory)}
                priceMultiplier={priceMultiplier}
                showPricing={showPricing}
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
