"use client";

import { updateAccountCreditTermsAction } from "@/lib/adminActions";
import { TERMS_LABEL } from "@/lib/pricing";
import type { CreditTerms } from "@/lib/types";

const OPTIONS: CreditTerms[] = ["prepay", "net30", "net60"];

export function CreditTermsSelect({
  accountId,
  creditTerms,
  businessName,
}: {
  accountId: string;
  creditTerms: CreditTerms;
  businessName: string;
}) {
  return (
    <form action={updateAccountCreditTermsAction.bind(null, accountId)} className="inline-flex">
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
