import { SUPPORT_EMAIL } from "@/lib/contact";
import type { Locale } from "@/i18n/config";

/**
 * The company's identity as it appears on the legal pages.
 *
 * WHY THIS IS A FILE AND NOT A DATABASE READ. The same facts (address, ΑΦΜ, ΔΟΥ) live in
 * `seo_settings`, where they feed structured data and the proforma PDF, and where an admin
 * form has already once written nulls over them by accident. That is survivable for a
 * JSON-LD block; it is not survivable for the page that identifies the trader, which Greek
 * e-commerce law (Π.Δ. 131/2003, transposing Directive 2000/31/EC) requires to be present
 * and accurate. Legal identity should change when someone edits this file on purpose, not
 * as a side effect of saving an unrelated tab.
 *
 * KEEP IN STEP with `seo_settings.tax_afm` / `tax_doy` / `organization_*`. If they ever
 * disagree, the invoice and the terms are telling a buyer two different things.
 *
 * `null` means "not supplied yet". Every consumer renders only the fields that are set, so
 * a missing number is absent rather than printed as a placeholder — an "Α.Φ.Μ.: TODO" on a
 * terms page is worse than no line at all.
 */
export interface LegalEntity {
  /** The name buyers know. Used wherever the registered name isn't required. */
  tradingName: string;
  /**
   * The name on the Γ.Ε.ΜΗ. record, per language.
   *
   * This is a sole trader (ατομική επιχείρηση), so the registered name is the proprietor's
   * own — surname, given name, father's given name, the standard Greek form. Publishing it
   * is not optional: trader identification is exactly what Π.Δ. 131/2003 requires, and for
   * a sole trader the trader is a person.
   *
   * Per-locale because the registry holds it in Greek and supplies a Latin transliteration
   * for cross-border use; a Greek buyer should see the Greek original.
   */
  registeredName: Record<Locale, string> | null;
  /** Γ.Ε.ΜΗ. — the Greek business registry number. */
  gemi: string | null;
  /** Α.Φ.Μ. — Greek tax identification number. */
  vatId: string;
  /** Δ.Ο.Υ. — the competent tax office. */
  taxOffice: string;
  email: string;
  phone: string | null;
  foundedYear: number;
  /** Where a dispute would be heard. Follows the registered seat. */
  jurisdictionCity: Record<Locale, string>;
  /** ISO date. Shown on every legal page; bump it whenever the copy below changes. */
  lastUpdated: string;
}

/**
 * The postal address, per language. Greek buyers should read the Heraklion address in
 * Greek — the same building, not a transliteration they have to decode back.
 */
const ADDRESS: Record<Locale, string[]> = {
  en: ["Arthur Evans 9", "71201 Heraklion, Crete", "Greece"],
  el: ["Άρθουρ Έβανς 9", "712 01 Ηράκλειο, Κρήτη", "Ελλάδα"],
  de: ["Arthur Evans 9", "71201 Heraklion, Kreta", "Griechenland"],
  fr: ["Arthur Evans 9", "71201 Héraklion, Crète", "Grèce"],
};

export const LEGAL_ENTITY: LegalEntity = {
  tradingName: "Hector Footwear",
  registeredName: {
    // NOTE: the Greek form is a back-transliteration of the Latin name the Γ.Ε.ΜΗ. record
    // supplies (ALEXANDRIS MICHAIL TOU MICHAIL). Check it character-for-character against
    // the registry printout before treating it as verified.
    el: "ΑΛΕΞΑΝΔΡΗΣ ΜΙΧΑΗΛ ΤΟΥ ΜΙΧΑΗΛ",
    en: "ALEXANDRIS MICHAIL TOU MICHAIL",
    de: "ALEXANDRIS MICHAIL TOU MICHAIL",
    fr: "ALEXANDRIS MICHAIL TOU MICHAIL",
  },
  gemi: "192939527000",
  vatId: "146214557",
  taxOffice: "ΗΡΑΚΛΕΙΟΥ",
  email: SUPPORT_EMAIL,
  /** Written in international form: half the buyers reading this page are on the .com site. */
  phone: "+30 2814 001031",
  foundedYear: 1984,
  jurisdictionCity: {
    en: "Heraklion, Greece",
    el: "Ηρακλείου",
    de: "Heraklion, Griechenland",
    fr: "Héraklion, Grèce",
  },
  lastUpdated: "2026-09-06",
};

export function addressLines(locale: Locale): string[] {
  return ADDRESS[locale] ?? ADDRESS.en;
}

/** The address on one line, for prose and meta descriptions. */
export function addressInline(locale: Locale): string {
  return addressLines(locale).join(", ");
}

/**
 * The identity rows to print, already filtered to those we actually know. Labels come from
 * the dictionary; only the values live here.
 */
export function identityRows(
  locale: Locale,
  labels: {
    registeredName: string;
    tradingName: string;
    address: string;
    vatId: string;
    taxOffice: string;
    gemi: string;
    email: string;
    phone: string;
  },
): { label: string; value: string }[] {
  const e = LEGAL_ENTITY;
  const rows: { label: string; value: string | null }[] = [
    { label: labels.registeredName, value: e.registeredName?.[locale] ?? null },
    { label: labels.tradingName, value: e.tradingName },
    { label: labels.address, value: addressInline(locale) },
    { label: labels.vatId, value: e.vatId },
    { label: labels.taxOffice, value: e.taxOffice },
    { label: labels.gemi, value: e.gemi },
    { label: labels.email, value: e.email },
    { label: labels.phone, value: e.phone },
  ];
  return rows.filter((r): r is { label: string; value: string } => Boolean(r.value));
}

/** Formats {@link LegalEntity.lastUpdated} for display, e.g. "5 September 2026". */
export function formatLastUpdated(locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${LEGAL_ENTITY.lastUpdated}T00:00:00Z`));
}
