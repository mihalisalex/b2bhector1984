import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fromDbId, toNumber } from "@/lib/data/dbIds";
import { getEnabledSeasons } from "@/lib/data/seasonSettings";
import type { BoxTypeId, Colorway, ProductStatus, Style } from "@/lib/types";

interface StyleRow {
  id: string;
  slug: string;
  style_number: string;
  name: string;
  category: Style["category"];
  season: Style["season"];
  gender: Style["gender"];
  availability: Style["availability"];
  ship_window: string | null;
  tagline: string;
  description: string;
  materials: string[];
  base_price: number | string;
  msrp: number | string;
  weight_oz: number | string | null;
  last_note: string | null;
  available_box_types: BoxTypeId[];
  created_at?: string;
  // --- Product-module columns (migrations 0013-0015) — all optional here so
  // this mapper degrades gracefully if those migrations haven't run yet. ---
  brand_id?: string;
  supplier_id?: string | null;
  product_type?: string;
  tags?: string[];
  status?: ProductStatus;
  featured?: boolean;
  publish_at?: string | null;
  cost_price?: number | string | null;
  distributor_price?: number | string | null;
  sale_price?: number | string | null;
  sale_start_at?: string | null;
  sale_end_at?: string | null;
  currency?: string;
  tax_class?: string;
  vat_rate?: number | string;
  barcode?: string | null;
  gtin?: string | null;
  upc?: string | null;
  mpn?: string | null;
  low_stock_threshold?: number;
  track_inventory?: boolean;
  allow_backorder?: boolean;
  backorder_mode?: "made_to_order" | "pre_order";
  incoming_stock?: number;
  seo_title?: string | null;
  meta_description?: string | null;
  seo_keywords?: string[];
  canonical_url?: string | null;
  robots?: string;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  twitter_card?: string;
  structured_data?: Record<string, unknown> | null;
  focus_keyword?: string | null;
  secondary_keywords?: string[];
  twitter_title?: string | null;
  twitter_description?: string | null;
  twitter_image_url?: string | null;
  length_cm?: number | string | null;
  width_cm?: number | string | null;
  height_cm?: number | string | null;
  shipping_class?: string;
  freight_class?: string | null;
  hazardous?: boolean;
  package_length_cm?: number | string | null;
  package_width_cm?: number | string | null;
  package_height_cm?: number | string | null;
}

interface ColorwayRow {
  id: string;
  style_id: string;
  name: string;
  sku_suffix: string;
  swatch_1: string;
  swatch_2: string | null;
  sort_order: number;
  sku?: string | null;
  barcode?: string | null;
  price_override?: number | string | null;
  cost_override?: number | string | null;
  sale_price_override?: number | string | null;
  weight_oz?: number | string | null;
  length_cm?: number | string | null;
  width_cm?: number | string | null;
  height_cm?: number | string | null;
  status?: "active" | "draft" | "archived";
}

interface StyleImageRow {
  style_id: string;
  storage_path: string;
}

function mapColorway(row: ColorwayRow): Colorway {
  return {
    id: fromDbId(row.style_id, row.id),
    name: row.name,
    swatch: [row.swatch_1, row.swatch_2 ?? undefined],
    skuSuffix: row.sku_suffix,
    sku: row.sku ?? undefined,
    barcode: row.barcode ?? undefined,
    priceOverride: row.price_override != null ? toNumber(row.price_override) : undefined,
    costOverride: row.cost_override != null ? toNumber(row.cost_override) : undefined,
    salePriceOverride: row.sale_price_override != null ? toNumber(row.sale_price_override) : undefined,
    weightOz: row.weight_oz != null ? toNumber(row.weight_oz) : undefined,
    lengthCm: row.length_cm != null ? toNumber(row.length_cm) : undefined,
    widthCm: row.width_cm != null ? toNumber(row.width_cm) : undefined,
    heightCm: row.height_cm != null ? toNumber(row.height_cm) : undefined,
    status: row.status ?? "active",
  };
}

