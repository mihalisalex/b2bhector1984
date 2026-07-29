"use client";

import { useActionState, useEffect } from "react";
import { updateAccountPriceMultiplierAction } from "@/lib/adminActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import type { FormState } from "@/lib/actions";

const initialState: FormState = {};

export function PriceMultiplierInput({
  accountId,
  priceMultiplier,
  businessName,
}: {
  accountId: string;
  priceMultiplier: number;
  businessName: string;
}) {
  const [state, formAction] = useActionState(updateAccountPriceMultiplierAction.bind(null, accountId), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (state.error) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="inline-flex items-center gap-1">
      <input
        name="priceMultiplier"
        type="number"
        step="0.01"
        min={0.01}
        defaultValue={priceMultiplier}
        aria-label={`Price multiplier for ${businessName}`}
        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
        className="font-mono-tab w-20 border border-stone-300 bg-white px-2 py-1 text-right text-sm outline-none focus-visible:border-signal"
      />
      <span className="text-xs text-ink-soft">×</span>
    </form>
  );
}
