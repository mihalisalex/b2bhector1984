import Link from "next/link";
import { NewJournalPostForm } from "@/components/admin/journal/NewJournalPostForm";

export const metadata = { title: "New Article", robots: { index: false, follow: false } };

export default function NewJournalPostPage() {
  return (
    <div>
      <Link href="/admin/journal" className="text-xs font-semibold uppercase tracking-wide text-ink-soft hover:text-ink">
        ← Journal
      </Link>
      <h1 className="font-display mt-2 border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        New article
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">
        Starts as a draft. Once created you can add the featured image, full content, and SEO fields.
      </p>
      <NewJournalPostForm />
    </div>
  );
}
