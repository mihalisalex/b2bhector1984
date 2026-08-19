/**
 * `en-GB`, not `en-US`: this is a Greek company selling into European retail, the rest of
 * the site is written in British English ("catalogue", "colourway"), and every other locale
 * it serves — Greek, German, French — reads dates day-first. "19 Aug 2026" is unambiguous to
 * all of them; "Aug 19, 2026" reads as foreign to most of the buyer base.
 *
 * Deliberately a fixed locale rather than the viewer's: rendered on the server and hydrated
 * on the client, so resolving it from the browser would produce a hydration mismatch on
 * every date. If dates ever need to follow the site's own locale switcher, the value has to
 * be threaded through from the page's `lang` param, not read from the runtime.
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
