import "server-only";
import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

const RESET_TOKEN_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export async function createPasswordResetToken(accountId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_MAX_AGE_MS).toISOString();
  const { error } = await supabaseAdmin
    .from("password_reset_tokens")
    .insert({ token, account_id: accountId, expires_at: expiresAt });
  if (error) throw new Error(`password_reset_tokens: ${error.message}`);
  return token;
}

export async function getValidPasswordResetAccountId(token: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("password_reset_tokens")
    .select("account_id, expires_at, used_at")
    .eq("token", token)
    .limit(1);
  if (error) throw new Error(`password_reset_tokens: ${error.message}`);
  const row = data?.[0];
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) return null;
  return row.account_id;
}

export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token);
  if (error) throw new Error(`password_reset_tokens: ${error.message}`);
}
