"use client";

import { useActionState } from "react";
import { activateAccount } from "@/lib/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { Button } from "@/components/ui/Button";
import type { FormState } from "@/lib/actions";

const initialState: FormState = {};

/** The "Approved" step of /apply/pending — the buyer sets their own login password
 * here rather than one being assigned for them (see activateAccount() in actions.ts).
 * `applicationId` travels as a hidden field rather than relying only on the
 * `hector_application` cookie, so this still works when the page was reached via the
 * "activate now" email link on a different browser/device than the one that applied. */
export function ActivateAccountForm({ applicationId }: { applicationId: string }) {
  const [state, formAction, pending] = useActionState(activateAccount, initialState);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-4 sm:max-w-sm">
      <input type="hidden" name="applicationId" value={applicationId} />
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Choose a password</span>
        <input
          name="password"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
        />
        <span className="text-xs text-ink-soft">At least {MIN_PASSWORD_LENGTH} characters.</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Confirm password</span>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
        />
      </label>

      {state.error && (
        <p role="alert" className="border border-ember/40 bg-ember-100 px-3 py-2 text-sm text-ember">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Activating…" : "Activate My Account"}
      </Button>
    </form>
  );
}
