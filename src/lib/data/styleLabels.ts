import type { Dictionary } from "@/i18n/dictionaries/en";
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

/**
 * Labels for the catalogue facets. The option arrays in catalogFilters.ts / catalogSort.ts
 * still carry an English `label` — that is what the ADMIN screens and CSV exports read, and
 * they stay English by decision. These lookups are what the buyer-facing toolbars use
 * instead, so the same option list can serve both without a second source of truth for the
 * values themselves.
 */
export function sortLabel(dict: Dictionary, sort: string): string {
  const c = dict.catalog;
  return {
    newest: c.sortNewest,
    oldest: c.sortOldest,
    best_selling: c.sortBestSelling,
    price_asc: c.sortPriceAsc,
    price_desc: c.sortPriceDesc,
    alphabetical: c.sortAlphabetical,
  }[sort] ?? sort;
}

export function flagLabel(dict: Dictionary, flag: string): string {
  const c = dict.catalog;
  return { instock: c.flagInstock, sale: c.flagSale, featured: c.flagFeatured }[flag] ?? flag;
}

export function availabilityLabel(dict: Dictionary, value: string): string {
  const c = dict.catalog;
  return { available: c.availAvailable, prebook: c.availPrebook }[value] ?? value;
}

export function priceBandLabel(dict: Dictionary, bandId: string): string {
  const c = dict.catalog;
  return { u30: c.bandUnder30, "30-40": c.band30to40, "40-50": c.band40to50, "50up": c.band50up }[bandId] ?? bandId;
}

/** Pre-order vs made-to-order, localised. Replaces the English-only `backorderLabel`. */
export function backorderLabelFor(dict: Dictionary, style: Style): string {
  return style.backorderMode === "pre_order" ? dict.catalog.preOrder : dict.catalog.madeToOrder;
}

/**
 * Journal categories are a free-text column, so this maps the five that exist today and
 * falls back to the stored value for anything added later — a new category shows in the
 * admin's own words rather than disappearing. Add a key here when you add a category.
 */
export function journalCategoryLabel(dict: Dictionary, category: string): string {
  const j = dict.journal;
  return {
    "Buyer Guides": j.catBuyerGuides,
    "Market Trends": j.catMarketTrends,
    "Industry Insights": j.catIndustryInsights,
    "Supplier Guides": j.catSupplierGuides,
    "Procurement Insights": j.catProcurementInsights,
  }[category] ?? category;
}
