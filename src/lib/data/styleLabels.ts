import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Style } from "@/lib/types";

/**
 * Plain static label maps — kept out of styles.ts (which is `server-only`)
 * so client components can import them without pulling in the Supabase reads.
 */
/**
 * What to call a style that can be ordered past its on-hand stock. Shared by the
 * catalogue card and the list row, which had the same ternary inline — the wording here
 * has already been revised once across several files at once, so it belongs in one place.
 * Only meaningful when the style actually allows backorders; callers check that first.
 */
export function backorderLabel(style: Style): string {
  return style.backorderMode === "pre_order" ? "Pre-order" : "Made to order";
}

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
  both: "Both Seasons",
};

export const GENDER_LABEL: Record<Style["gender"], string> = {
  mens: "Men's",
  womens: "Women's",
  unisex: "Unisex",
};

/**
 * Real category-representative photos standing in until per-style product
 * photography is uploaded via the admin dashboard — a photo, not the
 * generated swatch plate, for every style right away.
 */
export const CATEGORY_PLACEHOLDER_IMAGE: Record<Style["category"], string> = {
  loafers: "/images/products/loafers.jpg",
  wedding: "/images/products/wedding.jpg",
  sneakers: "/images/products/sneakers.jpg",
  sandals: "/images/products/sandals.jpg",
  boots: "/images/products/boots.jpg",
  formal: "/images/products/formal.jpg",
  anatomic: "/images/products/anatomic.jpg",
};

/** The style's uploaded photo if one exists, otherwise its category placeholder. */
export function getStyleImageUrl(style: Style): string {
  return style.primaryImageUrl ?? CATEGORY_PLACEHOLDER_IMAGE[style.category];
}

/**
 * Locale-aware equivalents of the CATEGORY_LABEL / GENDER_LABEL / SEASON_LABEL maps above.
 *
 * The plain maps stay for the admin, which is English-only, and for any server context that
 * has no dictionary in hand. These take one — a Greek product page was showing
 * "FORMAL · MEN'S" above a Greek headline.
 */
export function categoryLabel(dict: Dictionary, category: Style["category"]): string {
  const c = dict.catalog;
  return {
    loafers: c.catLoafers,
    wedding: c.catWedding,
    sneakers: c.catSneakers,
    sandals: c.catSandals,
    boots: c.catBoots,
    formal: c.catFormal,
    anatomic: c.catAnatomic,
  }[category] ?? CATEGORY_LABEL[category];
}

export function genderLabel(dict: Dictionary, gender: Style["gender"]): string {
  const c = dict.catalog;
  return { mens: c.genderMens, womens: c.genderWomens, unisex: c.genderUnisex }[gender] ?? GENDER_LABEL[gender];
}

export function seasonLabel(dict: Dictionary, season: Style["season"]): string {
  const c = dict.catalog;
  return { summer: c.seasonSummer, winter: c.seasonWinter, both: c.seasonBoth }[season] ?? SEASON_LABEL[season];
}
