import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Supplier } from "@/lib/types";

interface SupplierRow {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  lead_time_days: number | null;
}

function mapSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    leadTimeDays: row.lead_time_days ?? undefined,
  };
}

export async function getAllSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabaseAdmin.from("suppliers").select("*").order("name");
  if (error) {
    console.warn(`suppliers query failed (has migration 0013 been run?): ${error.message}`);
    return [];
  }
  return (data ?? []).map(mapSupplier);
}

export interface SupplierInput {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  leadTimeDays?: number;
}

export async function createSupplier(input: SupplierInput): Promise<Supplier> {
  const { data, error } = await supabaseAdmin
    .from("suppliers")
    .insert({
      name: input.name,
      contact_name: input.contactName ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      lead_time_days: input.leadTimeDays ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(`suppliers: ${error.message}`);
  return mapSupplier(data);
}

export async function updateSupplier(id: string, input: SupplierInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from("suppliers")
    .update({
      name: input.name,
      contact_name: input.contactName ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      lead_time_days: input.leadTimeDays ?? null,
    })
    .eq("id", id);
  if (error) throw new Error(`suppliers: ${error.message}`);
}

export async function deleteSupplier(id: string): Promise<{ error?: string }> {
  const { count } = await supabaseAdmin.from("styles").select("id", { count: "exact", head: true }).eq("supplier_id", id);
  if (count && count > 0) return { error: `${count} product(s) still use this supplier — reassign them first.` };
  const { error } = await supabaseAdmin.from("suppliers").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}
