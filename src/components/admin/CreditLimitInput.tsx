"use client";

import { useActionState, useEffect } from "react";
import { updateAccountCreditLimitAction } from "@/lib/adminActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import type { FormState } from "@/lib/actions";

const initialState: FormState = {};

export function CreditLimitInput({
  accountId,
  creditLimit,
  businessName,
}: {
  accountId: string;
  creditLimit: number;
  businessName: string;
}) {
  const [state, formAction] = useActionState(updateAccountCreditLimitAction.bind(null, accountId), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (state.error) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="inline-flex items-center gap-1">
      <span aria-hidden className="text-xs text-ink-soft">€</span>
      <input
        name="creditLimit"
        type="number"
        step="100"
        min={0}
        defaultValue={creditLimit}
        aria-label={`Credit limit for ${businessName}`}
        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
        className="font-mono-tab w-24 border border-stone-300 bg-white px-2 py-1 text-right text-sm outline-none focus-visible:border-signal"
      />
    </form>
  );
}