function assembleStyles(
  styleRows: StyleRow[],
  colorwayRows: ColorwayRow[],
  imageRows: StyleImageRow[],
): Style[] {
  const colorwaysByStyle = new Map<string, ColorwayRow[]>();
  for (const row of colorwayRows) {
    if (!colorwaysByStyle.has(row.style_id)) colorwaysByStyle.set(row.style_id, []);
    colorwaysByStyle.get(row.style_id)!.push(row);
  }
  const imageByStyle = new Map<string, string>();
  for (const row of imageRows) imageByStyle.set(row.style_id, row.storage_path);

  return styleRows.map((s) => {
    const colorways = (colorwaysByStyle.get(s.id) ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapColorway);
    const storagePath = imageByStyle.get(s.id);
    const primaryImageUrl = storagePath
      ? supabaseAdmin.storage.from("style-images").getPublicUrl(storagePath).data.publicUrl
      : undefined;

    return {
      id: s.id,
      slug: s.slug,
      styleNumber: s.style_number,
      name: s.name,
      category: s.category,
      season: s.season,
      gender: s.gender,
      availability: s.availability,
      shipWindow: s.ship_window ?? undefined,
      tagline: s.tagline,
      description: s.description,
      materials: s.materials,
      colorways,
      basePrice: toNumber(s.base_price),
      msrp: toNumber(s.msrp),
      weightOz: toNumber(s.weight_oz ?? 0),
      lastNote: s.last_note ?? "",
      primaryImageUrl,
      // Falls back to all 3 boxes until migration 0003 (available_box_types) has been run.
      availableBoxTypes: s.available_box_types ?? ["box8", "box10", "box12"],
      createdAt: s.created_at ?? new Date(0).toISOString(),

      // Everything below defaults sanely if migrations 0013-0015 haven't run
      // yet — the admin Products module flags that explicitly; every other
      // page in the app (catalogue, cart, checkout, etc) keeps working either way.
      brandId: s.brand_id ?? "hector-footwear",
      brandName: "",
      supplierId: s.supplier_id ?? undefined,
      productType: s.product_type ?? "Footwear",
      tags: s.tags ?? [],
      collectionIds: [],
      status: s.status ?? "active",
      featured: s.featured ?? false,
      publishAt: s.publish_at ?? undefined,

      costPrice: toNumber(s.cost_price ?? 0),
      distributorPrice: s.distributor_price != null ? toNumber(s.distributor_price) : undefined,
      salePrice: s.sale_price != null ? toNumber(s.sale_price) : undefined,
      saleStartAt: s.sale_start_at ?? undefined,
      saleEndAt: s.sale_end_at ?? undefined,
      currency: s.currency ?? "EUR",
      taxClass: s.tax_class ?? "standard",
      vatRate: toNumber(s.vat_rate ?? 0.24),
      customerGroupPrices: [],

      barcode: s.barcode ?? undefined,
      gtin: s.gtin ?? undefined,
      upc: s.upc ?? undefined,
      mpn: s.mpn ?? undefined,
      lowStockThreshold: s.low_stock_threshold ?? 5,
      trackInventory: s.track_inventory ?? true,
      allowBackorder: s.allow_backorder ?? false,
      backorderMode: s.backorder_mode ?? "made_to_order",
      incomingStock: s.incoming_stock ?? 0,

      seoTitle: s.seo_title ?? undefined,
      metaDescription: s.meta_description ?? undefined,
      seoKeywords: s.seo_keywords ?? [],
      canonicalUrl: s.canonical_url ?? undefined,
      robots: s.robots ?? "index,follow",
      ogTitle: s.og_title ?? undefined,
      ogDescription: s.og_description ?? undefined,
      ogImageUrl: s.og_image_url ?? undefined,
      twitterCard: s.twitter_card ?? "summary_large_image",
      structuredData: s.structured_data ?? undefined,
      focusKeyword: s.focus_keyword ?? undefined,
      secondaryKeywords: s.secondary_keywords ?? [],
      twitterTitle: s.twitter_title ?? undefined,
      twitterDescription: s.twitter_description ?? undefined,
      twitterImageUrl: s.twitter_image_url ?? undefined,

      relations: [],
      documents: [],
      attributes: [],

      lengthCm: s.length_cm != null ? toNumber(s.length_cm) : undefined,
      widthCm: s.width_cm != null ? toNumber(s.width_cm) : undefined,
      heightCm: s.height_cm != null ? toNumber(s.height_cm) : undefined,
      shippingClass: s.shipping_class ?? "standard",
      freightClass: s.freight_class ?? undefined,
      hazardous: s.hazardous ?? false,
      packageLengthCm: s.package_length_cm != null ? toNumber(s.package_length_cm) : undefined,
      packageWidthCm: s.package_width_cm != null ? toNumber(s.package_width_cm) : undefined,
      packageHeightCm: s.package_height_cm != null ? toNumber(s.package_height_cm) : undefined,
    };
  });
}

async function fetchStyles(styleRows: StyleRow[]): Promise<Style[]> {
  if (styleRows.length === 0) return [];
  const styleIds = styleRows.map((s) => s.id);

  const [{ data: colorwayRows, error: colorwayError }, { data: imageRows, error: imageError }] =
    await Promise.all([
      // Explicit order: Postgres/PostgREST don't guarantee row order without one, and
      // callers rely on colorways[0] being the deterministic "default" colorway (product
      // page, catalogue cards) — that must always be the same one, not whatever the
      // query planner happens to return first.
      supabaseAdmin.from("colorways").select("*").in("style_id", styleIds).order("sort_order"),
      supabaseAdmin
        .from("style_images")
        .select("style_id, storage_path")
        .in("style_id", styleIds)
        .eq("is_primary", true),
    ]);
  if (colorwayError) throw new Error(`colorways: ${colorwayError.message}`);
  if (imageError) throw new Error(`style_images: ${imageError.message}`);

  return assembleStyles(styleRows, colorwayRows ?? [], imageRows ?? []);
}

