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

/** Called once the browser has finished the direct-to-Storage upload for `path`. */
export async function finalizeStyleImageUpload(styleId: string, path: string): Promise<void> {
  const existing = await listImagesForStyle(styleId);
  const { error } = await supabaseAdmin.from("style_images").insert({
    style_id: styleId,
    storage_path: path,
    alt_text: "",
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
