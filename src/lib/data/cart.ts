import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { BoxTypeId } from "@/lib/types";

export interface StoredCartLine {
  styleId: string;
  colorwayId: string;
  boxTypeId: BoxTypeId;
  qty: number;
}

interface CartLineRow {
  style_id: string;
  colorway_id: string;
  box_type_id: string;
  qty: number;
}

/**
 * Pre-migration tolerance, the same pattern the rest of this codebase uses: until 0036 is run
 * the table doesn't exist, and a buyer's cart should quietly fall back to localStorage-only
 * rather than the whole shop throwing. Every function here degrades to "no server cart".
 */
function isMissingTable(message: string): boolean {
  return message.includes("schema cache") || message.includes("does not exist") || message.includes("Could not find");
}

export async function getCart(accountId: string): Promise<StoredCartLine[]> {
  const { data, error } = await supabaseAdmin
    .from("cart_lines")
    .select("style_id, colorway_id, box_type_id, qty")
    .eq("account_id", accountId);
  if (error) {
    if (isMissingTable(error.message)) return [];
    throw new Error(`cart_lines: ${error.message}`);
  }
  return ((data ?? []) as CartLineRow[]).map((row) => ({
    styleId: row.style_id,
    colorwayId: row.colorway_id,
    boxTypeId: row.box_type_id as BoxTypeId,
    qty: row.qty,
  }));
}

/**
 * Replaces the account's stored cart with exactly `lines`.
 *
 * Delete-then-insert rather than upsert, because the cart is a set and a line the client no
 * longer has must disappear. An upsert would leave removed lines behind forever, which is the
 * one failure mode a buyer would notice immediately — deleting a box on their laptop and
 * finding it back on their phone.
 *
 * Not a transaction: Supabase's REST client has no multi-statement transaction, so the worst
 * case is a delete that lands and an insert that fails, leaving an empty server cart. The
 * client still holds the full cart in localStorage and rewrites it on the next change, so
 * that window self-heals rather than losing the buyer's work.
 */
export async function saveCart(accountId: string, lines: StoredCartLine[]): Promise<void> {
  const { error: deleteError } = await supabaseAdmin.from("cart_lines").delete().eq("account_id", accountId);
  if (deleteError) {
    if (isMissingTable(deleteError.message)) return;
    throw new Error(`cart_lines: ${deleteError.message}`);
  }

  const rows = lines
    .filter((line) => line.qty > 0)
    .map((line) => ({
      account_id: accountId,
      style_id: line.styleId,
      colorway_id: line.colorwayId,
      box_type_id: line.boxTypeId,
      qty: line.qty,
      updated_at: new Date().toISOString(),
    }));
  if (rows.length === 0) return;

  const { error: insertError } = await supabaseAdmin.from("cart_lines").insert(rows);
  if (insertError) {
    if (isMissingTable(insertError.message)) return;
    throw new Error(`cart_lines: ${insertError.message}`);
  }
}
