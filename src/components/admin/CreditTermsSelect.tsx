"use client";

import { useActionState, useEffect } from "react";
import { updateAccountCreditTermsAction } from "@/lib/adminActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import { TERMS_LABEL } from "@/lib/pricing";
import type { FormState } from "@/lib/actions";
import type { CreditTerms } from "@/lib/types";

const OPTIONS: CreditTerms[] = ["prepay", "net30", "net60"];
const initialState: FormState = {};

export function CreditTermsSelect({
  accountId,
  creditTerms,
  businessName,
}: {
  accountId: string;
  creditTerms: CreditTerms;
  businessName: string;
}) {
  const [state, formAction] = useActionState(updateAccountCreditTermsAction.bind(null, accountId), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (state.error) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="inline-flex">
      <select
        name="creditTerms"
        defaultValue={creditTerms}
        aria-label={`Credit terms for ${businessName}`}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="border border-stone-300 bg-white px-2 py-1 text-sm outline-none focus-visible:border-signal"
      >
        {OPTIONS.map((t) => (
          <option key={t} value={t}>{TERMS_LABEL[t]}</option>
        ))}
      </select>
    </form>
  );
}
