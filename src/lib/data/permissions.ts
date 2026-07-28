import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { AdminRole, ProductPermissionKey } from "@/lib/types";

export const ADMIN_ROLES: AdminRole[] = [
  "super_admin",
  "admin",
  "inventory_manager",
  "sales_manager",
  "marketing",
  "content_editor",
];

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  inventory_manager: "Inventory Manager",
  sales_manager: "Sales Manager",
  marketing: "Marketing",
  content_editor: "Content Editor",
};

export const PRODUCT_PERMISSION_KEYS: ProductPermissionKey[] = [
  "products.view",
  "products.create",
  "products.edit",
  "products.delete",
  "products.pricing",
  "products.inventory",
  "products.seo",
  "products.bulk",
  "products.import_export",
  "products.permissions",
];

export const PRODUCT_PERMISSION_LABEL: Record<ProductPermissionKey, string> = {
  "products.view": "View products",
  "products.create": "Create products",
  "products.edit": "Edit product details",
  "products.delete": "Archive / delete products",
  "products.pricing": "Edit pricing",
  "products.inventory": "Edit inventory",
  "products.seo": "Edit SEO & content",
  "products.bulk": "Bulk actions",
  "products.import_export": "Import / export",
  "products.permissions": "Manage role permissions",
};

/** role -> permission_key -> allowed. Fails open to "super_admin can do everything,
 * nobody else can do anything" if migration 0015 hasn't run yet. */
export async function getPermissionMatrix(): Promise<Record<string, Partial<Record<ProductPermissionKey, boolean>>>> {
  const { data, error } = await supabaseAdmin.from("role_permissions").select("*");
  if (error) {
    console.warn(`role_permissions query failed (has migration 0015 been run?): ${error.message}`);
    const fallback: Record<string, Partial<Record<ProductPermissionKey, boolean>>> = { super_admin: {} };
    for (const key of PRODUCT_PERMISSION_KEYS) fallback.super_admin[key] = true;
    return fallback;
  }
  const matrix: Record<string, Partial<Record<ProductPermissionKey, boolean>>> = {};
  for (const row of data ?? []) {
    matrix[row.role] = matrix[row.role] || {};
    matrix[row.role][row.permission_key as ProductPermissionKey] = row.allowed;
  }
  return matrix;
}

export async function setPermission(role: AdminRole, permissionKey: ProductPermissionKey, allowed: boolean): Promise<void> {
  const { error } = await supabaseAdmin
    .from("role_permissions")
    .upsert({ role, permission_key: permissionKey, allowed }, { onConflict: "role,permission_key" });
  if (error) throw new Error(`role_permissions: ${error.message}`);
}

/**
 * `super_admin` (and any account with no adminRole set — e.g. before migration
 * 0015 backfills it) is always allowed, so an existing admin can never be
 * accidentally locked out of their own dashboard.
 */
export async function hasPermission(adminRole: AdminRole | undefined, key: ProductPermissionKey): Promise<boolean> {
  if (!adminRole || adminRole === "super_admin") return true;
  const matrix = await getPermissionMatrix();
  return matrix[adminRole]?.[key] ?? false;
}
