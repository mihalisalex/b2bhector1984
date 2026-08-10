"use client";

import { useActionState, useEffect } from "react";
import { updateAccountMinOrderPairsAction } from "@/lib/adminActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import { MIN_ORDER_PAIRS } from "@/lib/pricing";
import type { FormState } from "@/lib/actions";

const initialState: FormState = {};

/** Blank = no override, this account is bound by the standard `MIN_ORDER_PAIRS` like every
 * new account. Only ever meant to go lower — see `updateAccountMinOrderPairsAction`'s
 * validation, which rejects anything above the standard minimum. */
export function MinOrderPairsInput({
  accountId,
  minOrderPairs,
  businessName,
}: {
  accountId: string;
  minOrderPairs?: number;
  businessName: string;
}) {
  const [state, formAction] = useActionState(updateAccountMinOrderPairsAction.bind(null, accountId), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (state.error) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="inline-flex items-center gap-1">
      <input
        name="minOrderPairs"
        type="number"
        step="1"
        min={1}
        max={MIN_ORDER_PAIRS}
        defaultValue={minOrderPairs ?? ""}
        placeholder={String(MIN_ORDER_PAIRS)}
        aria-label={`Minimum order (pairs) for ${businessName}`}
        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
        className="font-mono-tab w-16 border border-stone-300 bg-white px-2 py-1 text-right text-sm outline-none placeholder:text-ink-soft/50 focus-visible:border-signal"
      />
      <span className="text-xs text-ink-soft">pr</span>
    </form>
  );
}
