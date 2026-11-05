import { withLocale } from "@/i18n/paths";
import { Suspense } from "react";
import Link from "next/link";
import { getStorefrontStyles, searchStyleIds } from "@/lib/data/styles";
import { matchStylesBySynonyms } from "@/lib/searchSynonyms";
import { colorOptionsFromStyles, filterStyles, parseFilters } from "@/lib/catalogFilters";
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
import { CatalogCategoryNav, CatalogSeasonSwitch, CatalogSearchInput, CatalogFiltersPanel, CatalogResultsToolbar } from "@/components/catalog/CatalogToolbar";
import { categoryCounts, groupByCategory } from "@/lib/catalogGroups";
import { categoryLabel } from "@/lib/data/styleLabels";
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
    // Greek (and trade) words first — the database index is English-only; see searchSynonyms.
    filters.q ? (matchStylesBySynonyms(filters.q, styles) ?? searchStyleIds(filters.q)) : Promise.resolve(undefined),
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
  // Winter first: that's the order a buyer reads them in, and it's fixed so it doesn't jump.
  // A style sold in both seasons belongs to both, same as `filterStyles`.
  const matchesSeason = (style: (typeof styles)[number], season: string) => style.season === "both" || style.season === season;
  const seasons = ["winter", "summer"]
    .filter((value) => seasonOptions.some((o) => o.value === value))
    .map((value) => ({ value, count: styles.filter((s) => matchesSeason(s, value)).length }));
  const inSeason = filters.season.length > 0 ? styles.filter((s) => filters.season.some((season) => matchesSeason(s, season))) : styles;
  // Just looking, as opposed to asking for something specific.
  const isBrowsing = sort === "newest" && !filters.q && filters.category.length === 0 && filters.color.length === 0 && filters.flag.length === 0 && filters.price.length === 0 && filters.box.length === 0 && filters.gender.length === 0 && filters.availability.length === 0;
  const imagesByStyle = view === "grid" ? await listImagesForStyles(results.map((s) => s.id)) : {};

  return (
    <div className="mx-auto max-w-[1800px] pb-24">
      {/* A title and the one thing true of every style; the longer keyword copy sits at the
          foot of the page, where it serves search engines without standing between a buyer
          and the shoes. */}
      <header className="px-6 pb-12 pt-16 lg:px-10 lg:pt-24">
        <h1 className="font-display text-5xl leading-[1.05] text-ink lg:text-7xl">{dict.seo.catalogueHeading}</h1>
        <p className="mt-6 text-sm text-ink-soft">
          {t(dict.catalog.arrivesAround, { date: arrivalLabel })}
          {!showPricing && ` · ${dict.catalog.tradePricingOnApproval}`}
        </p>
        <Suspense fallback={null}>
          <CatalogSeasonSwitch seasons={seasons} total={styles.length} />
        </Suspense>
      </header>

      <div className="sticky top-(--shell-header-h) z-20 border-y border-stone-200 bg-white/95 backdrop-blur">
        <div className="flex flex-col gap-2 px-6 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-10">
          <Suspense fallback={null}>
            <CatalogCategoryNav categories={categoryCounts(inSeason)} total={inSeason.length} />
          </Suspense>
          <div className="flex items-center gap-5 lg:shrink-0 lg:gap-6">
            <div className="min-w-0 flex-1 lg:flex-none">
              <Suspense fallback={null}>
                <CatalogSearchInput />
              </Suspense>
            </div>
            <Suspense fallback={null}>
              <CatalogResultsToolbar showPricing={showPricing} />
            </Suspense>
            <Suspense fallback={null}>
              <CatalogFiltersPanel
              colorOptions={colorOptionsFromStyles(styles)}
            />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Reads the currently-visible results, not the whole catalogue, so the figures always
          describe what's actually on screen — and it disappears on its own when no discounted
          style is in view. */}
      {/* Quotes a discount rate and says it is "already applied to the prices below" —
          meaningless, and slightly misleading, when there are no prices below. */}
      {showPricing && <div className="px-6 pt-6 lg:px-10"><SaleBanner styles={results} seasonFiltered={filters.season.length > 0} dict={dict} locale={locale} /></div>}

      {results.length === 0 ? (
        <div className="mx-6 mt-10 bg-stone-100 px-6 py-24 text-center lg:mx-10">
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
        <div className="flex flex-col gap-3 px-6 pt-10 lg:px-10">
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
            />
          ))}
        </div>
      ) : (
        // Chapters (2026-11-05, owner: the flat grid "looks like some little photos"). Large
        // photos edge to edge, one chapter per category, the colours of a model side by side.
        // A search, filter or chosen sort is a question with its own order, so it gets one
        // plain grid instead. On a phone, an odd chapter opens with one full-width photo.
        <div>
          {(isBrowsing ? groupByCategory(results) : [{ category: undefined, styles: results }]).map((group, g) => (
            <section key={group.category ?? "results"} className="pt-14 lg:pt-20">
              <div className="mb-8 flex items-baseline justify-between gap-4 px-6 lg:px-10">
                {group.category ? (
                  <h2 className="font-display text-3xl leading-tight text-ink lg:text-5xl">{categoryLabel(dict, group.category)}</h2>
                ) : (
                  <span />
                )}
                <span className="text-sm tabular-nums text-ink-soft">
                  {group.styles.length === 1 ? dict.catalog.styleCountOne : t(dict.catalog.styleCount, { count: group.styles.length })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-0.5 gap-y-12 lg:grid-cols-3">
                {group.styles.map((style, i) => (
                  <div key={style.id} className={i === 0 && group.styles.length % 2 === 1 ? "col-span-2 lg:col-span-1" : undefined}>
                    <ProductCard
                      style={style}
                      totalOnHand={totalOnHandForStyle(style.id, inventory)}
                      priceMultiplier={priceMultiplier}
                      showPricing={showPricing}
                      favorited={account ? favoriteIds.has(style.id) : undefined}
                      inventory={account ? inventory[style.id] : undefined}
                      images={imagesByStyle[style.id] ?? []}
                      inset
                      // Only what can be on the first screen: more would compete for bandwidth
                      // with the photos actually visible on a phone.
                      priority={g === 0 && i < 2}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-24 max-w-2xl px-6 text-sm leading-relaxed text-ink-soft lg:px-10">{dict.seo.catalogueIntro}</p>
    </div>
  );
}
