"use client";

import { useActionState } from "react";
import { activateAccount } from "@/lib/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { Button } from "@/components/ui/Button";
import { TextField, FormMessage } from "@/components/ui/FormField";
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
      <TextField
        label="Choose a password"
        name="password"
        type="password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
      />
      <TextField
        label="Confirm password"
        name="confirmPassword"
        type="password"
        required
        minLength={MIN_PASSWORD_LENGTH}
      />

      {state.error && <FormMessage variant="error">{state.error}</FormMessage>}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Activating…" : "Activate My Account"}
      </Button>
    </form>
  );
}
