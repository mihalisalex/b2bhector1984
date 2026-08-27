"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { withLocale } from "@/i18n/paths";

const STORAGE_KEY = "hector_cookie_notice_dismissed";

export function CookieConsentBanner() {
  const { dict, locale } = useI18n();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // One-time read from localStorage (unavailable during SSR) — the
    // documented exception to the derived-state rule used elsewhere in this
    // codebase (see cart-context.tsx).
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // ignore — banner just stays visible if localStorage is unavailable
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (dismissed) return null;

  const [before, after] = dict.cookieBanner.body.split("{link}");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-300 bg-ink px-6 py-4 text-stone-200">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="max-w-2xl text-xs leading-relaxed text-stone-300/80">
          {/* The sentence is one dictionary string with a {link} placeholder rather than two
              fragments around a hardcoded link — Greek puts the article before "Ενημέρωση"
              and inflects it, so the words on either side of the link are not fixed. */}
          {before}
          <Link href={withLocale(locale, "/cookies")} className="underline underline-offset-2 hover:text-white">
            {dict.footer.cookieNotice}
          </Link>
          {after}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-stone-200"
        >
          {dict.cookieBanner.accept}
        </button>
      </div>
    </div>
  );
}
