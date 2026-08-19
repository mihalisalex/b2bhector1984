"use client";

import { setAdminRoleAction } from "@/lib/productActions";
import type { AdminRole } from "@/lib/types";

/**
 * The control that assigns a role to a staff account.
 *
 * Submits on change, matching every other field on the admin's account screens. Disabled
 * for the two cases the server also refuses, so the UI never offers an action that would
 * silently do nothing:
 *
 *  - your own account, because demoting yourself removes the screen you would need to
 *    undo it;
 *  - the last remaining super_admin, because nobody would be left who could grant it back.
 *
 * The server enforces both regardless — this only avoids a control that looks live and
 * isn't.
 */
export function AdminRoleSelect({
  accountId,
  currentRole,
  roles,
  disabledReason,
}: {
  accountId: string;
  currentRole: AdminRole;
  /** Passed in rather than imported: the role labels live in `permissions.ts`, which is
   * `server-only`, and this is a client component. */
  roles: { value: AdminRole; label: string }[];
  disabledReason?: string;
}) {
  const action = setAdminRoleAction.bind(null, accountId);

  return (
    <form action={action}>
      <select
        name="adminRole"
        defaultValue={currentRole}
        disabled={Boolean(disabledReason)}
        title={disabledReason}
        aria-label="Role"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none focus-visible:border-signal disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-ink-soft"
      >
        {roles.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
    </form>
  );
}
