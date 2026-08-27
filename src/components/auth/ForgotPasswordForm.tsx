"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type FormState } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { TextField, FormMessage } from "@/components/ui/FormField";
import { useI18n } from "@/i18n/I18nProvider";
import { withLocale } from "@/i18n/paths";

const initialState: FormState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);
  const { locale, dict } = useI18n();
  const a = dict.auth;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--shell-header-h))] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">{a.forgotHeading}</h1>
      <p className="mt-2 text-sm text-ink-soft">{a.forgotIntro}</p>

      {state.success ? (
        <div className="mt-6">
          <FormMessage variant="success">{state.success}</FormMessage>
        </div>
      ) : (
        <form action={formAction} className="mt-8 flex flex-col gap-4">
          <TextField label={a.email} name="email" type="email" required />

          {state.error && <FormMessage variant="error">{state.error}</FormMessage>}

          <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
            {pending ? a.sending : a.sendResetLink}
          </Button>
        </form>
      )}

      <Link href={withLocale(locale, "/login")} className="mt-6 text-sm text-signal underline underline-offset-2">
        {a.backToSignIn}
      </Link>
    </div>
  );
}
