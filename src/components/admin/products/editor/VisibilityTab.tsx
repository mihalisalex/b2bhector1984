"use client";

import { useActionState, useEffect } from "react";
import { updateVisibilityAction } from "@/lib/productActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import type { FormState } from "@/lib/actions";
import type { ProductStatus, Style } from "@/lib/types";

const initialState: FormState = {};

const STATUS_OPTIONS: { value: ProductStatus; label: string; description: string }[] = [
  { value: "active", label: "Published", description: "Visible in the catalog and orderable." },
  { value: "draft", label: "Draft", description: "Hidden from buyers, editable in admin only." },
  { value: "private", label: "Private", description: "Reachable by direct link only, not listed." },
  { value: "archived", label: "Archived", description: "Retired — kept for order history, not orderable." },
];

function toLocalInput(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

export function VisibilityTab({ style, canEdit }: { style: Style; canEdit: boolean }) {
  const [state, formAction, isPending] = useActionState(updateVisibilityAction.bind(null, style.id), initialState);
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
            <input type="radio" name="status" value={opt.value} defaultChecked={style.status === opt.value} disabled={!canEdit} className="mt-1 h-4 w-4 accent-ink" />
            <span>
              <span className="block text-sm font-semibold text-ink">{opt.label}</span>
              <span className="block text-xs text-ink-soft">{opt.description}</span>
            </span>
          </label>
        ))}
      </div>

      <div>
        {/* Named for what it does. "Schedule publish" reads as automation — nothing acts on
            this date, and the note below already said so, but the label was writing a cheque
            the feature doesn't cash. */}
        <label htmlFor="publishAt" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Planned publish date (reminder only)</label>
        <input
          id="publishAt"
          name="publishAt"
          type="datetime-local"
          defaultValue={toLocalInput(style.publishAt)}
          disabled={!canEdit}
          className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
        />
        <p className="mt-1 text-xs text-ink-soft">Stored for reference — flipping status at the scheduled time still requires a save here (no background job runs this automatically).</p>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="featured" defaultChecked={style.featured} disabled={!canEdit} className="h-4 w-4 accent-ink" />
        Featured product
      </label>

      {canEdit && (
        <button type="submit" disabled={isPending} className="border border-ink bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50">
          {isPending ? "Saving…" : "Save visibility"}
        </button>
      )}
    </form>
  );
}
