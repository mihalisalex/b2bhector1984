import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

const BUCKET = "style-images";

export interface StyleImage {
  id: string;
  styleId: string;
  storagePath: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
  publicUrl: string;
}

interface StyleImageRow {
  id: string;
  style_id: string;
  storage_path: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
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

export async function uploadStyleImage(styleId: string, file: File): Promise<void> {
  const path = `${styleId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) throw new Error(`storage upload: ${uploadError.message}`);

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
