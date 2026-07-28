import type { Style } from "@/lib/types";

/**
 * Plain static label maps — kept out of styles.ts (which is `server-only`)
 * so client components can import them without pulling in the Supabase reads.
 */
export const CATEGORY_LABEL: Record<Style["category"], string> = {
  loafers: "Loafers",
  wedding: "Wedding",
  sneakers: "Sneakers",
  sandals: "Sandals",
  boots: "Boots",
  formal: "Formal",
  anatomic: "Anatomic",
};

export const SEASON_LABEL: Record<Style["season"], string> = {
  summer: "Summer",
  winter: "Winter",
};

export const GENDER_LABEL: Record<Style["gender"], string> = {
  mens: "Men's",
  womens: "Women's",
  unisex: "Unisex",
};
