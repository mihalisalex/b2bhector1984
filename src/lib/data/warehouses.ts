import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import type { Warehouse } from "@/lib/types";

interface WarehouseRow {
  id: string;
  name: string;
  location: string | null;
  is_default: boolean;
}

function mapWarehouse(row: WarehouseRow): Warehouse {
  return { id: row.id, name: row.name, location: row.location ?? undefined, isDefault: row.is_default };
}

/** Falls back to a single "Main Warehouse" if migration 0014 hasn't run yet. */
export async function getAllWarehouses(): Promise<Warehouse[]> {
  const { data, error } = await supabaseAdmin.from("warehouses").select("*").order("name");
  if (error) {
    console.warn(`warehouses query failed (has migration 0014 been run?): ${error.message}`);
    return [{ id: "main", name: "Main Warehouse", isDefault: true }];
  }
  return (data ?? []).map(mapWarehouse);
}

export async function createWarehouse(name: string, location?: string): Promise<Warehouse> {
  const id = slugify(name);
  const { data, error } = await supabaseAdmin
    .from("warehouses")
    .insert({ id, name, location: location ?? null, is_default: false })
    .select()
    .single();
  if (error) throw new Error(`warehouses: ${error.message}`);
  return mapWarehouse(data);
}
