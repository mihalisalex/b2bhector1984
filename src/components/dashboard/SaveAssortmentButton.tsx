"use client";

import { useActionState, useState } from "react";
import { saveAssortment, type FormState } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import type { CartLine } from "@/lib/cart-context";

const initialState: FormState = {};

export function SaveAssortmentButton({ lines }: { lines: CartLine[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(saveAssortment, initialState);

  if (state.success) {
    return <p className="text-xs font-medium text-positive">{state.success}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold uppercase tracking-wide text-ink-soft underline underline-offset-2 hover:text-ink"
      >
        Save as assortment
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 border border-stone-300 bg-white p-3 sm:w-72">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Assortment name</span>
        <input
          name="name"
          required
          placeholder="e.g. Fall Reorder Wall"
          className="border border-stone-300 bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:border-signal"
        />
      </label>

      {state.error && <p className="text-xs text-ember">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
