"use client";

import { useActionState, useEffect } from "react";
import { updateAccountCountryAction } from "@/lib/adminActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import type { FormState } from "@/lib/actions";

const initialState: FormState = {};

/**
 * The buyer's country, which decides VAT: Greece is charged Greek VAT, everywhere else is
 * invoiced at 0%. Same auto-submitting pattern as CreditTermsSelect.
 */
export function CountrySelect({
  accountId,
  country,
  businessName,
  options,
}: {
  accountId: string;
  country: string | undefined;
  businessName: string;
  /** Built on the server so option labels match between render and hydration. */
  options: { value: string; label: string }[];
}) {
  const [state, formAction] = useActionState(updateAccountCountryAction.bind(null, accountId), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (state.error || state.success) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="inline-flex">
      <select
        name="country"
        defaultValue={country ?? "GR"}
        aria-label={`Country for ${businessName}`}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="max-w-[9rem] border border-stone-300 bg-white px-2 py-1 text-sm outline-none focus-visible:border-signal"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
