import { LinkButton } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildCollectionSchema } from "@/lib/seoJsonLd";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { getPublishedJournalPosts } from "@/lib/data/journalPosts";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { JournalFilters } from "@/components/journal/JournalFilters";
import { JOURNAL_CATEGORIES } from "@/lib/types";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return pageMetadata({
    title: dict.seo.journalTitle,
    description: dict.seo.journalDescription,
    path: "/journal",
    locale,
    // Every post is a single un-translated row (no per-locale content yet — see migration
    // 0027's header comment) — the exact same article renders under every locale prefix, so
    // hreflang alternates here would claim translated siblings that don't actually exist.
    hasLocaleVariants: false,
  });
}

export default async function JournalPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const [{ lang }, { category, q }] = await Promise.all([params, searchParams]);
  const locale = lang as Locale;
  const [allPosts, settings, dict] = await Promise.all([getPublishedJournalPosts(locale), getSeoSettings(), getDictionary(locale)]);

  const categoryCounts = Object.fromEntries(
    JOURNAL_CATEGORIES.map((c) => [c, allPosts.filter((p) => p.category === c).length]),
  ) as Record<string, number>;

  const query = q?.trim().toLowerCase();
  const filtered = allPosts.filter((post) => {
    if (category && post.category !== category) return false;
    if (query) {
      const haystack = `${post.title} ${post.excerpt} ${post.tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const isDefaultView = !category && !query;
  const featured = isDefaultView ? allPosts.filter((p) => p.featured).slice(0, 3) : [];
  const gridPosts = isDefaultView ? filtered.filter((p) => !featured.some((f) => f.id === p.id)) : filtered;

  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: dict.catalog.home, path: withLocale(locale, "/") },
      { name: "Journal", path: withLocale(locale, "/journal") },
    ],
    settings,
  );
  const collectionSchema = buildCollectionSchema({
    name: "Journal",
    description: "Wholesale buying guides, supplier sourcing advice, and footwear industry insights.",
    path: "/journal",
    items: filtered.map((post) => ({ name: post.title, path: `/journal/${post.slug}`, imageUrl: post.featuredImageUrl })),
  });

  return (
    <div>
      <JsonLd schema={[breadcrumbSchema, collectionSchema].filter((s): s is NonNullable<typeof s> => s !== null)} />

      {/* Flat, left-aligned header — matches /collections instead of the centered
          stone-100 card this used to open with. */}
      <div className="mx-auto max-w-[1200px] px-6 pb-4 pt-12 lg:px-10">
        <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">{dict.journal.eyebrow}</span>
        <h1 className="font-display mt-2 text-3xl font-bold uppercase leading-[1.05] tracking-tight text-ink sm:text-4xl">
          {dict.journal.heading}
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
          {dict.journal.intro}
        </p>
      </div>

      {featured.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 pt-8 lg:px-10">
          <h2 className="font-display border-b border-stone-300 pb-4 text-xl font-bold uppercase tracking-tight text-ink">
            {dict.journal.featured}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((post, i) => (
              <ArticleCard key={post.id} post={post} locale={locale} dict={dict} priority={i === 0} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1200px] px-6 py-16 lg:px-10">
        <JournalFilters categoryCounts={categoryCounts} dict={dict} />

        {gridPosts.length === 0 ? (
          <div className="mt-10 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
            {dict.journal.noResults}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post) => (
              <ArticleCard key={post.id} post={post} locale={locale} dict={dict} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
              {dict.journal.ctaHeading}
            </h2>
            <p className="mt-1 text-sm text-stone-300/80">{dict.journal.ctaBody}</p>
          </div>
          <div className="flex gap-3">
            <LinkButton href={withLocale(locale, "/collections")} size="lg" variant="secondary" className="!border-white !text-white hover:!bg-white hover:!text-ink">
              {dict.journal.ctaBrowse}
            </LinkButton>
            <LinkButton href={withLocale(locale, "/apply")} size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
              {dict.journal.ctaApply}
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