/**
 * `cache()`-wrapped so multiple call sites in the same request's render tree
 * (shop layout + page, which both need the full catalog) share one fetch
 * instead of re-querying the DB once per caller.
 */
export const getAllStyles = cache(async (): Promise<Style[]> => {
  const [{ data, error }, enabledSeasons] = await Promise.all([
    supabaseAdmin.from("styles").select("*").order("id"),
    getEnabledSeasons(),
  ]);
  if (error) throw new Error(`styles: ${error.message}`);
  const visible = (data ?? []).filter((row) => enabledSeasons.has(row.season));
  return fetchStyles(visible);
});

export const getStyleBySlug = cache(async (slug: string): Promise<Style | undefined> => {
  const { data, error } = await supabaseAdmin.from("styles").select("*").eq("slug", slug).limit(1);
  if (error) throw new Error(`styles: ${error.message}`);
  const [style] = await fetchStyles(data ?? []);
  return style;
});

/**
 * `getAllStyles`, filtered down to what a buyer should ever see or be able to add to
 * cart: `status === "active"` (drafts/archived/private are admin-only) AND at least one
 * colorway (box-only ordering has nothing to sell without one).
 *
 * Use this from every storefront listing/lookup surface — catalogue, quick-order, cart,
 * homepage, collections, favorites, assortments, both root layouts' `CatalogProvider`
 * seed, `getRelatedStyles` below. Admin surfaces (`/admin/products`, order detail's
 * historical style lookups, CSV/XML import duplicate checks, analytics) must keep calling
 * `getAllStyles`/`getStyleById` directly — they need to see drafts and to resolve styles
 * that orders reference even after the style is archived or deleted.
 *
 * This is the fix for a real crash: a freshly created product has zero colorways until
 * an admin adds one on the Variants tab, and every storefront card/row/gallery does an
 * unguarded `style.colorways[0].swatch` — so the moment a new draft leaked into
 * `getAllStyles()`'s unfiltered result, the entire catalogue (and anywhere else that
 * style rendered) threw and 500'd for every buyer, not just admins previewing it.
 */
export const getStorefrontStyles = cache(async (): Promise<Style[]> => {
  const styles = await getAllStyles();
  return styles.filter((s) => (s.status ?? "active") === "active" && s.colorways.length > 0);
});

/** Batch-fetch by id in one query — use this instead of looping `getStyleById` per id. */
export async function getStylesByIds(ids: string[]): Promise<Style[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabaseAdmin.from("styles").select("*").in("id", ids);
  if (error) throw new Error(`styles: ${error.message}`);
  return fetchStyles(data ?? []);
}

/**
 * Postgres full-text search over `styles.search_vector` (migration 0010) —
 * returns matching style ids for `filterStyles`' `matchedIds` param. Falls
 * back to an empty set (matches nothing) on a malformed query rather than
 * throwing, since `q` is raw user input from a search box.
 */
export async function searchStyleIds(query: string): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from("styles")
    .select("id")
    .textSearch("search_vector", query, { type: "websearch" });
  if (error) return new Set();
  return new Set((data ?? []).map((row) => row.id as string));
}

export const getStyleById = cache(async (id: string): Promise<Style | undefined> => {
  const { data, error } = await supabaseAdmin.from("styles").select("*").eq("id", id).limit(1);
  if (error) throw new Error(`styles: ${error.message}`);
  const [style] = await fetchStyles(data ?? []);
  return style;
});

/** Same-category picks first, topped up with same-season picks if there aren't enough. */
export async function getRelatedStyles(style: Style, limit = 4): Promise<Style[]> {
  const all = await getStorefrontStyles();
  const sameCategory = all.filter((s) => s.id !== style.id && s.category === style.category);
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);

  const seen = new Set(sameCategory.map((s) => s.id));
  const sameSeason = all.filter((s) => s.id !== style.id && s.season === style.season && !seen.has(s.id));
  return [...sameCategory, ...sameSeason].slice(0, limit);
}

export async function updateAvailableBoxTypes(styleId: string, boxTypeIds: BoxTypeId[]): Promise<void> {
  const { error } = await supabaseAdmin
    .from("styles")
    .update({ available_box_types: boxTypeIds })
    .eq("id", styleId);
  if (error) throw new Error(`styles: ${error.message}`);
}

export { CATEGORY_LABEL, GENDER_LABEL, SEASON_LABEL, getStyleImageUrl } from "@/lib/data/styleLabels";
