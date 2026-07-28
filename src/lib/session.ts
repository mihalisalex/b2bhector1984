import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAccountById } from "@/lib/data/accounts";
import { getApplicationById } from "@/lib/data/applications";
import type { Account, Application } from "@/lib/types";

export const SESSION_COOKIE = "hector_session";
export const APPLICATION_COOKIE = "hector_application";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

/**
 * Sessions are a random opaque token in a DB-backed `sessions` table, not the
 * account id itself — the old cookie was just `account.id` with no signature,
 * so setting a guessed/known id as the cookie value granted that account's
 * session outright. `createSession`/`destroySession` are called from Server
 * Actions (login/logout/activateAccount); `getSessionAccountId` is read on
 * every subsequent request and re-validates the token's expiry against the DB
 * each time (Server Components/Actions run in separate module "layers" in
 * Next.js, so nothing about session state can be cached in memory).
 */

export async function createSession(accountId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
  const { error } = await supabaseAdmin.from("sessions").insert({ token, account_id: accountId, expires_at: expiresAt });
  if (error) throw new Error(`sessions: ${error.message}`);
  return token;
}

export async function destroySession(token: string): Promise<void> {
  const { error } = await supabaseAdmin.from("sessions").delete().eq("token", token);
  if (error) throw new Error(`sessions: ${error.message}`);
}

export async function getSessionAccountId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("account_id, expires_at")
    .eq("token", token)
    .limit(1);
  if (error) throw new Error(`sessions: ${error.message}`);
  const row = data?.[0];
  if (!row || new Date(row.expires_at) < new Date()) return null;
  return row.account_id;
}

export async function getCurrentAccount(): Promise<Account | null> {
  const id = await getSessionAccountId();
  if (!id) return null;
  return (await getAccountById(id)) ?? null;
}

export async function getApplication(): Promise<Application | null> {
  const store = await cookies();
  const id = store.get(APPLICATION_COOKIE)?.value;
  if (!id) return null;
  return (await getApplicationById(id)) ?? null;
}
