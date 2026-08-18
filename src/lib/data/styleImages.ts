import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { assertAllowedExtension, IMAGE_EXTENSIONS } from "@/lib/uploadValidation";
import { fromDbId, toDbId } from "@/lib/data/dbIds";

const BUCKET = "style-images";

export interface StyleImage {
  id: string;
  styleId: string;
  storagePath: string;
  altText: string;
  /** Optional visible caption, distinct from alt text. Added by migration 0025 —
   * defaults to "" when that migration hasn't run. */
  caption: string;
  isPrimary: boolean;
  sortOrder: number;
  publicUrl: string;
  /** Which colorway this photo actually shows — unset means it's a generic/style-level
   * photo shown regardless of the buyer's colorway selection. */
  colorwayId?: string;
}

interface StyleImageRow {
  id: string;
  style_id: string;
  storage_path: string;
  alt_text: string;
  caption?: string | null;
  is_primary: boolean;
  sort_order: number;
  colorway_id: string | null;
}

function mapImage(row: StyleImageRow): StyleImage {
  return {
    id: row.id,
    styleId: row.style_id,
    storagePath: row.storage_path,
    altText: row.alt_text,
    caption: row.caption ?? "",
    isPrimary: row.is_primary,
    sortOrder: row.sort_order,
    publicUrl: supabaseAdmin.storage.from(BUCKET).getPublicUrl(row.storage_path).data.publicUrl,
    // colorways are stored as "${styleId}-${localId}" (see dbIds.ts); the app layer
    // (Colorway.id, the ColorwaySelectionProvider's colorwayId) uses the short local id.
    colorwayId: row.colorway_id ? fromDbId(row.style_id, row.colorway_id) : undefined,
  };
}

export async function listImagesForStyle(styleId: string): Promise<StyleImage[]> {
  const { data, error } = await supabaseAdmin
    .from("style_images")
    .select("*")
    .eq("style_id", styleId)
    .order("sort_order");
  if (error) throw new Error(`style_images: ${error.message}`);
  return (data ?? []).map(mapImage);
}

/** Batch variant for catalogue grids — one query instead of one per card. */
export async function listImagesForStyles(styleIds: string[]): Promise<Record<string, StyleImage[]>> {
  if (styleIds.length === 0) return {};
  const { data, error } = await supabaseAdmin
    .from("style_images")
    .select("*")
    .in("style_id", styleIds)
    .order("sort_order");
  if (error) throw new Error(`style_images: ${error.message}`);
  const byStyle: Record<string, StyleImage[]> = {};
  for (const row of data ?? []) {
    const image = mapImage(row);
    (byStyle[image.styleId] ??= []).push(image);
  }
  return byStyle;
}

/** Mints a signed Storage upload slot — the browser PUTs the file bytes directly
 * to Supabase using this, never through the Next.js server (see supabase/browser.ts). */
export async function createStyleImageUploadTarget(
  styleId: string,
  fileName: string,
): Promise<{ bucket: string; path: string; token: string }> {
  assertAllowedExtension(fileName, IMAGE_EXTENSIONS);
  const path = `${styleId}/${crypto.randomUUID()}-${fileName}`;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(`storage createSignedUploadUrl: ${error.message}`);
  return { bucket: BUCKET, path: data.path, token: data.token };
}

/**
 * A usable default alt text, so a photo can never ship with none.
 *
 * Uploads used to insert `alt_text: ""` and rely on someone typing one in the Media tab
 * later — nobody did, and two thirds of the catalogue's photography ended up with empty
 * alt attributes. A generated description ("5109 Brown - Leather formal boots, product
 * photo") is worse than a hand-written one and far better than nothing, for both screen
 * readers and image search. An admin editing it afterwards still wins; this only fills the
 * blank that would otherwise persist.
 */
export function defaultAltText(styleName: string, styleNumber?: string): string {
  const name = styleName.trim();
  const suffix = styleNumber?.trim() ? ` (${styleNumber.trim()})` : "";
  return name ? `${name}${suffix} — product photo` : "Product photo";
}

