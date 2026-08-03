"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteJournalPostAction } from "@/lib/journalActions";
import { GeneralTab } from "@/components/admin/journal/GeneralTab";
import { ContentTab } from "@/components/admin/journal/ContentTab";
import { MediaTab } from "@/components/admin/journal/MediaTab";
import { SeoTab } from "@/components/admin/journal/SeoTab";
import { VisibilityTab } from "@/components/admin/journal/VisibilityTab";
import type { JournalPost } from "@/lib/types";

const TABS = ["General", "Content", "Media", "SEO", "Visibility"] as const;
type Tab = (typeof TABS)[number];

export function JournalEditorShell({ post, siteName }: { post: JournalPost; siteName: string }) {
  const [tab, setTab] = useState<Tab>("General");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(() => {
      deleteJournalPostAction(post.id);
    });
  }

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-6 border-b border-stone-300 bg-stone-50/95 px-6 pb-4 pt-2 backdrop-blur lg:-mx-10 lg:px-10">
        <nav className="pt-2 text-xs text-ink-soft">
          <Link href="/admin/journal" className="hover:text-ink">
            Journal
          </Link>{" "}
          / {post.title}
        </nav>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold uppercase tracking-tight text-ink">{post.title}</h1>
            <p className="font-mono-tab mt-0.5 text-xs text-ink-soft">
              <span className="uppercase">{post.status}</span>
              {post.featured && " · Featured"} · {post.category}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/journal/${post.slug}`}
              target="_blank"
              className="border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink hover:border-ink"
            >
              Preview
            </Link>
            {confirmingDelete ? (
              <span className="flex items-center gap-2 border border-ember bg-ember-100 px-2 py-1 text-xs text-ember">
                Delete permanently?
                <button type="button" onClick={handleDelete} disabled={isPending} className="font-semibold underline">
                  Yes
                </button>
                <button type="button" onClick={() => setConfirmingDelete(false)} className="underline">
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="border border-ember px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ember hover:bg-ember-100"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        <div role="tablist" className="scroll-thin mt-4 -mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              id={`tab-${t}`}
              role="tab"
              aria-selected={tab === t}
              aria-controls="journal-editor-tabpanel"
              onClick={() => setTab(t)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                tab === t ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div id="journal-editor-tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-6">
        {tab === "General" && <GeneralTab post={post} />}
        {tab === "Content" && <ContentTab post={post} />}
        {tab === "Media" && <MediaTab post={post} />}
        {tab === "SEO" && <SeoTab post={post} siteName={siteName} />}
        {tab === "Visibility" && <VisibilityTab post={post} />}
      </div>
    </div>
  );
}
