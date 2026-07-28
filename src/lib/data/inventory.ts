import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fromDbId, toDbId } from "@/lib/data/dbIds";
import type { BoxTypeId } from "@/lib/types";

export interface InventoryLevel {
  colorwayId: string; // local id, e.g. "c1"
  boxTypeId: BoxTypeId;
  onHand: number;
}

/** colorwayId (local) -> boxTypeId -> on-hand boxes, for one style. */
export type StyleInventory = Record<string, Partial<Record<BoxTypeId, number>>>;

function toStyleInventory(styleId: string, rows: { colorway_id: string; box_type_id: BoxTypeId; on_hand: number }[]): StyleInventory {
  const map: StyleInventory = {};
  for (const row of rows) {
    const colorwayId = fromDbId(styleId, row.colorway_id);
    map[colorwayId] = map[colorwayId] || {};
    map[colorwayId][row.box_type_id] = row.on_hand;
  }
  return map;
}

export async function getInventoryForStyle(styleId: string): Promise<StyleInventory> {
  const { data, error } = await supabaseAdmin.from("inventory").select("colorway_id, box_type_id, on_hand").eq("style_id", styleId);
  if (error) throw new Error(`inventory: ${error.message}`);
  return toStyleInventory(styleId, data ?? []);
}

/** styleId -> StyleInventory, batched for a whole catalog/linesheet view. */
export async function getInventoryForStyles(styleIds: string[]): Promise<Record<string, StyleInventory>> {
  if (styleIds.length === 0) return {};
  const { data, error } = await supabaseAdmin
    .from("inventory")
    .select("style_id, colorway_id, box_type_id, on_hand")
    .in("style_id", styleIds);
  if (error) throw new Error(`inventory: ${error.message}`);

  const byStyle = new Map<string, { colorway_id: string; box_type_id: BoxTypeId; on_hand: number }[]>();
  for (const row of data ?? []) {
    if (!byStyle.has(row.style_id)) byStyle.set(row.style_id, []);
    byStyle.get(row.style_id)!.push(row);
  }

  const result: Record<string, StyleInventory> = {};
  for (const styleId of styleIds) result[styleId] = toStyleInventory(styleId, byStyle.get(styleId) ?? []);
  return result;
}

export async function setInventoryLevel(styleId: string, colorwayLocalId: string, boxTypeId: BoxTypeId, onHand: number): Promise<void> {
  const { error } = await supabaseAdmin.from("inventory").upsert(
    { style_id: styleId, colorway_id: toDbId(styleId, colorwayLocalId), box_type_id: boxTypeId, on_hand: Math.max(0, onHand) },
    { onConflict: "style_id,colorway_id,box_type_id" },
  );
  if (error) throw new Error(`inventory: ${error.message}`);
}

export interface StockLine {
  styleId: string;
  colorwayId: string; // local id
  boxTypeId: BoxTypeId;
  qty: number;
}

/**
 * Atomically decrements stock for every line via the `adjust_inventory` DB
 * function (race-safe: the update's WHERE clause guards against going
 * negative). If any line fails — insufficient stock, or no inventory row
 * exists yet for that combination — every line already decremented in this
 * call is rolled back before returning, so a partial order never silently
 * reserves stock for lines that didn't actually get ordered.
 */
export async function decrementInventoryForOrder(lines: StockLine[]): Promise<{ ok: true } | { ok: false; failedLine: StockLine }> {
  const succeeded: StockLine[] = [];
  for (const line of lines) {
    const { data, error } = await supabaseAdmin.rpc("adjust_inventory", {
      p_style_id: line.styleId,
      p_colorway_id: toDbId(line.styleId, line.colorwayId),
      p_box_type_id: line.boxTypeId,
      p_qty: line.qty,
    });
    if (error) throw new Error(`adjust_inventory: ${error.message}`);
    if (!data) {
      for (const done of succeeded) {
        await supabaseAdmin.rpc("adjust_inventory", {
          p_style_id: done.styleId,
          p_colorway_id: toDbId(done.styleId, done.colorwayId),
          p_box_type_id: done.boxTypeId,
          p_qty: -done.qty,
        });
      }
      return { ok: false, failedLine: line };
    }
    succeeded.push(line);
  }
  return { ok: true };
}
