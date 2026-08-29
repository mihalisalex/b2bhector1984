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

/** A "both"-season style belongs to Summer and Winter at once — the same rule the old
 * spotlight rows used and the one /collections applies. */
function inSeason(style: Style, season: string): boolean {
  return style.season === season || style.season === "both";
}

export function pickSeasonStyles(styles: Style[], seasons: string[]): Record<string, Style[]> {
  const out: Record<string, Style[]> = {};
  for (const season of seasons) {
    out[season] = styles.filter((s) => inSeason(s, season)).slice(0, PER_SEASON);
  }
  return out;
}

/** Full season size, for the "N styles in this season" label — not the trimmed list's length. */
export function countSeasonStyles(styles: Style[], seasons: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const season of seasons) {
    out[season] = styles.filter((s) => inSeason(s, season)).length;
  }
  return out;
}
