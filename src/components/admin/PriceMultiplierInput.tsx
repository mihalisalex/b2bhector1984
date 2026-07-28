"use client";

import { updateAccountPriceMultiplierAction } from "@/lib/adminActions";

export function PriceMultiplierInput({ accountId, priceMultiplier }: { accountId: string; priceMultiplier: number }) {
  return (
    <form action={updateAccountPriceMultiplierAction.bind(null, accountId)} className="inline-flex items-center gap-1">
      <input
        name="priceMultiplier"
        type="number"
        step="0.01"
        min={0.01}
        defaultValue={priceMultiplier}
        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
        className="font-mono-tab w-20 border border-stone-300 bg-white px-2 py-1 text-right text-sm outline-none focus-visible:border-signal"
      />
      <span className="text-xs text-ink-soft">×</span>
    </form>
  );
}
