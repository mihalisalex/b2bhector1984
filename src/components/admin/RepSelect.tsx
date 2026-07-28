"use client";

import { updateAccountRepAction } from "@/lib/adminActions";
import type { AdminSalesRep } from "@/lib/data/salesReps";

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
  return (
    <form action={updateAccountRepAction.bind(null, accountId)} className="inline-flex">
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
