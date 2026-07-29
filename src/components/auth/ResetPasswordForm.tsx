"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type ResetPasswordState } from "@/lib/actions";
import { Button } from "@/components/ui/Button";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  if (state.done) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-var(--shell-header-h))] max-w-md flex-col justify-center px-6 py-16">
        <p role="status" className="border border-positive/40 bg-positive-100 px-3 py-2 text-sm text-positive">
          {state.success}
        </p>
        <Link href="/login" className="mt-6 text-sm text-signal underline underline-offset-2">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--shell-header-h))] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Choose a new password</h1>
      <p className="mt-2 text-sm text-ink-soft">Must be at least 8 characters.</p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">New password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Confirm password</span>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
          />
        </label>

        {state.error && (
          <p role="alert" className="border border-ember/40 bg-ember-100 px-3 py-2 text-sm text-ember">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
          {pending ? "Saving…" : "Reset password"}
        </Button>
      </form>
    </div>
  );
}
