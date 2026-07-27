import { cookies } from "next/headers";
import { getAccountById } from "@/lib/data/accounts";
import { getApplicationById } from "@/lib/data/applications";
import type { Account, Application } from "@/lib/types";

export const SESSION_COOKIE = "hector_session";
export const APPLICATION_COOKIE = "hector_application";

/**
 * Server Actions and Server Components run in separate module "layers" in
 * Next.js — a plain in-memory module singleton written in an action is not
 * reliably visible when a page re-renders. The session cookie stores only an
 * id (account id / application id); the record itself is always read fresh
 * from Supabase, so an admin updating an application's status is visible on
 * the applicant's next render without any extra plumbing.
 */

export async function getSessionAccountId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
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
