import { cookies } from "next/headers";
import { ACCOUNTS } from "@/lib/data/accounts";
import type { Account, Application } from "@/lib/types";

export const SESSION_COOKIE = "hector_session";
export const APPLICATION_COOKIE = "hector_application";
export const PROVISIONED_ACCOUNT_COOKIE = "hector_provisioned_account";

/**
 * Server Actions and Server Components run in separate module "layers" in
 * Next.js — a plain in-memory module singleton written in an action is not
 * reliably visible when a page re-renders. Anything created at runtime
 * (a freshly activated wholesale account, an order placed at checkout)
 * is round-tripped through cookies instead, so it stays consistent no
 * matter which layer reads it.
 */

export async function getSessionAccountId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function getProvisionedAccount(): Promise<Account | null> {
  const store = await cookies();
  const raw = store.get(PROVISIONED_ACCOUNT_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Account;
  } catch {
    return null;
  }
}

export async function getCurrentAccount(): Promise<Account | null> {
  const id = await getSessionAccountId();
  if (!id) return null;
  const staticMatch = ACCOUNTS.find((a) => a.id === id);
  if (staticMatch) return staticMatch;
  const provisioned = await getProvisionedAccount();
  return provisioned && provisioned.id === id ? provisioned : null;
}

export async function findAccountByEmailAnywhere(email: string): Promise<Account | null> {
  const staticMatch = ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (staticMatch) return staticMatch;
  const provisioned = await getProvisionedAccount();
  if (provisioned && provisioned.email.toLowerCase() === email.toLowerCase()) return provisioned;
  return null;
}

export async function getApplication(): Promise<Application | null> {
  const store = await cookies();
  const raw = store.get(APPLICATION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Application;
  } catch {
    return null;
  }
}
