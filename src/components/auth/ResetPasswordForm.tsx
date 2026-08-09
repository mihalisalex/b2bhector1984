"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type ResetPasswordState } from "@/lib/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { Button } from "@/components/ui/Button";
import { TextField, FormMessage } from "@/components/ui/FormField";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  if (state.done) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-var(--shell-header-h))] max-w-md flex-col justify-center px-6 py-16">
        <FormMessage variant="success">{state.success}</FormMessage>
        <Link href="/login" className="mt-6 text-sm text-signal underline underline-offset-2">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--shell-header-h))] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Choose a new password</h1>
      <p className="mt-2 text-sm text-ink-soft">Must be at least {MIN_PASSWORD_LENGTH} characters.</p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <TextField label="New password" name="password" type="password" required minLength={MIN_PASSWORD_LENGTH} />
        <TextField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
        />

        {state.error && <FormMessage variant="error">{state.error}</FormMessage>}

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
          {pending ? "Saving…" : "Reset password"}
        </Button>
      </form>
    </div>
  );
}
