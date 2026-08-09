"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login, type FormState } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { TextField, FormMessage } from "@/components/ui/FormField";

const initialState: FormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--shell-header-h))] max-w-[1440px] items-stretch">
      <div className="hidden w-1/2 flex-col justify-between bg-ink p-14 text-stone-200 lg:flex">
        <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-stone-300/70">
          Wholesale Portal
        </span>
        <div>
          <p className="font-display text-4xl font-bold leading-[1.05] text-white">
            Everything your store needs to buy Hector Footwear, in one place.
          </p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-stone-300/80">
            Matrix ordering, terms-based pricing, pre-book and at-once inventory, net terms,
            and a direct line to your rep — the way the wholesale channel should run.
          </p>
        </div>
        <div className="flex gap-8 font-mono-tab text-xs text-stone-300/60">
          <span>EST. 1984</span>
          <span>2 SEASONS</span>
          <span>NET 30 / 60</span>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-16 sm:px-14 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Buyer Login</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Approved wholesale accounts only. Not a buyer yet?{" "}
            <Link href="/apply" className="text-signal underline underline-offset-2">
              Apply for access
            </Link>
            .
          </p>

          <form action={formAction} className="mt-8 flex flex-col gap-4">
            {next && <input type="hidden" name="next" value={next} />}
            <TextField label="Email" name="email" type="email" required />
            <div>
              <TextField label="Password" name="password" type="password" required />
              <Link href="/forgot-password" className="mt-1.5 inline-block text-xs text-signal underline underline-offset-2">
                Forgot password?
              </Link>
            </div>

            {state.error && <FormMessage variant="error">{state.error}</FormMessage>}

            <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
              {pending ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
