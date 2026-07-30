"use client";

import { useActionState, useRef } from "react";
import { updateAccountPassword, type FormState } from "@/lib/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { Button } from "@/components/ui/Button";

const initialState: FormState = {};

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await updateAccountPassword(prev, formData);
    if (result.success) formRef.current?.reset();
    return result;
  }, initialState);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <Field label="Current password" name="currentPassword" required autoComplete="current-password" />
      <Field
        label="New password"
        name="newPassword"
        required
        minLength={MIN_PASSWORD_LENGTH}
        autoComplete="new-password"
        hint={`Must be at least ${MIN_PASSWORD_LENGTH} characters.`}
      />
      <Field
        label="Confirm new password"
        name="confirmPassword"
        required
        minLength={MIN_PASSWORD_LENGTH}
        autoComplete="new-password"
      />

      {state.error && (
        <p role="alert" className="border border-ember/40 bg-ember-100 px-3 py-2 text-sm text-ember">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="border border-positive/40 bg-positive-100 px-3 py-2 text-sm text-positive">
          {state.success}
        </p>
      )}

      <Button type="submit" size="sm" className="self-start" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  minLength,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  required?: boolean;
  minLength?: number;
  /** Real autocomplete tokens (not "off") so password managers can fill and offer to save. */
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <input
        name={name}
        type="password"
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
      />
      {hint && <span className="text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}
