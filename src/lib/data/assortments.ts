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
