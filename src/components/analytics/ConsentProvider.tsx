"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Consent = "unknown" | "granted" | "denied";

/**
 * New key, not the old `hector_cookie_notice_dismissed`.
 *
 * That flag recorded that someone closed a notice, which is not the same act as agreeing to
 * be measured. Reusing it would have silently converted every past dismissal into consent
 * nobody gave. Anyone who dismissed the old banner is asked once more, which is the correct
 * outcome rather than an inconvenience.
 */
const STORAGE_KEY = "hector_cookie_consent";

interface ConsentValue {
  consent: Consent;
  /** True once localStorage has been read, so nothing renders on a guess. */
  ready: boolean;
  grant: () => void;
  deny: () => void;
  /** Clears the stored choice and brings the banner back — used by /cookies. */
  reset: () => void;
}

const ConsentContext = createContext<ConsentValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  // Starts "unknown" and NOT ready: the server cannot know a per-browser choice, so the
  // first paint must assume nothing. Analytics stays unloaded and the banner stays hidden
  // until the effect below reports what this visitor actually decided.
  const [consent, setConsent] = useState<Consent>("unknown");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private mode, or storage blocked. Treated as "no choice recorded", which keeps
      // analytics off — the safe direction to fail in.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading an external store on mount, the same documented exception as cart-context.tsx
    if (stored === "granted" || stored === "denied") setConsent(stored);
    setReady(true);
  }, []);

  const write = useCallback((value: Consent) => {
    setConsent(value);
    try {
      if (value === "unknown") window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // The choice still applies to this page view; it just will not survive a reload.
    }
  }, []);

  const value = useMemo<ConsentValue>(
    () => ({
      consent,
      ready,
      grant: () => write("granted"),
      deny: () => write("denied"),
      reset: () => write("unknown"),
    }),
    [consent, ready, write],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within a ConsentProvider");
  return ctx;
}
