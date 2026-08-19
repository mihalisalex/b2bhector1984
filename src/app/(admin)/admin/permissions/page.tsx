import { getPermissionMatrix, ADMIN_ROLES, ADMIN_ROLE_LABEL, PRODUCT_PERMISSION_KEYS, PRODUCT_PERMISSION_LABEL } from "@/lib/data/permissions";
import { getAdminAccounts, countSuperAdmins } from "@/lib/data/accounts";
import { getCurrentAccount } from "@/lib/session";
import { PermissionToggle } from "@/components/admin/products/PermissionToggle";
import { AdminRoleSelect } from "@/components/admin/products/AdminRoleSelect";

export const metadata = { title: "Permissions", robots: { index: false, follow: false } };

export default async function AdminPermissionsPage() {
  const [matrix, staff, superAdminCount, me] = await Promise.all([
    getPermissionMatrix(),
    getAdminAccounts(),
    countSuperAdmins(),
    getCurrentAccount(),
  ]);
  const roleOptions = ADMIN_ROLES.map((role) => ({ value: role, label: ADMIN_ROLE_LABEL[role] }));

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Permissions
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Role-based access control for the Products module. Super Admin always has every permission (can&rsquo;t be
        revoked, so nobody can lock themselves out).
      </p>

      {/* This list is the half that was missing. The matrix below has always been editable,
          but nothing anywhere wrote `accounts.admin_role`, so every staff account fell back
          to Super Admin and held every permission no matter what the toggles said. The copy
          here used to send you to "the account's admin record" — a screen that did not exist. */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Staff accounts</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          The role assigned here decides which of the permissions below each person actually has.
        </p>
        <div className="mt-3 border border-stone-300 bg-white">
          {staff.map((account, index) => {
            const isSelf = me?.id === account.id;
            const isLastSuperAdmin = account.adminRole === "super_admin" && superAdminCount <= 1;
            const disabledReason = isSelf
              ? "You can't change your own role — you'd lose access to this screen."
              : isLastSuperAdmin
                ? "The last Super Admin can't be demoted — nobody would be left who could grant the role back."
                : undefined;

            return (
              <div
                key={account.id}
                className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${index > 0 ? "border-t border-stone-200" : ""}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {account.contactName || account.businessName}
                    {isSelf && <span className="ml-2 text-[11px] font-normal uppercase tracking-wide text-ink-soft">You</span>}
                  </p>
                  <p className="text-xs text-ink-soft">{account.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {disabledReason && <span className="max-w-xs text-right text-[11px] text-ink-soft">{disabledReason}</span>}
                  <AdminRoleSelect
                    accountId={account.id}
                    currentRole={account.adminRole ?? "super_admin"}
                    roles={roleOptions}
                    disabledReason={disabledReason}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-wide text-ink-soft">Permission matrix</h2>
      <div className="scroll-thin mt-3 overflow-x-auto border border-stone-300 bg-white">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-2.5">Permission</th>
              {ADMIN_ROLES.map((role) => (
                <th key={role} className="px-3 py-2.5 text-center">{ADMIN_ROLE_LABEL[role]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRODUCT_PERMISSION_KEYS.map((key) => (
              <tr key={key} className="border-b border-stone-200 last:border-b-0">
                <td className="px-4 py-2.5 text-ink">{PRODUCT_PERMISSION_LABEL[key]}</td>
                {ADMIN_ROLES.map((role) => (
                  <td key={role} className="px-3 py-2.5 text-center">
                    <PermissionToggle role={role} permissionKey={key} allowed={role === "super_admin" ? true : (matrix[role]?.[key] ?? false)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
