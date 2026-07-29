"use client";

import { useActionState, useEffect } from "react";
import { updateAccountRepAction } from "@/lib/adminActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import type { FormState } from "@/lib/actions";
import type { AdminSalesRep } from "@/lib/data/salesReps";

const initialState: FormState = {};

export function RepSelect({
  accountId,
  repId,
  reps,
  businessName,
}: {
  accountId: string;
  repId?: string;
  reps: AdminSalesRep[];
  businessName: string;
}) {
  const [state, formAction] = useActionState(updateAccountRepAction.bind(null, accountId), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (state.error) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="inline-flex">
      <select
        name="repId"
        defaultValue={repId ?? ""}
        aria-label={`Sales rep for ${businessName}`}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="max-w-[160px] border border-stone-300 bg-white px-2 py-1 text-sm outline-none focus-visible:border-signal"
      >
        <option value="">Unassigned</option>
        {reps.map((rep) => (
          <option key={rep.id} value={rep.id}>{rep.name}</option>
        ))}
      </select>
    </form>
  );
}
