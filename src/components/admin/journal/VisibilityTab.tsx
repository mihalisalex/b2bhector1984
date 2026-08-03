"use client";

import { useActionState, useEffect } from "react";
import { updateVisibilityAction } from "@/lib/journalActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import type { FormState } from "@/lib/actions";
import type { JournalPost, JournalStatus } from "@/lib/types";

const initialState: FormState = {};

const STATUS_OPTIONS: { value: JournalStatus; label: string; description: string }[] = [
  { value: "draft", label: "Draft", description: "Hidden from the public journal, editable in admin only." },
  { value: "scheduled", label: "Scheduled", description: "Not live yet — set a target date below, then flip to Published when it arrives." },
  { value: "published", label: "Published", description: "Live on /journal, indexable, and included in the sitemap." },
  { value: "archived", label: "Archived", description: "Retired — no longer listed or linked to." },
];

function toLocalInput(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

export function VisibilityTab({ post }: { post: JournalPost }) {
  const [state, formAction, isPending] = useActionState(updateVisibilityAction.bind(null, post.id, post.slug), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (state.error || state.success) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="max-w-xl space-y-6 pb-20">
      <div className="space-y-2">
        {STATUS_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-start gap-3 border border-stone-300 bg-white px-4 py-3">
            <input type="radio" name="status" value={opt.value} defaultChecked={post.status === opt.value} className="mt-1 h-4 w-4 accent-ink" />
            <span>
              <span className="block text-sm font-semibold text-ink">{opt.label}</span>
              <span className="block text-xs text-ink-soft">{opt.description}</span>
            </span>
          </label>
        ))}
      </div>

      <div>
        <label htmlFor="publishAt" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Scheduled date (optional)
        </label>
        <input
          id="publishAt"
          name="publishAt"
          type="datetime-local"
          defaultValue={toLocalInput(post.publishAt)}
          className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
        />
        <p className="mt-1 text-xs text-ink-soft">
          Stored for reference — reaching this date doesn&rsquo;t auto-publish the article, you still flip the status above yourself.
        </p>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="featured" defaultChecked={post.featured} className="h-4 w-4 accent-ink" />
        Featured article (shown in the journal&rsquo;s featured section)
      </label>

      {post.publishedAt && (
        <p className="text-xs text-ink-soft">First published {new Date(post.publishedAt).toLocaleDateString()}.</p>
      )}

      <button type="submit" disabled={isPending} className="border border-ink bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50">
        {isPending ? "Saving…" : "Save visibility"}
      </button>
    </form>
  );
}
