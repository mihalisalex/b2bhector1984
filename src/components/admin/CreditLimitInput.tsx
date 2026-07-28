"use client";

import { updateAccountCreditLimitAction } from "@/lib/adminActions";

export function CreditLimitInput({ accountId, creditLimit }: { accountId: string; creditLimit: number }) {
  return (
    <form action={updateAccountCreditLimitAction.bind(null, accountId)} className="inline-flex items-center gap-1">
      <span className="text-xs text-ink-soft">€</span>
      <input
        name="creditLimit"
        type="number"
        step="100"
        min={0}
        defaultValue={creditLimit}
        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
        className="font-mono-tab w-24 border border-stone-300 bg-white px-2 py-1 text-right text-sm outline-none focus-visible:border-signal"
      />
    </form>
  );
}
