import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fromDbId, toDbId } from "@/lib/data/dbIds";
import { logInventoryMovement } from "@/lib/data/inventoryMovements";
import type { BoxTypeId } from "@/lib/types";

export interface InventoryLevel {
  colorwayId: string; // local id, e.g. "c1"
  boxTypeId: BoxTypeId;
  onHand: number;
}

/** colorwayId (local) -> boxTypeId -> on-hand boxes, for one style. Summed across warehouses. */
export type StyleInventory = Record<string, Partial<Record<BoxTypeId, number>>>;

interface RawRow {
  colorway_id: string;
  box_type_id: BoxTypeId;
  on_hand: number;
}

function toStyleInventory(styleId: string, rows: RawRow[]): StyleInventory {
  const map: StyleInventory = {};
  for (const row of rows) {
    const colorwayId = fromDbId(styleId, row.colorway_id);
    map[colorwayId] = map[colorwayId] || {};
    map[colorwayId][row.box_type_id] = (map[colorwayId][row.box_type_id] ?? 0) + row.on_hand;
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

  const byStyle = new Map<string, RawRow[]>();
  for (const row of data ?? []) {
    if (!byStyle.has(row.style_id)) byStyle.set(row.style_id, []);
    byStyle.get(row.style_id)!.push(row);
  }

  const result: Record<string, StyleInventory> = {};
  for (const styleId of styleIds) result[styleId] = toStyleInventory(styleId, byStyle.get(styleId) ?? []);
  return result;
}

/** Total on-hand + reserved across every warehouse, for the admin products table. */
export async function getInventoryTotalsForStyles(
  styleIds: string[],
): Promise<Record<string, { onHand: number; reserved: number }>> {
  if (styleIds.length === 0) return {};
  const { data, error } = await supabaseAdmin.from("inventory").select("style_id, on_hand, reserved").in("style_id", styleIds);
  if (error) {
    console.warn(`inventory totals query failed: ${error.message}`);
    return {};
  }
  const totals: Record<string, { onHand: number; reserved: number }> = {};
  for (const row of data ?? []) {
    const t = totals[row.style_id] || { onHand: 0, reserved: 0 };
    t.onHand += row.on_hand;
    t.reserved += (row as { reserved?: number }).reserved ?? 0;
    totals[row.style_id] = t;
  }
  return totals;
}

/** Per-warehouse on-hand/reserved breakdown for one style — used by the editor's Inventory tab. */
export interface WarehouseStockRow {
  colorwayId: string;
  boxTypeId: BoxTypeId;
  warehouseId: string;
  onHand: number;
  reserved: number;
}

export async function getWarehouseBreakdownForStyle(styleId: string): Promise<WarehouseStockRow[]> {
  const { data, error } = await supabaseAdmin
    .from("inventory")
    .select("colorway_id, box_type_id, warehouse_id, on_hand, reserved")
    .eq("style_id", styleId);
  if (error) {
    console.warn(`inventory query failed: ${error.message}`);
    return [];
  }
  return (data ?? []).map((row) => ({
    colorwayId: fromDbId(styleId, row.colorway_id),
    boxTypeId: row.box_type_id,
    warehouseId: (row as { warehouse_id?: string }).warehouse_id ?? "main",
    onHand: row.on_hand,
    reserved: (row as { reserved?: number }).reserved ?? 0,
  }));
}

export async function setInventoryLevel(
  styleId: string,
  colorwayLocalId: string,
  boxTypeId: BoxTypeId,
  onHand: number,
  warehouseId = "main",
  actorAccountId: string | null = null,
): Promise<void> {
  const colorwayDbId = toDbId(styleId, colorwayLocalId);
  const { data: existing } = await supabaseAdmin
    .from("inventory")
    .select("on_hand")
    .eq("style_id", styleId)
    .eq("colorway_id", colorwayDbId)
    .eq("box_type_id", boxTypeId)
    .eq("warehouse_id", warehouseId)
    .maybeSingle();
  const previous = existing?.on_hand ?? 0;
  const nextOnHand = Math.max(0, onHand);

  const { error } = await supabaseAdmin.from("inventory").upsert(
    { style_id: styleId, colorway_id: colorwayDbId, box_type_id: boxTypeId, warehouse_id: warehouseId, on_hand: nextOnHand },
    { onConflict: "style_id,colorway_id,box_type_id,warehouse_id" },
  );
  if (error) throw new Error(`inventory: ${error.message}`);

  if (nextOnHand !== previous) {
    await logInventoryMovement(styleId, colorwayDbId, boxTypeId, warehouseId, nextOnHand - previous, "manual_adjustment", actorAccountId);
  }
}

export async function setReservedStock(
  styleId: string,
  colorwayLocalId: string,
  boxTypeId: BoxTypeId,
  reserved: number,
  warehouseId = "main",
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("inventory")
    .update({ reserved: Math.max(0, reserved) })
    .eq("style_id", styleId)
    .eq("colorway_id", toDbId(styleId, colorwayLocalId))
    .eq("box_type_id", boxTypeId)
    .eq("warehouse_id", warehouseId);
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
      p_warehouse_id: "main",
    });
    if (error) throw new Error(`adjust_inventory: ${error.message}`);
    if (!data) {
      for (const done of succeeded) {
        await supabaseAdmin.rpc("adjust_inventory", {
          p_style_id: done.styleId,
          p_colorway_id: toDbId(done.styleId, done.colorwayId),
          p_box_type_id: done.boxTypeId,
          p_qty: -done.qty,
          p_warehouse_id: "main",
        });
        await logInventoryMovement(done.styleId, toDbId(done.styleId, done.colorwayId), done.boxTypeId, "main", done.qty, "order_rollback", null);
      }
      return { ok: false, failedLine: line };
    }
    await logInventoryMovement(line.styleId, toDbId(line.styleId, line.colorwayId), line.boxTypeId, "main", -line.qty, "order_placed", null);
    succeeded.push(line);
  }
  return { ok: true };
}
