import { isOnSale } from "@/lib/pricing";
import type { Category, Gender, Season, Style } from "@/lib/types";

/** Quick toggles backed by real fields, not curated lists. */
export const FLAG_OPTIONS = [
  { value: "instock", label: "In stock now" },
  { value: "sale", label: "On sale" },
  { value: "featured", label: "Featured" },
] as const;

export type CatalogFlag = (typeof FLAG_OPTIONS)[number]["value"];

export const COLOR_FAMILIES = [
  "Ink", "Cinder", "Bone", "Chalk", "Signal", "Navy", "Red", "Yellow", "Merlot", "Olive", "Ember",
] as const;

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
      const hasColor = s.colorways.some((c) =>
        filters.color.some((fam) => c.name.toLowerCase().includes(fam.toLowerCase())),
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
