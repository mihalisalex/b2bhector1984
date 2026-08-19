import { formatDate } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";
import type { JournalPost } from "@/lib/types";

function readTimeMinutes(html: string): number {
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function ArticleCard({ post, priority = false }: { post: JournalPost; priority?: boolean }) {
  return (
    <div className="group flex flex-col transition-transform duration-300 ease-out hover:-translate-y-0.5">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
        <Link href={`/journal/${post.slug}`} tabIndex={-1} aria-hidden className="block h-full w-full">
          {post.featuredImageUrl ? (
            <Image
              src={post.featuredImageUrl}
              alt={post.title}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 380px, 100vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-display text-sm uppercase tracking-[0.2em] text-ink-soft/50">Hector Footwear</span>
            </div>
          )}
        </Link>
        <span className="absolute left-2 top-2 bg-ink px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {post.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-1 pb-1 pt-3">
        <p className="font-mono-tab text-[11px] uppercase tracking-wide text-ink-soft">
          {post.publishedAt ? formatDate(post.publishedAt) : "—"} ·{" "}
          {readTimeMinutes(post.contentHtml)} min read
        </p>
        <h3 className="font-display text-base font-bold uppercase leading-tight tracking-tight text-ink">
          <Link href={`/journal/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{post.excerpt}</p>
        <Link
          href={`/journal/${post.slug}`}
          className="mt-auto flex items-center gap-1.5 pt-2 text-xs font-semibold uppercase tracking-wide text-signal"
        >
          Read more
          <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
