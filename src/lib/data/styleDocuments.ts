import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { DocumentKind, StyleDocument } from "@/lib/types";

const BUCKET = "style-documents";

interface StyleDocumentRow {
  id: string;
  style_id: string;
  kind: DocumentKind;
  storage_path: string;
  label: string;
  sort_order: number;
  created_at: string;
}

function mapDocument(row: StyleDocumentRow): StyleDocument {
  return {
    id: row.id,
    kind: row.kind,
    storagePath: row.storage_path,
    publicUrl: supabaseAdmin.storage.from(BUCKET).getPublicUrl(row.storage_path).data.publicUrl,
    label: row.label,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function listDocumentsForStyle(styleId: string): Promise<StyleDocument[]> {
  const { data, error } = await supabaseAdmin.from("style_documents").select("*").eq("style_id", styleId).order("sort_order");
  if (error) {
    console.warn(`style_documents query failed (has migration 0013 been run?): ${error.message}`);
    return [];
  }
  return (data ?? []).map(mapDocument);
}

/** Same signed-upload pattern as style_images (see styleImages.ts) — the browser
 * PUTs bytes directly to Storage, never through the Next.js server. */
export async function createStyleDocumentUploadTarget(
  styleId: string,
  fileName: string,
): Promise<{ bucket: string; path: string; token: string }> {
  const path = `${styleId}/${crypto.randomUUID()}-${fileName}`;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(`storage createSignedUploadUrl: ${error.message}`);
  return { bucket: BUCKET, path: data.path, token: data.token };
}

export async function finalizeStyleDocumentUpload(
  styleId: string,
  path: string,
  kind: DocumentKind,
  label: string,
): Promise<void> {
  const existing = await listDocumentsForStyle(styleId);
  const { error } = await supabaseAdmin.from("style_documents").insert({
    style_id: styleId,
    storage_path: path,
    kind,
    label,
    sort_order: existing.length,
  });
  if (error) throw new Error(`style_documents: ${error.message}`);
}

export async function deleteStyleDocument(documentId: string): Promise<void> {
  const { data, error: fetchError } = await supabaseAdmin.from("style_documents").select("storage_path").eq("id", documentId).limit(1);
  if (fetchError) throw new Error(`style_documents: ${fetchError.message}`);
  const storagePath = data?.[0]?.storage_path;

  const { error } = await supabaseAdmin.from("style_documents").delete().eq("id", documentId);
  if (error) throw new Error(`style_documents: ${error.message}`);

  if (storagePath) {
    const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    if (removeError) throw new Error(`storage remove: ${removeError.message}`);
  }
}