/** Called once the browser has finished the direct-to-Storage upload for `path`. */
export async function finalizeStyleImageUpload(styleId: string, path: string): Promise<void> {
  const existing = await listImagesForStyle(styleId);
  const { data: styleRow } = await supabaseAdmin
    .from("styles")
    .select("name, style_number")
    .eq("id", styleId)
    .limit(1);
  const style = styleRow?.[0] as { name: string; style_number: string } | undefined;

  const { error } = await supabaseAdmin.from("style_images").insert({
    style_id: styleId,
    storage_path: path,
    alt_text: style ? defaultAltText(style.name, style.style_number) : "",
    sort_order: existing.length,
    is_primary: existing.length === 0,
  });
  if (error) throw new Error(`style_images: ${error.message}`);
}

export async function setPrimaryImage(styleId: string, imageId: string): Promise<void> {
  const { error: clearError } = await supabaseAdmin
    .from("style_images")
    .update({ is_primary: false })
    .eq("style_id", styleId);
  if (clearError) throw new Error(`style_images: ${clearError.message}`);

  const { error } = await supabaseAdmin.from("style_images").update({ is_primary: true }).eq("id", imageId);
  if (error) throw new Error(`style_images: ${error.message}`);
}

export async function updateImageAltText(imageId: string, altText: string): Promise<void> {
  const { error } = await supabaseAdmin.from("style_images").update({ alt_text: altText }).eq("id", imageId);
  if (error) throw new Error(`style_images: ${error.message}`);
}

/**
 * Bulk alt-text write, used by the SEO dashboard's "generate missing alt text"
 * action. One statement per row rather than an upsert: `style_images` rows have
 * columns this caller knows nothing about, and an upsert would blank them.
 */
export async function setAltTextBulk(updates: { imageId: string; altText: string }[]): Promise<void> {
  await Promise.all(updates.map((update) => updateImageAltText(update.imageId, update.altText)));
}

/**
 * Every image on the site with the product context the audit engine needs to
 * judge (and generate) alt text. Falls back to an empty list pre-migration.
 */
export async function listAllImagesWithContext(): Promise<
  { id: string; styleId: string; altText: string; caption: string; publicUrl: string }[]
> {
  // `select("*")` rather than a column list so this still works before
  // migration 0025 adds `caption` — mapImage defaults it.
  const { data, error } = await supabaseAdmin.from("style_images").select("*");
  if (error || !data) return [];
  return (data as StyleImageRow[]).map((row) => {
    const image = mapImage(row);
    return {
      id: image.id,
      styleId: image.styleId,
      altText: image.altText,
      caption: image.caption,
      publicUrl: image.publicUrl,
    };
  });
}

/** `colorwayId` (the app-level short local id, e.g. "c1") of `null` clears the tag (photo
 * becomes generic/style-level again). */
export async function updateImageColorway(styleId: string, imageId: string, colorwayId: string | null): Promise<void> {
  const { error } = await supabaseAdmin
    .from("style_images")
    .update({ colorway_id: colorwayId ? toDbId(styleId, colorwayId) : null })
    .eq("id", imageId);
  if (error) throw new Error(`style_images: ${error.message}`);
}

export async function reorderStyleImages(styleId: string, orderedImageIds: string[]): Promise<void> {
  await Promise.all(
    orderedImageIds.map((id, index) => supabaseAdmin.from("style_images").update({ sort_order: index }).eq("id", id).eq("style_id", styleId)),
  );
}

export async function deleteStyleImage(imageId: string): Promise<void> {
  const { data, error: fetchError } = await supabaseAdmin
    .from("style_images")
    .select("storage_path")
    .eq("id", imageId)
    .limit(1);
  if (fetchError) throw new Error(`style_images: ${fetchError.message}`);
  const storagePath = data?.[0]?.storage_path;

  const { error } = await supabaseAdmin.from("style_images").delete().eq("id", imageId);
  if (error) throw new Error(`style_images: ${error.message}`);

  if (storagePath) {
    const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    if (removeError) throw new Error(`storage remove: ${removeError.message}`);
  }
}
