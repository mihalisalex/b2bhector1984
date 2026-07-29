import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { BoxTypeId, SavedAssortment, SavedAssortmentLine } from "@/lib/types";

/** Migration 0021 adds colorway_id/box_type_id/qty to saved_assortment_styles — until an
 * admin runs it, those columns don't exist yet. Detect that specific PostgREST error so
 * reads/writes can fall back to the pre-migration style-only shape instead of crashing. */
function isMissingSchemaError(message: string): boolean {
  return message.includes("schema cache") || message.includes("does not exist") || message.includes("Could not find");
}

export async function getAssortmentsForAccount(accountId: string): Promise<SavedAssortment[]> {
  const { data: assortmentRows, error } = await supabaseAdmin
    .from("saved_assortments")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`saved_assortments: ${error.message}`);
  if (!assortmentRows || assortmentRows.length === 0) return [];

  const assortmentIds = assortmentRows.map((a) => a.id);
  type LineRow = { assortment_id: string; style_id: string; colorway_id: string | null; box_type_id: string | null; qty: number | null };
  let lineRows: LineRow[];

  const { data, error: lineError } = await supabaseAdmin
    .from("saved_assortment_styles")
    .select("assortment_id, style_id, colorway_id, box_type_id, qty")
    .in("assortment_id", assortmentIds);
  if (lineError) {
    if (!isMissingSchemaError(lineError.message)) throw new Error(`saved_assortment_styles: ${lineError.message}`);
    const { data: fallbackRows, error: fallbackError } = await supabaseAdmin
      .from("saved_assortment_styles")
      .select("assortment_id, style_id")
      .in("assortment_id", assortmentIds);
    if (fallbackError) throw new Error(`saved_assortment_styles: ${fallbackError.message}`);
    lineRows = (fallbackRows ?? []).map((r) => ({ ...r, colorway_id: null, box_type_id: null, qty: 1 }));
  } else {
    lineRows = data ?? [];
  }

  const linesByAssortment = new Map<string, SavedAssortmentLine[]>();
  for (const row of lineRows) {
    if (!linesByAssortment.has(row.assortment_id)) linesByAssortment.set(row.assortment_id, []);
    linesByAssortment.get(row.assortment_id)!.push({
      styleId: row.style_id,
      colorwayId: row.colorway_id ?? undefined,
      boxTypeId: (row.box_type_id as BoxTypeId | null) ?? undefined,
      qty: row.qty ?? 1,
    });
  }

  return assortmentRows.map((a) => {
    const lines = linesByAssortment.get(a.id) ?? [];
    return {
      id: a.id,
      name: a.name,
      createdAt: a.created_at,
      lines,
      styleIds: Array.from(new Set(lines.map((l) => l.styleId))),
    };
  });
}

export async function createSavedAssortment(accountId: string, name: string, lines: SavedAssortmentLine[]): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("saved_assortments")
    .insert({ account_id: accountId, name })
    .select("id")
    .limit(1);
  if (error) throw new Error(`saved_assortments: ${error.message}`);
  const assortmentId = data?.[0]?.id;
  if (!assortmentId || lines.length === 0) return;

  const { error: linkError } = await supabaseAdmin
    .from("saved_assortment_styles")
    .insert(lines.map((l) => ({ assortment_id: assortmentId, style_id: l.styleId, colorway_id: l.colorwayId ?? null, box_type_id: l.boxTypeId ?? null, qty: l.qty })));
  if (linkError) {
    if (!isMissingSchemaError(linkError.message)) throw new Error(`saved_assortment_styles: ${linkError.message}`);
    // Migration 0021 hasn't run yet — fall back to one row per unique style id,
    // matching the pre-migration shape (no line-item detail).
    const uniqueStyleIds = Array.from(new Set(lines.map((l) => l.styleId)));
    const { error: fallbackError } = await supabaseAdmin
      .from("saved_assortment_styles")
      .insert(uniqueStyleIds.map((styleId) => ({ assortment_id: assortmentId, style_id: styleId })));
    if (fallbackError) throw new Error(`saved_assortment_styles: ${fallbackError.message}`);
  }
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
