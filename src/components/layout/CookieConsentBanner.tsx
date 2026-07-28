"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "hector_cookie_notice_dismissed";

export function CookieConsentBanner() {
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

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-300 bg-ink px-6 py-4 text-stone-200">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="max-w-2xl text-xs leading-relaxed text-stone-300/80">
          This site uses essential cookies only, to keep you signed in and track your wholesale
          application. See our{" "}
          <Link href="/cookies" className="underline underline-offset-2 hover:text-white">
            Cookie Notice
          </Link>{" "}
          for details.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-stone-200"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
