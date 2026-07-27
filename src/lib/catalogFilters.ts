import type { Category, Gender, Style } from "@/lib/types";

export const COLOR_FAMILIES = [
  "Ink", "Cinder", "Bone", "Chalk", "Signal", "Navy", "Red", "Yellow", "Merlot", "Olive", "Ember",
] as const;

export const PRICE_BANDS = [
  { id: "u30", label: "Under $30", min: 0, max: 30 },
  { id: "30-40", label: "$30–40", min: 30, max: 40 },
  { id: "40-50", label: "$40–50", min: 40, max: 50 },
  { id: "50up", label: "$50+", min: 50, max: Infinity },
] as const;

export interface CatalogFilters {
  q: string;
  category: Category[];
  gender: Gender[];
  availability: ("available" | "prebook")[];
  color: string[];
  price: string[];
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): CatalogFilters {
  const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
  return {
    q: typeof sp.q === "string" ? sp.q : "",
    category: list(sp.category) as Category[],
    gender: list(sp.gender) as Gender[],
    availability: list(sp.availability) as ("available" | "prebook")[],
    color: list(sp.color),
    price: list(sp.price),
  };
}

export function filterStyles(styles: Style[], filters: CatalogFilters, tierPrice: (s: Style) => number): Style[] {
  return styles.filter((s) => {
    if (filters.q) {
      const q = filters.q.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.styleNumber.toLowerCase().includes(q)) return false;
    }
    if (filters.category.length && !filters.category.includes(s.category)) return false;
    if (filters.gender.length && !filters.gender.includes(s.gender)) return false;
    if (filters.availability.length && !filters.availability.includes(s.availability)) return false;
    if (filters.color.length) {
      const hasColor = s.colorways.some((c) =>
        filters.color.some((fam) => c.name.toLowerCase().includes(fam.toLowerCase())),
      );
      if (!hasColor) return false;
    }
    if (filters.price.length) {
      const price = tierPrice(s);
      const inBand = filters.price.some((bandId) => {
        const band = PRICE_BANDS.find((b) => b.id === bandId);
        return band && price >= band.min && price < band.max;
      });
      if (!inBand) return false;
    }
    return true;
  });
}
