"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { updateContentAction } from "@/lib/journalActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import { RichTextEditor } from "@/components/admin/products/editor/RichTextEditor";
import type { FormState } from "@/lib/actions";
import type { JournalPost } from "@/lib/types";

const initialState: FormState = {};

export function ContentTab({ post }: { post: JournalPost }) {
  const [state, formAction, isPending] = useActionState(updateContentAction.bind(null, post.id, post.slug), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (state.error || state.success) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="max-w-3xl space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Article body</span>
        <Link href={`/journal/${post.slug}`} target="_blank" className="text-xs font-semibold uppercase tracking-wide text-ink-soft hover:text-ink">
          Preview →
        </Link>
      </div>
      <RichTextEditor name="contentHtml" label="Article body" defaultValue={post.contentHtml} allowImages />
      <button type="submit" disabled={isPending} className="border border-ink bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50">
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
