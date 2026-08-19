import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentAccount } from "@/lib/session";
import { getJournalPostBySlug, getJournalPostBySlugAny, getRelatedJournalPosts } from "@/lib/data/journalPosts";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { articleMetadata } from "@/lib/seo";
import { buildArticleSchema, buildBreadcrumbSchema } from "@/lib/seoJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { LinkButton } from "@/components/ui/Button";
import type { Metadata } from "next";

async function resolvePost(slug: string) {
  const published = await getJournalPostBySlug(slug);
  if (published) return { post: published, isPreview: false };

  const account = await getCurrentAccount();
  if (account?.role === "admin") {
    const any = await getJournalPostBySlugAny(slug);
    if (any) return { post: any, isPreview: true };
  }
  return { post: undefined, isPreview: false };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await resolvePost(slug);
  if (!post) return {};
  return articleMetadata(post);
}

function readTimeMinutes(html: string): number {
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function JournalArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { post, isPreview } = await resolvePost(slug);
  if (!post) notFound();

  const [settings, related] = await Promise.all([getSeoSettings(), getRelatedJournalPosts(post, 3)]);

  const trail = [
    { name: "Home", path: "/" },
    { name: "Journal", path: "/journal" },
    { name: post.category, path: `/journal?category=${encodeURIComponent(post.category)}` },
    { name: post.title, path: `/journal/${post.slug}` },
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(trail, settings);
  const articleSchema = buildArticleSchema(post, settings);

  return (
    <div>
      <JsonLd schema={[breadcrumbSchema, articleSchema].filter((s): s is NonNullable<typeof s> => s !== null)} />

      {isPreview && (
        <div className="border-b border-court bg-court-100 px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-court">
          Draft preview — status: {post.status}. Not visible to the public until published.
        </div>
      )}

      <article>
        <header className="border-b border-stone-300 bg-stone-100 px-6 py-14 lg:px-10">
          <div className="mx-auto max-w-3xl">
            <Breadcrumbs trail={trail.map((t) => ({ name: t.name, path: t.path }))} />
            <span className="mt-4 inline-block bg-ink px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              {post.category}
            </span>
            <h1 className="font-display mt-4 text-3xl font-bold uppercase leading-[1.05] tracking-tight text-ink sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">{post.excerpt}</p>
            <p className="font-mono-tab mt-6 text-xs uppercase tracking-wide text-ink-soft">
              By {post.authorName} ·{" "}
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                : "Unpublished"}
              {post.updatedAt !== post.publishedAt && post.publishedAt && (
                <> · Updated {new Date(post.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</>
              )}{" "}
              · {readTimeMinutes(post.contentHtml)} min read
            </p>
          </div>
        </header>

        {post.featuredImageUrl && (
          <div className="relative mx-auto aspect-[21/9] w-full max-w-[1200px] overflow-hidden bg-stone-100">
            <Image src={post.featuredImageUrl} alt={post.title} fill priority sizes="(min-width: 1200px) 1200px, 100vw" className="object-cover" />
          </div>
        )}

        <div className="mx-auto max-w-3xl px-6 py-14 lg:px-10">
          <div
            className="prose max-w-none text-[15px] leading-relaxed text-ink [&_a]:text-signal [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-stone-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-ink-soft [&_h2]:font-display [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-tight [&_h3]:font-display [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-bold [&_h3]:uppercase [&_img]:my-4 [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: post.contentHtml || "<p>This article doesn't have any content yet.</p>" }}
          />

          {post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-stone-200 pt-6">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/journal?q=${encodeURIComponent(tag)}`}
                  className="border border-stone-300 px-2.5 py-1 text-xs uppercase tracking-wide text-ink-soft hover:border-ink hover:text-ink"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Internal linking: from editorial content into the real marketplace surfaces —
              the public lookbook and the buyer application flow, not fabricated pages for
              entities (suppliers) that have no public-facing route in this app. */}
          <div className="mt-10 flex flex-col gap-3 border border-stone-300 bg-stone-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Ready to source from Hector Footwear?</p>
              <p className="mt-0.5 text-sm text-ink-soft">Browse the collection or apply for a wholesale account.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <LinkButton href="/collections" size="sm" variant="secondary">
                Browse collections
              </LinkButton>
              <LinkButton href="/apply" size="sm">
                Apply for access
              </LinkButton>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-stone-300 bg-stone-50 px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="font-display border-b border-stone-300 pb-4 text-xl font-bold uppercase tracking-tight text-ink">
              Related reading
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ArticleCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
