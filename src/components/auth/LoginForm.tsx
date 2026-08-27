"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login, type FormState } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { TextField, FormMessage } from "@/components/ui/FormField";
import { useI18n } from "@/i18n/I18nProvider";
import { withLocale } from "@/i18n/paths";

const initialState: FormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const { locale, dict } = useI18n();
  const a = dict.auth;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--shell-header-h))] max-w-[1440px] items-stretch">
      <div className="hidden w-1/2 flex-col justify-between bg-ink p-14 text-stone-200 lg:flex">
        <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-stone-300/70">
          {a.portalEyebrow}
        </span>
        <div>
          <p className="font-display text-4xl font-bold leading-[1.05] text-white">{a.portalHeadline}</p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-stone-300/80">{a.portalBody}</p>
        </div>
        <div className="flex gap-8 font-mono-tab text-xs text-stone-300/60">
          <span>{a.estBadge}</span>
          <span>{a.seasonsBadge}</span>
          <span>{a.termsBadge}</span>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-16 sm:px-14 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">{a.loginHeading}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {a.loginIntroPre}{" "}
            <Link href={withLocale(locale, "/apply")} className="text-signal underline underline-offset-2">
              {a.applyForAccess}
            </Link>
            .
          </p>

          <form action={formAction} className="mt-8 flex flex-col gap-4">
            {next && <input type="hidden" name="next" value={next} />}
            <TextField label={a.email} name="email" type="email" required />
            <div>
              <TextField label={a.password} name="password" type="password" required />
              <Link
                href={withLocale(locale, "/forgot-password")}
                className="mt-1.5 inline-block text-xs text-signal underline underline-offset-2"
              >
                {a.forgotPassword}
              </Link>
            </div>

            {state.error && <FormMessage variant="error">{state.error}</FormMessage>}

            <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
              {pending ? a.signingIn : a.signIn}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
