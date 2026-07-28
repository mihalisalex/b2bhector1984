import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fromDbId } from "@/lib/data/dbIds";
import type { InventoryMovement } from "@/lib/types";

interface MovementRow {
  id: string;
  style_id: string;
  colorway_id: string;
  box_type_id: InventoryMovement["boxTypeId"];
  warehouse_id: string;
  qty_delta: number;
  reason: string;
  actor_account_id: string | null;
  created_at: string;
}

function mapMovement(styleId: string, row: MovementRow): InventoryMovement {
  return {
    id: row.id,
    colorwayId: fromDbId(styleId, row.colorway_id),
    boxTypeId: row.box_type_id,
    warehouseId: row.warehouse_id,
    qtyDelta: row.qty_delta,
    reason: row.reason,
    actorAccountId: row.actor_account_id,
    createdAt: row.created_at,
  };
}

export async function logInventoryMovement(
  styleId: string,
  colorwayDbId: string,
  boxTypeId: string,
  warehouseId: string,
  qtyDelta: number,
  reason: string,
  actorAccountId: string | null,
): Promise<void> {
  const { error } = await supabaseAdmin.from("inventory_movements").insert({
    style_id: styleId,
    colorway_id: colorwayDbId,
    box_type_id: boxTypeId,
    warehouse_id: warehouseId,
    qty_delta: qtyDelta,
    reason,
    actor_account_id: actorAccountId,
  });
  if (error) console.error(`inventory_movements insert failed: ${error.message}`);
}

/** Falls back to an empty list rather than throwing if migration 0014 hasn't run yet. */
export async function listMovementsForStyle(styleId: string, limit = 100): Promise<InventoryMovement[]> {
  const { data, error } = await supabaseAdmin
    .from("inventory_movements")
    .select("*")
    .eq("style_id", styleId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn(`inventory_movements query failed (has migration 0014 been run?): ${error.message}`);
    return [];
  }
  return (data ?? []).map((row) => mapMovement(styleId, row));
}
