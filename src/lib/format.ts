/**
 * Date formatting.
 *
 * Deliberately a passed-in locale rather than the viewer's: these render on the server and
 * again during hydration, so resolving from the browser would produce a mismatch on every
 * date. That constraint predates the domain split — the original comment here said the
 * value would have to be "threaded through from the page's `lang` param, not read from the
 * runtime" if dates ever needed to follow the site's locale. They do now, and it is.
 *
 * The default stays `en-GB`, unchanged: this is a Greek company selling into European
 * retail, the English copy is British ("catalogue", "colourway"), and every locale it
 * serves reads dates day-first. "20 Aug 2026" is unambiguous to all of them.
 *
 * Greek gets `el-GR`, which yields DD/MM/YYYY numerically and Greek month names in the
 * long form ("20 Αυγ 2026").
 */
const DATE_LOCALE: Record<string, string> = {
  en: "en-GB",
  el: "el-GR",
  de: "de-DE",
  fr: "fr-FR",
};

function resolve(locale: string): string {
  return DATE_LOCALE[locale] ?? "en-GB";
}

/** Long form — "20 Aug 2026" / "20 Αυγ 2026". Used wherever a date is read, not scanned. */
export function formatDate(iso: string, locale: string = "en"): string {
  const d = new Date(iso);
  return d.toLocaleDateString(resolve(locale), { year: "numeric", month: "short", day: "numeric" });
}

/**
 * All-numeric form — "20/08/2026".
 *
 * Greek convention is DD/MM/YYYY, which `el-GR` produces. Note this is one of the few
 * places where getting the locale wrong is not merely ugly but wrong: 08/09 means two
 * different days depending on which side of the Atlantic reads it, and these appear on
 * order and invoice documents.
 */
export function formatDateNumeric(iso: string, locale: string = "en"): string {
  const d = new Date(iso);
  return d.toLocaleDateString(resolve(locale), { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/**
 * Long editorial form — "16 August 2026" / "16 Αυγούστου 2026".
 *
 * Journal article headers used a hardcoded "en-GB", so a Greek article was datelined in
 * English. Greek needs the genitive month form here, which `el-GR` produces on its own.
 */
export function formatDateLong(iso: string, locale: string = "en"): string {
  const d = new Date(iso);
  return d.toLocaleDateString(resolve(locale), { day: "numeric", month: "long", year: "numeric" });
}
