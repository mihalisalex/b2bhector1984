import "server-only";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { hasPermission } from "@/lib/data/permissions";
import type { ProductPermissionKey } from "@/lib/types";

/**
 * The one gate every admin Server Action goes through. It used to be copied into each
 * actions file, and only productActions went on to check the role's permissions — so the
 * matrix at /admin/permissions governed products while a Content Editor could still change
 * a buyer's price multiplier or credit terms through adminActions.ts. Keeping both halves
 * here means a new admin action gets the permission check by default.
 */
export async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") redirect("/login");
  return account;
}

export async function requirePermission(key: ProductPermissionKey) {
  const admin = await requireAdmin();
  const allowed = await hasPermission(admin.adminRole, key);
  if (!allowed) throw new Error(`Your role (${admin.adminRole ?? "admin"}) doesn't have the "${key}" permission.`);
  return admin;
}
