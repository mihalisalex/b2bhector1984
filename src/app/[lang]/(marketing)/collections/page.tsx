import Link from "next/link";
import { getStorefrontStyles, CATEGORY_LABEL, GENDER_LABEL, getStyleImageUrl } from "@/lib/data/styles";
import { getSeasonSettings, toSeasonOptions } from "@/lib/data/seasonSettings";
import type { Category, Season } from "@/lib/types";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { StylePlate } from "@/components/product/StylePlate";
import { LinkButton } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { buildCollectionSchema } from "@/lib/seoJsonLd";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";

/**
 * This is the site's primary public "men's leather shoes wholesale" page — the one
 * un-gated page that actually lists real products — so it carries real per-locale H1/intro
 * copy (not just translated chrome), which is why `hasLocaleVariants` isn't set to `false`
 * here the way it is on brand-story/faq/contact.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return pageMetadata({
    title: dict.seo.collectionsTitle,
    description: dict.seo.collectionsDescription,
    path: "/collections",
    locale,
  });
}

const CATEGORIES: Category[] = ["loafers", "wedding", "sneakers", "sandals", "boots", "formal", "anatomic"];
const SEASON_CATEGORIES: Record<Season, Category[]> = {
  summer: ["loafers", "wedding", "sneakers", "sandals"],
  winter: ["boots", "sneakers", "formal", "anatomic"],
};

export default async function CollectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string; season?: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const { category, season } = await searchParams;
  const [styles, seasonSettings, dict] = await Promise.all([
    getStorefrontStyles(),
    getSeasonSettings(),
    getDictionary(locale),
  ]);
  const d = dict.collections;
  const seasonOptions = toSeasonOptions(seasonSettings);
  const enabledSeasons = seasonOptions.map((s) => s.value);
  const activeSeason = enabledSeasons.includes(season as Season) ? (season as Season) : null;
  const visibleCategories = activeSeason ? SEASON_CATEGORIES[activeSeason] : CATEGORIES;
  const activeCategory =
    CATEGORIES.includes(category as Category) && visibleCategories.includes(category as Category)
      ? (category as Category)
      : null;
  const results = styles.filter(
    (s) => (!activeCategory || s.category === activeCategory) && (!activeSeason || s.season === activeSeason),
  );
  const collectionsHref = withLocale(locale, "/collections");
  const buildHref = (query: string) => `${collectionsHref}${query}`;

  // CollectionPage + ItemList for the public lookbook. Members link to
  // /collections itself rather than to /product/* — those product URLs are
  // gated and noindex, and pointing structured data at pages Google is told not
  // to crawl produces Search Console errors rather than rich results.
  const collectionSchema = buildCollectionSchema({
    name: activeCategory ? CATEGORY_LABEL[activeCategory] : d.heading,
    description: `${results.length} styles from the Hector Footwear ${activeSeason ?? "current"} collection.`,
    path: collectionsHref,
    items: results.map((style) => ({
      name: style.name,
      path: collectionsHref,
      imageUrl: getStyleImageUrl(style),
    })),
  });

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
      <JsonLd schema={collectionSchema} />
      <div className="border-b border-stone-300 pb-8">
        <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">{d.eyebrow}</span>
        <h1 className="font-display mt-2 text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
          {d.heading}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{d.intro}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <CategoryPill href={collectionsHref} active={!activeSeason} label={d.allSeasons} />
          {seasonOptions.map(({ value: s, label }) => {
            // Dropping category when it isn't part of the target season keeps the
            // category pills (and results) from silently going stale/empty.
            const keepCategory = activeCategory && SEASON_CATEGORIES[s].includes(activeCategory);
            return (
              <CategoryPill
                key={s}
                href={buildHref(`?season=${s}${keepCategory ? `&category=${activeCategory}` : ""}`)}
                active={activeSeason === s}
                label={label}
              />
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <CategoryPill
            href={activeSeason ? buildHref(`?season=${activeSeason}`) : collectionsHref}
            active={!activeCategory}
            label={d.allCategories}
          />
          {visibleCategories.map((c) => (
            <CategoryPill
              key={c}
              href={buildHref(`?category=${c}${activeSeason ? `&season=${activeSeason}` : ""}`)}
              active={activeCategory === c}
              label={CATEGORY_LABEL[c]}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((style) => (
          <Link
            key={style.id}
            href={withLocale(locale, `/product/${style.slug}`)}
            className="group block border border-stone-300 bg-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(26,29,34,0.12)]"
          >
            <div className="overflow-hidden">
              <StylePlate
                swatch={style.colorways[0].swatch}
                styleNumber={style.styleNumber}
                imageUrl={getStyleImageUrl(style)}
                alt={style.name}
                className="aspect-[4/3] w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
            </div>
            <div className="p-5">
              <AvailabilityBadge style={style} />
              <h3 className="font-display mt-2 text-lg font-bold uppercase tracking-tight text-ink group-hover:underline">
                {style.name}
              </h3>
              <p className="mt-1 text-xs text-ink-soft">
                {CATEGORY_LABEL[style.category]} · {GENDER_LABEL[style.gender]}
              </p>
              <div className="mt-3 flex items-center gap-1.5">
                {style.colorways.map((c) => (
                  <span
                    key={c.id}
                    role="img"
                    aria-label={c.name}
                    title={c.name}
                    className="flex h-4 w-6 overflow-hidden border border-stone-300"
                  >
                    <span aria-hidden className="h-full w-1/2" style={{ background: c.swatch[0] }} />
                    <span aria-hidden className="h-full w-1/2" style={{ background: c.swatch[1] ?? c.swatch[0] }} />
                  </span>
                ))}
              </div>
              <p className="mt-4 border-t border-stone-200 pt-3 text-xs font-medium uppercase tracking-wide text-signal">
                {d.signInForPricing} →
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-center gap-3 border-t border-stone-300 pt-10 text-center">
        <p className="text-sm text-ink-soft">{d.notWholesaleYet}</p>
        <LinkButton href={withLocale(locale, "/apply")} size="lg">
          {dict.nav.applyForAccess}
        </LinkButton>
      </div>
    </div>
  );
}

function CategoryPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
        active ? "border-ink bg-ink text-white" : "border-stone-300 text-ink-soft hover:border-ink hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
