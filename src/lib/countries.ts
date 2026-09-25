/**
 * Countries a buyer can say they are based in (ISO 3166-1 alpha-2).
 *
 * Greece first, then Cyprus (the other Greek-speaking market), then the rest of the EU and
 * the nearby markets a Heraklion wholesaler actually ships to. The list is deliberately
 * finite rather than all ~250 codes: a dropdown of every territory on earth is slower to use
 * than one that starts with the buyer's neighbours, and "Other" covers the rest.
 *
 * Names are never stored — only the code. `countryName` renders it in the reader's language.
 */
export const COUNTRY_CODES = [
  "GR", "CY",
  "AT", "BE", "BG", "HR", "CZ", "DK", "EE", "FI", "FR", "DE", "HU", "IE", "IT", "LV", "LT",
  "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "AL", "BA", "GB", "IS", "ME", "MK", "NO", "RS", "CH", "TR",
  "AE", "IL", "LB", "SA", "EG", "US", "CA", "AU",
] as const;

/** Stored when the buyer's country is not in the list. */
export const OTHER_COUNTRY = "ZZ";

export function isKnownCountry(code: string): boolean {
  return code === OTHER_COUNTRY || (COUNTRY_CODES as readonly string[]).includes(code);
}

/**
 * The country's name in the given UI language ("Γερμανία", "Germany", "Deutschland").
 * Falls back to the bare code if the runtime has no name for it.
 */
export function countryName(code: string, locale: string, otherLabel = "Other"): string {
  if (code === OTHER_COUNTRY) return otherLabel;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Options for a country `<select>`, built on the server so the names are identical on the
 * server render and on hydration (browsers ship different ICU data and would disagree).
 * Greece and Cyprus stay on top; everything else is alphabetical in the reader's language.
 */
export function countryOptions(locale: string, otherLabel: string): { value: string; label: string }[] {
  const [first, second, ...rest] = COUNTRY_CODES;
  const collator = new Intl.Collator(locale);
  const sorted = rest
    .map((code) => ({ value: code, label: countryName(code, locale) }))
    .sort((a, b) => collator.compare(a.label, b.label));
  return [
    { value: first, label: countryName(first, locale) },
    { value: second, label: countryName(second, locale) },
    ...sorted,
    { value: OTHER_COUNTRY, label: otherLabel },
  ];
}

/**
 * The country to pre-select on the application form. Only the Greek site guesses: the
 * country decides VAT, and a German-language visitor may just as well be Austrian or Swiss,
 * so everyone else picks it themselves.
 */
export function defaultCountryForLocale(locale: string): string {
  return locale === "el" ? "GR" : "";
}
