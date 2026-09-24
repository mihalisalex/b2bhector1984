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

/**
 * Validates AND spends a reset token in one conditional UPDATE, returning the account it
 * belongs to — or null if it was unknown, expired, or already used.
 *
 * This used to be a read ("is it valid?") followed later by a separate "mark used" write.
 * Two submissions of the same link could both pass the read before either wrote, so both
 * reset the password and whichever landed last won — someone holding an intercepted link
 * could race the real owner. Filtering on `used_at is null` inside the UPDATE lets exactly
 * one caller claim the token.
 *
 * On success every other outstanding reset link for the account is spent too: after a
 * reset, an older link sitting in the inbox must not be able to reset it again.
 */
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("password_reset_tokens")
    .update({ used_at: now })
    .eq("token", token)
    .is("used_at", null)
    .gt("expires_at", now)
    .select("account_id");
  if (error) throw new Error(`password_reset_tokens: ${error.message}`);
  const accountId = data?.[0]?.account_id as string | undefined;
  if (!accountId) return null;

  const { error: revokeError } = await supabaseAdmin
    .from("password_reset_tokens")
    .update({ used_at: now })
    .eq("account_id", accountId)
    .is("used_at", null);
  if (revokeError) throw new Error(`password_reset_tokens: ${revokeError.message}`);
  return accountId;
}
