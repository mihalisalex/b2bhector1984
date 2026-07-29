"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type FormState } from "@/lib/actions";
import { Button } from "@/components/ui/Button";

const initialState: FormState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--shell-header-h))] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Reset your password</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Enter the email on your wholesale account and we&rsquo;ll send you a link to reset your password.
      </p>

      {state.success ? (
        <p role="status" className="mt-6 border border-positive/40 bg-positive-100 px-3 py-2 text-sm text-positive">
          {state.success}
        </p>
      ) : (
        <form action={formAction} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Email</span>
            <input
              name="email"
              type="email"
              required
              className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
            />
          </label>

          {state.error && (
            <p role="alert" className="border border-ember/40 bg-ember-100 px-3 py-2 text-sm text-ember">
              {state.error}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <Link href="/login" className="mt-6 text-sm text-signal underline underline-offset-2">
        Back to sign in
      </Link>
    </div>
  );
}
