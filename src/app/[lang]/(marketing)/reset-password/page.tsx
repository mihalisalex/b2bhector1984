import Link from "next/link";
import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";

/**
 * `/reset-password` with no token.
 *
 * The only real page under this route is `[token]`, so this URL used to hit the bare 404 —
 * which is exactly the wrong page for the person most likely to land on it: someone whose
 * reset link was truncated by their mail client, or who typed the address from memory after
 * the link expired. A 404 tells them the site is broken; what they need is the one button
 * that gets them a fresh link.
 *
 * `noindex` because this is a dead-end utility URL, and `ALWAYS_DISALLOWED` in seoRoutes
 * already covers `/reset-password` in robots.txt.
 */
export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordNoTokenPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center lg:px-10">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
        This reset link is incomplete
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Password reset links carry a one-time code, and this address arrived without one. That
        usually means the link was cut short by an email client, or it has already been used.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Request a new one and it will be sent to your account email.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <LinkButton href="/forgot-password" size="lg">
          Send a new reset link
        </LinkButton>
        <Link href="/login" className="text-xs font-semibold uppercase tracking-wide text-ink-soft underline underline-offset-4 hover:text-ink">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
