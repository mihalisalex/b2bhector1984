import Link from "next/link";
import { listJournalPostsForAdmin } from "@/lib/data/journalPosts";
import type { JournalStatus } from "@/lib/types";

export const metadata = { title: "Journal", robots: { index: false, follow: false } };

const STATUS_CLASSES: Record<JournalStatus, string> = {
  published: "bg-positive-100 text-positive",
  draft: "bg-stone-200 text-ink-soft",
  scheduled: "bg-court-100 text-court",
  archived: "bg-stone-100 text-ink-soft/70",
};

export default async function AdminJournalPage() {
  const posts = await listJournalPostsForAdmin();

  return (
    <div>
      <div className="flex items-center justify-between border-b border-stone-300 pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Journal</h1>
          <p className="mt-2 text-sm text-ink-soft">SEO content hub — buyer/supplier guides, market insights, case studies.</p>
        </div>
        <Link
          href="/admin/journal/new"
          className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
        >
          New article
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          No articles yet — if this is unexpected, check that migration 0027_journal.sql has been run.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto border border-stone-300">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-stone-300 bg-stone-100 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/journal/${post.id}`} className="font-semibold text-ink hover:text-signal hover:underline">
                      {post.title}
                    </Link>
                    <div className="text-xs text-ink-soft">/journal/{post.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{post.category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASSES[post.status]}`}>
                      {post.status}
                    </span>
                    {post.featured && (
                      <span className="ml-1.5 inline-block bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{new Date(post.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
