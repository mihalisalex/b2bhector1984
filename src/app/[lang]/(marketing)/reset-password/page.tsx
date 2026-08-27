import Link from "next/link";
import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { getDictionary } from "@/i18n/getDictionary";
import { withLocale } from "@/i18n/paths";
import type { Locale } from "@/i18n/config";

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
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.auth.resetIncompleteTitle,
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordNoTokenPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const a = (await getDictionary(locale)).auth;

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center lg:px-10">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
        {a.resetIncompleteHeading}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{a.resetIncompleteBody}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{a.resetIncompleteAction}</p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <LinkButton href={withLocale(locale, "/forgot-password")} size="lg">
          {a.sendNewResetLink}
        </LinkButton>
        <Link
          href={withLocale(locale, "/login")}
          className="text-xs font-semibold uppercase tracking-wide text-ink-soft underline underline-offset-4 hover:text-ink"
        >
          {a.backToSignIn}
        </Link>
      </div>
    </div>
  );
}
