import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import type { Collection } from "@/lib/types";

interface CollectionRow {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

function mapCollection(row: CollectionRow): Collection {
  return { id: row.id, name: row.name, slug: row.slug, sortOrder: row.sort_order };
}

export async function getAllCollections(): Promise<Collection[]> {
  const { data, error } = await supabaseAdmin.from("collections").select("*").order("sort_order");
  if (error) {
    console.warn(`collections query failed (has migration 0013 been run?): ${error.message}`);
    return [];
  }
  return (data ?? []).map(mapCollection);
}

export async function createCollection(name: string): Promise<Collection> {
  const slug = slugify(name);
  const { count } = await supabaseAdmin.from("collections").select("id", { count: "exact", head: true });
  const { data, error } = await supabaseAdmin
    .from("collections")
    .insert({ id: slug, name, slug, sort_order: count ?? 0 })
    .select()
    .single();
  if (error) throw new Error(`collections: ${error.message}`);
  return mapCollection(data);
}

/** styleId -> collectionIds, for a batch of styles. */
export async function getCollectionIdsForStyles(styleIds: string[]): Promise<Record<string, string[]>> {
  if (styleIds.length === 0) return {};
  const { data, error } = await supabaseAdmin.from("style_collections").select("style_id, collection_id").in("style_id", styleIds);
  if (error) {
    console.warn(`style_collections query failed (has migration 0013 been run?): ${error.message}`);
    return {};
  }
  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    map[row.style_id] = map[row.style_id] || [];
    map[row.style_id].push(row.collection_id);
  }
  return map;
}

export async function setStyleCollections(styleId: string, collectionIds: string[]): Promise<void> {
  const { error: delError } = await supabaseAdmin.from("style_collections").delete().eq("style_id", styleId);
  if (delError) throw new Error(`style_collections: ${delError.message}`);
  if (collectionIds.length === 0) return;
  const { error } = await supabaseAdmin
    .from("style_collections")
    .insert(collectionIds.map((collectionId) => ({ style_id: styleId, collection_id: collectionId })));
  if (error) throw new Error(`style_collections: ${error.message}`);
}
