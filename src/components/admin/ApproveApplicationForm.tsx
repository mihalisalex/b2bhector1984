"use client";

import { useActionState, useEffect } from "react";
import { approveApplication } from "@/lib/adminActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import type { FormState } from "@/lib/actions";
import type { AdminSalesRep } from "@/lib/data/salesReps";

const initialState: FormState = {};

/**
 * The rep and price multiplier are decided here, once, alongside the Approve click —
 * not left to be set later on /admin/accounts (previously the only place either was
 * editable, and only after the account already existed). Both are optional: approving
 * with the rep left on "Unassigned" and the multiplier left at its default of 1 behaves
 * exactly like the old plain Approve button did.
 *
 * `approveApplication`'s own validation (0.01–5) is the source of truth — this input's
 * `min`/`max`/`step` are a UX nicety that keeps a mouse-driven spinner in range, not a
 * substitute for it; typing a value directly still round-trips through the server check.
 */
export function ApproveApplicationForm({
  applicationId,
  businessName,
  reps,
}: {
  applicationId: string;
  businessName: string;
  reps: AdminSalesRep[];
}) {
  const [state, formAction, pending] = useActionState(approveApplication.bind(null, applicationId), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (state.error || state.success) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <select
        name="repId"
        defaultValue=""
        aria-label={`Sales rep for ${businessName}`}
        className="border border-stone-300 bg-white px-2 py-1.5 text-xs outline-none focus-visible:border-signal"
      >
        <option value="">Unassigned</option>
        {reps.map((rep) => (
          <option key={rep.id} value={rep.id}>
            {rep.name}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1 text-xs text-ink-soft">
        <span aria-hidden>×</span>
        <input
          name="priceMultiplier"
          type="number"
          step="0.05"
          min="0.01"
          max="5"
          defaultValue="1"
          aria-label={`Price multiplier for ${businessName}`}
          className="font-mono-tab w-16 border border-stone-300 bg-white px-2 py-1.5 text-xs outline-none focus-visible:border-signal"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="border border-ink bg-ink px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
      >
        {pending ? "Approving…" : "Approve"}
      </button>
    </form>
  );
}
