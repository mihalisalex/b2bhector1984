import type { Style } from "@/lib/types";

/**
 * Selection rules for the homepage season showcase.
 *
 * Deliberately NOT inside SeasonShowcase.tsx. That file is `"use client"`, and a function
 * exported from a client module cannot be called during a server render — the page needs
 * these to decide which product images to fetch, before the component exists. Typecheck and
 * lint both pass either way; only running the page surfaces it.
 */

/** Products shown per season before the "see more" tile takes the last cell. */
export const PER_SEASON = 3;

/** A "both"-season style genuinely belongs to Summer and Winter at once — that is how
 * /collections and /catalogue treat it, and they are right to. */
function inSeason(style: Style, season: string): boolean {
  return style.season === season || style.season === "both";
}

/**
 * Three styles per season, with two rules that only apply to this homepage shelf.
 *
 * 1. STYLES SPECIFIC TO THE SEASON COME FIRST. A "both" style is a fallback, used only if
 *    the season has fewer than three of its own.
 * 2. NO STYLE APPEARS UNDER TWO SEASONS. Whichever season is offered first claims it.
 *
 * Both exist because the toggle's job is to show the buyer that the seasons differ. With
 * nine of the catalogue's styles marked "both", the naive filter put 5101 at the top of
 * Summer *and* Winter, so flipping the toggle changed two tiles out of three and looked
 * broken. Summer and Winter each have more than three of their own styles today, so rule 1
 * does the work on its own; rule 2 is what keeps it true if that ever stops being the case.
 *
 * This is a presentation rule for one section, not a change of meaning: /collections and
 * /catalogue still list a "both" style under either season, which is correct there.
 */
export function pickSeasonStyles(styles: Style[], seasons: string[]): Record<string, Style[]> {
  const out: Record<string, Style[]> = {};
  const claimed = new Set<string>();

  for (const season of seasons) {
    const candidates = styles.filter((s) => inSeason(s, season) && !claimed.has(s.id));
    const own = candidates.filter((s) => s.season === season);
    const shared = candidates.filter((s) => s.season !== season);
    const picked = [...own, ...shared].slice(0, PER_SEASON);

    for (const s of picked) claimed.add(s.id);
    out[season] = picked;
  }
  return out;
}

/**
 * Full season size for the "N styles in this season" label.
 *
 * Counts "both" styles under every season they belong to, unlike the picker above — this
 * number describes what the buyer will find on /collections when they follow the link, and
 * that page does show them under either season.
 */
export function countSeasonStyles(styles: Style[], seasons: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const season of seasons) {
    out[season] = styles.filter((s) => inSeason(s, season)).length;
  }
  return out;
}
