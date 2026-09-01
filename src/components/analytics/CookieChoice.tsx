"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { useConsent } from "@/components/analytics/ConsentProvider";

/**
 * The current analytics choice, and a way to change it, on /cookies.
 *
 * Without this, Decline is a one-way door: the banner never returns, so a visitor who
 * refused could never later agree, and one who agreed could never withdraw. Consent that
 * cannot be withdrawn as easily as it was given is not consent, so this is part of the
 * feature rather than a nicety.
 */
export function CookieChoice() {
  const { dict } = useI18n();
  const { consent, ready, grant, deny } = useConsent();
  const l = dict.legal;

  // Renders nothing until the stored choice is known, rather than claiming "not answered"
  // for a moment to someone who answered months ago.
  if (!ready) return null;

  const status =
    consent === "granted" ? l.consentStatusGranted : consent === "denied" ? l.consentStatusDenied : l.consentStatusUnknown;

  return (
    <div className="mt-8 border border-stone-300 bg-stone-100 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{l.consentHeading}</p>
      <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink">{status}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={grant}
          disabled={consent === "granted"}
          className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {dict.cookieBanner.accept}
        </button>
        <button
          type="button"
          onClick={deny}
          disabled={consent === "denied"}
          className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {dict.cookieBanner.decline}
        </button>
      </div>
      <p className="mt-3 max-w-[60ch] text-[11px] leading-relaxed text-ink-soft">{l.consentNote}</p>
    </div>
  );
}
