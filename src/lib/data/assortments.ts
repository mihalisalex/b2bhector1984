import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { SavedAssortment } from "@/lib/types";

export async function getAssortmentsForAccount(accountId: string): Promise<SavedAssortment[]> {
  const { data: assortmentRows, error } = await supabaseAdmin
    .from("saved_assortments")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`saved_assortments: ${error.message}`);
  if (!assortmentRows || assortmentRows.length === 0) return [];

  const { data: styleRows, error: styleError } = await supabaseAdmin
    .from("saved_assortment_styles")
    .select("assortment_id, style_id")
    .in(
      "assortment_id",
      assortmentRows.map((a) => a.id),
    );
  if (styleError) throw new Error(`saved_assortment_styles: ${styleError.message}`);

  const stylesByAssortment = new Map<string, string[]>();
  for (const row of styleRows ?? []) {
    if (!stylesByAssortment.has(row.assortment_id)) stylesByAssortment.set(row.assortment_id, []);
    stylesByAssortment.get(row.assortment_id)!.push(row.style_id);
  }

  return assortmentRows.map((a) => ({
    id: a.id,
    name: a.name,
    createdAt: a.created_at,
    styleIds: stylesByAssortment.get(a.id) ?? [],
  }));
}

export async function createSavedAssortment(accountId: string, name: string, styleIds: string[]): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("saved_assortments")
    .insert({ account_id: accountId, name })
    .select("id")
    .limit(1);
  if (error) throw new Error(`saved_assortments: ${error.message}`);
  const assortmentId = data?.[0]?.id;
  if (!assortmentId || styleIds.length === 0) return;

  const { error: linkError } = await supabaseAdmin
    .from("saved_assortment_styles")
    .insert(styleIds.map((styleId) => ({ assortment_id: assortmentId, style_id: styleId })));
  if (linkError) throw new Error(`saved_assortment_styles: ${linkError.message}`);
}

/** `saved_assortment_styles` rows cascade-delete with the parent (see 0001_init.sql). */
export async function deleteSavedAssortment(accountId: string, assortmentId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("saved_assortments")
    .delete()
    .eq("id", assortmentId)
    .eq("account_id", accountId);
  if (error) throw new Error(`saved_assortments: ${error.message}`);
}
