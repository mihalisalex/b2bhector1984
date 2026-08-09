import { getStorefrontStyles, CATEGORY_LABEL } from "@/lib/data/styles";
import { getSeasonSettings, toSeasonOptions } from "@/lib/data/seasonSettings";
import type { Category, Season } from "@/lib/types";
import { LinkButton } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { CollectionsExplorer } from "@/components/marketing/CollectionsExplorer";
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

/**
 * Redesigned 2026-08-09: minimal-copy, image-led editorial grid, replacing the previous
 * text-heavy pill-filter layout. Scoped to this one page only — every interactive part
 * (season toggle, category filter, sort) lives in `CollectionsExplorer`, a client
 * component that filters/sorts the already-fetched style list instantly in the browser;
 * this file stays a server component responsible only for the initial data fetch,
 * metadata/schema, and the small amount of static copy around the explorer.
 */
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
  const enabledSeasonValues = seasonOptions.map((s) => s.value);
  const initialSeason = enabledSeasonValues.includes(season as Season)
    ? (season as Season)
    : seasonOptions[0]?.value;
  const initialCategory = (Object.keys(CATEGORY_LABEL) as Category[]).includes(category as Category)
    ? (category as Category)
    : undefined;

  // CollectionPage + ItemList for the public lookbook, seeded from whichever season/
  // category the URL actually landed on — the explorer below re-filters instantly beyond
  // that, but a crawler only ever sees this one server-rendered snapshot per URL anyway.
  const seeded = styles.filter(
    (s) =>
      (!initialSeason || s.season === initialSeason || s.season === "both") &&
      (!initialCategory || s.category === initialCategory),
  );
  const collectionSchema = buildCollectionSchema({
    name: initialCategory ? CATEGORY_LABEL[initialCategory] : d.heading,
    description: `${seeded.length} styles from the Hector Footwear ${initialSeason ?? "current"} collection.`,
    path: withLocale(locale, "/collections"),
    items: seeded.map((style) => ({ name: style.name, path: withLocale(locale, "/collections") })),
  });

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
      <JsonLd schema={collectionSchema} />

      <div className="mb-8">
        <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">{d.eyebrow}</span>
        <h1 className="font-display mt-2 text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
          {d.heading}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">{d.intro}</p>
      </div>

      <CollectionsExplorer
        styles={styles}
        seasonOptions={seasonOptions}
        categoryLabel={CATEGORY_LABEL}
        locale={locale}
        dict={d}
        initialSeason={initialSeason}
        initialCategory={initialCategory}
      />

      <div className="mt-20 flex flex-col items-center gap-3 border-t border-stone-300 pt-10 text-center">
        <p className="text-sm text-ink-soft">{d.notWholesaleYet}</p>
        <LinkButton href={withLocale(locale, "/apply")} size="lg">
          {dict.nav.applyForAccess}
        </LinkButton>
      </div>
    </div>
  );
}
