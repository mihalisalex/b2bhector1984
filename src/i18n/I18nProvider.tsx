"use client";

import { createContext, useContext } from "react";
import { formatEUR } from "@/lib/pricing";
import { formatDate, formatDateNumeric, formatDayMonth } from "@/lib/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";

interface I18nContextValue {
  locale: Locale;
  dict: Dictionary;
  /** Production lead time from /admin, in days. Every order is produced for the buyer. */
  leadTimeDays: number;
  /** Estimated arrival of an order placed today (ISO date), computed on the server so the
   * server render and hydration agree. See src/lib/delivery.ts. */
  arrivalIso: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  leadTimeDays,
  arrivalIso,
  children,
}: I18nContextValue & { children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, dict, leadTimeDays, arrivalIso }}>{children}</I18nContext.Provider>;
}

/** "Arrives around 14 Nov" data for any client component: the lead time and the date. */
export function useDelivery(): { leadTimeDays: number; arrivalIso: string; arrivalLabel: string } {
  const { locale, leadTimeDays, arrivalIso } = useI18n();
  return { leadTimeDays, arrivalIso, arrivalLabel: formatDayMonth(arrivalIso, locale) };
}

/** Client-side access to the current locale + its dictionary. Server Components should
 * call `getDictionary(lang)` directly from `params` instead of reaching for this. */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}

/**
 * Number and date formatters bound to the current locale.
 *
 * Exists so a client component can write `eur(price)` instead of `formatEUR(price, locale)`
 * at every call site — there are ~99 of them, and a threading mistake shows up as a price
 * silently rendered in the wrong convention rather than as an error.
 *
 * The locale still comes from the provider (server-rendered, from the route), never from
 * the browser: `Intl` resolved client-side would disagree with the server's output and
 * produce a hydration mismatch on every price on the page.
 */
export function useFormat() {
  const { locale } = useI18n();
  return {
    eur: (n: number) => formatEUR(n, locale),
    date: (iso: string) => formatDate(iso, locale),
    dateNumeric: (iso: string) => formatDateNumeric(iso, locale),
    locale,
  };
}
