"use client";

import { useActionState, useEffect } from "react";
import { updateGeneralAction } from "@/lib/journalActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import type { FormState } from "@/lib/actions";
import { JOURNAL_CATEGORIES, type JournalPost } from "@/lib/types";

const initialState: FormState = {};

export function GeneralTab({ post }: { post: JournalPost }) {
  const [state, formAction, isPending] = useActionState(updateGeneralAction.bind(null, post.id, post.slug), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (state.error || state.success) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="max-w-xl space-y-5 pb-20">
      <Field label="Title">
        <input name="title" defaultValue={post.title} required className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink" />
      </Field>

      <Field label="URL slug" hint={`Live at /journal/${post.slug}`}>
        <input name="slug" defaultValue={post.slug} required className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink" />
      </Field>

      <Field label="Excerpt" hint="Shown on the journal listing and used as a fallback meta description.">
        <textarea name="excerpt" defaultValue={post.excerpt} rows={3} className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category">
          <select name="category" defaultValue={post.category} className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink">
            {JOURNAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Author">
          <input name="authorName" defaultValue={post.authorName} className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink" />
        </Field>
      </div>

      <Field label="Tags" hint="Comma-separated.">
        <input name="tags" defaultValue={post.tags.join(", ")} className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink" />
      </Field>

      <button type="submit" disabled={isPending} className="border border-ink bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50">
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      {hint && <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-ink-soft/70">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
