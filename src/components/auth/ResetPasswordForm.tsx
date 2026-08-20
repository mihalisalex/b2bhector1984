"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type ResetPasswordState } from "@/lib/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { Button } from "@/components/ui/Button";
import { TextField, FormMessage } from "@/components/ui/FormField";
import { useI18n } from "@/i18n/I18nProvider";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);
  const { locale, dict } = useI18n();
  const a = dict.auth;

  if (state.done) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-var(--shell-header-h))] max-w-md flex-col justify-center px-6 py-16">
        <FormMessage variant="success">{state.success}</FormMessage>
        <Link href={withLocale(locale, "/login")} className="mt-6 text-sm text-signal underline underline-offset-2">
          {a.goToSignIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--shell-header-h))] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">{a.chooseNewPassword}</h1>
      <p className="mt-2 text-sm text-ink-soft">{t(a.passwordMinLength, { min: MIN_PASSWORD_LENGTH })}</p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <TextField label={a.newPassword} name="password" type="password" required minLength={MIN_PASSWORD_LENGTH} />
        <TextField
          label={a.confirmPassword}
          name="confirmPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
        />

        {state.error && <FormMessage variant="error">{state.error}</FormMessage>}

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
          {pending ? a.saving : a.resetPassword}
        </Button>
      </form>
    </div>
  );
}
