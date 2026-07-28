"use client";

import { setPermissionAction } from "@/lib/productActions";
import type { AdminRole, ProductPermissionKey } from "@/lib/types";

export function PermissionToggle({ role, permissionKey, allowed }: { role: AdminRole; permissionKey: ProductPermissionKey; allowed: boolean }) {
  const action = setPermissionAction.bind(null, role, permissionKey);
  const disabled = role === "super_admin";

  return (
    <form action={action}>
      <input type="hidden" name="allowed" value={String(!allowed)} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={`${allowed ? "Revoke" : "Grant"} ${permissionKey} for ${role}`}
        className={`h-6 w-11 rounded-full border transition-colors ${
          allowed ? "border-ink bg-ink" : "border-stone-300 bg-stone-200"
        } disabled:opacity-60`}
      >
        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${allowed ? "translate-x-5" : "translate-x-1"}`} />
      </button>
    </form>
  );
}
