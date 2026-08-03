"use client";

import { useActionState, useEffect } from "react";
import { updateAccountPhoneAction } from "@/lib/adminActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import type { FormState } from "@/lib/actions";

const initialState: FormState = {};

/**
 * Auto-submit-on-blur phone editor, same pattern as PriceMultiplierInput.
 *
 * Exists mainly for backfill: accounts activated before this feature (or
 * seeded directly, never going through the application flow) have no phone
 * on record at all — this is the only way to add one for them, since new
 * approvals now carry it over automatically from the application.
 */
export function PhoneInput({ accountId, phone, businessName }: { accountId: string; phone?: string; businessName: string }) {
  const [state, formAction] = useActionState(updateAccountPhoneAction.bind(null, accountId), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (state.error) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction}>
      <input
        name="phone"
        type="tel"
        defaultValue={phone}
        placeholder="+30 691 234 5678"
        aria-label={`WhatsApp phone for ${businessName}`}
        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-40 border border-stone-300 bg-white px-2 py-1 text-sm outline-none focus-visible:border-signal"
      />
    </form>
  );
}
