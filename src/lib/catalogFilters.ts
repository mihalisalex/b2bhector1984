import { isOnSale } from "@/lib/pricing";
import type { Category, Gender, Season, Style } from "@/lib/types";

/** Quick toggles backed by real fields, not curated lists. */
export const FLAG_OPTIONS = [
  { value: "instock", label: "In stock now" },
  { value: "sale", label: "On sale" },
  { value: "featured", label: "Featured" },
] as const;

export type CatalogFlag = (typeof FLAG_OPTIONS)[number]["value"];

/**
 * The colourway names actually present in the given styles, de-duplicated and
 * sorted — the only honest source for this facet.
 *
 * This replaced a hardcoded list ("Ink", "Cinder", "Bone", "Chalk", "Signal",
 * "Navy", "Red", "Yellow", "Merlot", "Olive", "Ember") left over from the seed
 * catalogue. Not one of those eleven matched any real colourway, so every
 * option in the Colorway filter returned an empty grid — eleven controls that
 * could only ever fail. Deriving them means the facet can never drift from the
 * catalogue again, whatever colours get uploaded next.
 */
export function colorOptionsFromStyles(styles: Style[]): string[] {
  const names = new Set<string>();
  for (const style of styles) {
    for (const colorway of style.colorways) {
      const name = colorway.name.trim();
      if (name) names.add(name);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

/**
 * The quick toggles that can actually return something, given the catalogue as
 * it stands this request. "Featured" and "In stock now" are both currently
 * dead — nothing is flagged featured and every style is pre-order with zero on
 * hand — and a checkbox whose only possible outcome is an empty grid is worse
 * than no checkbox.
 */
export function availableFlagOptions(
  styles: Style[],
  inStockIds?: Set<string>,
): (typeof FLAG_OPTIONS)[number][] {
  return FLAG_OPTIONS.filter((opt) => {
    if (opt.value === "sale") return styles.some((s) => isOnSale(s));
    if (opt.value === "featured") return styles.some((s) => s.featured);
    // Omitted inventory means the flag no-ops rather than filtering everything
    // out (see `filterStyles`), so the honest thing is to not offer it at all.
    return Boolean(inStockIds && styles.some((s) => inStockIds.has(s.id)));
  });
}

export const PRICE_BANDS = [
  { id: "u30", label: "Under €30", min: 0, max: 30 },
  { id: "30-40", label: "€30–40", min: 30, max: 40 },
  { id: "40-50", label: "€40–50", min: 40, max: 50 },
  { id: "50up", label: "€50+", min: 50, max: Infinity },
] as const;

export interface CatalogFilters {
  q: string;
  category: Category[];
  season: Season[];
  gender: Gender[];
  availability: ("available" | "prebook")[];
  color: string[];
  price: string[];
  flag: CatalogFlag[];
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): CatalogFilters {
  const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
  return {
    q: typeof sp.q === "string" ? sp.q : "",
    category: list(sp.category) as Category[],
    season: list(sp.season) as Season[],
    gender: list(sp.gender) as Gender[],
    availability: list(sp.availability) as ("available" | "prebook")[],
    color: list(sp.color),
    price: list(sp.price),
    flag: list(sp.flag).filter((v): v is CatalogFlag =>
      FLAG_OPTIONS.some((o) => o.value === v),
    ),
  };
}

/**
 * `matchedIds`, when provided, is the result of a Postgres full-text search for
 * `filters.q` (see `searchStyleIds` in `src/lib/data/styles.ts`) — it replaces the
 * plain substring name/styleNumber check below with the DB's ranked match set.
 *
 * `inStockIds` powers the "in stock now" flag. Stock lives in a separate table, so
 * callers that haven't loaded inventory simply omit it and that one flag no-ops rather
 * than silently filtering everything out.
 */
export function filterStyles(
  styles: Style[],
  filters: CatalogFilters,
  matchedIds?: Set<string>,
  inStockIds?: Set<string>,
): Style[] {
  return styles.filter((s) => {
    if (filters.q) {
      if (matchedIds) {
        if (!matchedIds.has(s.id)) return false;
      } else {
        const q = filters.q.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.styleNumber.toLowerCase().includes(q)) return false;
      }
    }
    if (filters.category.length && !filters.category.includes(s.category)) return false;
    // A "both" style belongs to Summer and Winter at once, so it should survive a
    // season-filter checkbox regardless of which one(s) are checked.
    if (filters.season.length && s.season !== "both" && !filters.season.includes(s.season)) return false;
    if (filters.gender.length && !filters.gender.includes(s.gender)) return false;
    if (filters.availability.length && !filters.availability.includes(s.availability)) return false;
    if (filters.color.length) {
      // Exact match, not substring: the options are now the real colourway
      // names (see `colorOptionsFromStyles`), so a substring test would make
      // "TAN" silently also select every "TAN BROWN" style. That was tolerable
      // when the options were invented colour *families*; it is just wrong when
      // the user is picking a specific colourway off the list.
      const hasColor = s.colorways.some((c) =>
        filters.color.some((name) => c.name.trim().toLowerCase() === name.trim().toLowerCase()),
      );
      if (!hasColor) return false;
    }
    if (filters.price.length) {
      const price = s.basePrice;
      const inBand = filters.price.some((bandId) => {
        const band = PRICE_BANDS.find((b) => b.id === bandId);
        return band && price >= band.min && price < band.max;
      });
      if (!inBand) return false;
    }
    for (const flag of filters.flag) {
      if (flag === "sale" && !isOnSale(s)) return false;
      if (flag === "featured" && !s.featured) return false;
      if (flag === "instock" && inStockIds && !inStockIds.has(s.id)) return false;
    }
    return true;
  });
}
