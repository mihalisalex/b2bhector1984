import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * The shared `SalesRep` type (src/lib/types.ts) has no `id` — `mapAccount`
 * deliberately strips it when building an account's embedded rep. Admin CRUD
 * needs the id, so this is a distinct type rather than extending the shared
 * one (avoids touching every place `Account.rep` is consumed).
 */
export interface AdminSalesRep {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  initials: string;
  territory: string;
}

interface SalesRepRow {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  initials: string;
  territory: string;
}

function mapRep(row: SalesRepRow): AdminSalesRep {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    email: row.email,
    phone: row.phone,
    initials: row.initials,
    territory: row.territory,
  };
}

export async function getAllSalesReps(): Promise<AdminSalesRep[]> {
  const { data, error } = await supabaseAdmin.from("sales_reps").select("*").order("name");
  if (error) throw new Error(`sales_reps: ${error.message}`);
  return (data ?? []).map(mapRep);
}

export async function createSalesRep(input: {
  name: string;
  title: string;
  email: string;
  phone: string;
  initials: string;
  territory: string;
}): Promise<AdminSalesRep> {
  const { data, error } = await supabaseAdmin.from("sales_reps").insert(input).select("*").limit(1);
  if (error) throw new Error(`sales_reps: ${error.message}`);
  return mapRep((data ?? [])[0] as SalesRepRow);
}

export async function updateSalesRep(
  id: string,
  input: { name: string; title: string; email: string; phone: string; initials: string; territory: string },
): Promise<void> {
  const { error } = await supabaseAdmin.from("sales_reps").update(input).eq("id", id);
  if (error) throw new Error(`sales_reps: ${error.message}`);
}

/** Blocked (returns an error, doesn't throw) if any account still references this rep. */
export async function deleteSalesRep(id: string): Promise<{ error?: string }> {
  const { count, error: countError } = await supabaseAdmin
    .from("accounts")
    .select("id", { count: "exact", head: true })
    .eq("rep_id", id);
  if (countError) throw new Error(`accounts: ${countError.message}`);
  if (count && count > 0) {
    return { error: `${count} account${count === 1 ? "" : "s"} still assigned to this rep — reassign them first.` };
  }

  const { error } = await supabaseAdmin.from("sales_reps").delete().eq("id", id);
  if (error) throw new Error(`sales_reps: ${error.message}`);
  return {};
}
