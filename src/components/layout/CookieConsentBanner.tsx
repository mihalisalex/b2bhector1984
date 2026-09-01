"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { withLocale } from "@/i18n/paths";
import { useConsent } from "@/components/analytics/ConsentProvider";

/**
 * Cookie consent, asked once and answerable both ways.
 *
 * This used to be an acknowledgement — one "Got it" that dismissed a notice while analytics
 * had already loaded. It is now the thing that decides whether analytics loads at all: the
 * script is absent until `grant()` runs, so Decline is a real outcome and not a button that
 * closes a box.
 *
 * Shown only once `ready` — the stored choice lives in localStorage, which the server cannot
 * see, so rendering before it is read would flash the banner at people who already answered.
 *
 * Essential cookies are not offered as a choice, because they are not one: without
 * `hector_session` there is no signing in and no ordering. The copy says so rather than
 * pretending everything is optional.
 */
export function CookieConsentBanner() {
  const { dict, locale } = useI18n();
  const { consent, ready, grant, deny } = useConsent();

  if (!ready || consent !== "unknown") return null;

  const [before, after] = dict.cookieBanner.body.split("{link}");

  return (
    <div
      role="dialog"
      aria-label={dict.cookieBanner.ariaLabel}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-300 bg-ink px-6 py-4 text-stone-200"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="max-w-2xl text-xs leading-relaxed text-stone-300/80">
          {/* The sentence is one dictionary string with a {link} placeholder rather than two
              fragments around a hardcoded link — Greek puts the article before "Πολιτική"
              and inflects it, so the words on either side of the link are not fixed. */}
          {before}
          <Link href={withLocale(locale, "/cookies")} className="underline underline-offset-2 hover:text-white">
            {dict.footer.cookieNotice}
          </Link>
          {after}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {/* Decline first, and styled as the quieter of the two, but a real button of the
              same size — a refusal that is harder to click than the acceptance is not a
              choice, it is a dark pattern. */}
          <button
            type="button"
            onClick={deny}
            className="border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-stone-200 transition-colors hover:border-white hover:text-white"
          >
            {dict.cookieBanner.decline}
          </button>
          <button
            type="button"
            onClick={grant}
            className="bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-stone-200"
          >
            {dict.cookieBanner.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
