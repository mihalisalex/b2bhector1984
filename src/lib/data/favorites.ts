import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

/** Falls back to an empty set (not an error) if migration 0018 hasn't run yet. */
export async function getFavoriteStyleIds(accountId: string): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin.from("favorites").select("style_id").eq("account_id", accountId);
  if (error) {
    console.warn(`favorites query failed (has migration 0018 been run?): ${error.message}`);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.style_id as string));
}

export async function isFavorite(accountId: string, styleId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("favorites")
    .select("style_id")
    .eq("account_id", accountId)
    .eq("style_id", styleId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function addFavorite(accountId: string, styleId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("favorites").upsert({ account_id: accountId, style_id: styleId });
  if (error) throw new Error(`favorites: ${error.message}`);
}

export async function removeFavorite(accountId: string, styleId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("favorites").delete().eq("account_id", accountId).eq("style_id", styleId);
  if (error) throw new Error(`favorites: ${error.message}`);
}
