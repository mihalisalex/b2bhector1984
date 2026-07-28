import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fromDbId, toNumber } from "@/lib/data/dbIds";
import type { BoxTypeId, Colorway, Style } from "@/lib/types";

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
}

interface ColorwayRow {
  id: string;
  style_id: string;
  name: string;
  sku_suffix: string;
  swatch_1: string;
  swatch_2: string | null;
  sort_order: number;
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
    };
  });
}

async function fetchStyles(styleRows: StyleRow[]): Promise<Style[]> {
  if (styleRows.length === 0) return [];
  const styleIds = styleRows.map((s) => s.id);

  const [{ data: colorwayRows, error: colorwayError }, { data: imageRows, error: imageError }] =
    await Promise.all([
      supabaseAdmin.from("colorways").select("*").in("style_id", styleIds),
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

export async function getAllStyles(): Promise<Style[]> {
  const { data, error } = await supabaseAdmin.from("styles").select("*").order("id");
  if (error) throw new Error(`styles: ${error.message}`);
  return fetchStyles(data ?? []);
}

export async function getStyleBySlug(slug: string): Promise<Style | undefined> {
  const { data, error } = await supabaseAdmin.from("styles").select("*").eq("slug", slug).limit(1);
  if (error) throw new Error(`styles: ${error.message}`);
  const [style] = await fetchStyles(data ?? []);
  return style;
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

export async function getStyleById(id: string): Promise<Style | undefined> {
  const { data, error } = await supabaseAdmin.from("styles").select("*").eq("id", id).limit(1);
  if (error) throw new Error(`styles: ${error.message}`);
  const [style] = await fetchStyles(data ?? []);
  return style;
}

/** Same-category picks first, topped up with same-season picks if there aren't enough. */
export async function getRelatedStyles(style: Style, limit = 4): Promise<Style[]> {
  const all = await getAllStyles();
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
