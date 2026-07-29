import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import type { Brand } from "@/lib/types";

interface BrandRow {
  id: string;
  name: string;
}

function mapBrand(row: BrandRow): Brand {
  return { id: row.id, name: row.name };
}

/** Falls back to a single "Hector 1984" placeholder if migration 0013 hasn't run yet. */
export async function getAllBrands(): Promise<Brand[]> {
  const { data, error } = await supabaseAdmin.from("brands").select("*").order("name");
  if (error) {
    console.warn(`brands query failed (has migration 0013 been run?): ${error.message}`);
    return [{ id: "hector-1984", name: "Hector 1984" }];
  }
  return (data ?? []).map(mapBrand);
}

export async function createBrand(name: string): Promise<Brand> {
  const id = slugify(name);
  const { data, error } = await supabaseAdmin.from("brands").insert({ id, name }).select().single();
  if (error) throw new Error(`brands: ${error.message}`);
  return mapBrand(data);
}
