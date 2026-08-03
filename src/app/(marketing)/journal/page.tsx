import { LinkButton } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildCollectionSchema } from "@/lib/seoJsonLd";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { getPublishedJournalPosts } from "@/lib/data/journalPosts";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { JournalFilters } from "@/components/journal/JournalFilters";
import { JOURNAL_CATEGORIES } from "@/lib/types";

export function generateMetadata() {
  return pageMetadata({
    title: "Journal",
    description:
      "Wholesale buying guides, supplier sourcing advice, and footwear industry insights from Hector Footwear — practical reading for retail buyers before they place an order.",
    path: "/journal",
  });
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const [allPosts, settings] = await Promise.all([getPublishedJournalPosts(), getSeoSettings()]);

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

  const breadcrumbSchema = buildBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Journal", path: "/journal" }], settings);
  const collectionSchema = buildCollectionSchema({
    name: "Journal",
    description: "Wholesale buying guides, supplier sourcing advice, and footwear industry insights.",
    path: "/journal",
    items: filtered.map((post) => ({ name: post.title, path: `/journal/${post.slug}`, imageUrl: post.featuredImageUrl })),
  });

  return (
    <div>
      <JsonLd schema={[breadcrumbSchema, collectionSchema].filter((s): s is NonNullable<typeof s> => s !== null)} />

      <section className="border-b border-stone-300 bg-stone-100 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">Journal</span>
          <h1 className="font-display mt-4 text-4xl font-bold uppercase leading-[1.02] tracking-tight text-ink sm:text-5xl">
            Wholesale, decoded.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
            Sourcing guides, market trends, and procurement insight for buyers and suppliers in the footwear trade —
            written by the same team that runs the marketplace.
          </p>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 pt-16 lg:px-10">
          <h2 className="font-display border-b border-stone-300 pb-4 text-xl font-bold uppercase tracking-tight text-ink">
            Featured
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((post, i) => (
              <ArticleCard key={post.id} post={post} priority={i === 0} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1200px] px-6 py-16 lg:px-10">
        <JournalFilters categoryCounts={categoryCounts} />

        {gridPosts.length === 0 ? (
          <div className="mt-10 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
            No articles match that search yet.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
              Ready to see the collection?
            </h2>
            <p className="mt-1 text-sm text-stone-300/80">Browse Hector Footwear&rsquo;s wholesale catalogue, or apply for a trade account.</p>
          </div>
          <div className="flex gap-3">
            <LinkButton href="/collections" size="lg" variant="secondary" className="!border-white !text-white hover:!bg-white hover:!text-ink">
              Browse collections
            </LinkButton>
            <LinkButton href="/apply" size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
              Apply for access
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
