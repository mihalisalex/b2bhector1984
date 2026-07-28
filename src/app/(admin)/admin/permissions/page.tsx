import { getPermissionMatrix, ADMIN_ROLES, ADMIN_ROLE_LABEL, PRODUCT_PERMISSION_KEYS, PRODUCT_PERMISSION_LABEL } from "@/lib/data/permissions";
import { PermissionToggle } from "@/components/admin/products/PermissionToggle";

export const metadata = { title: "Permissions", robots: { index: false, follow: false } };

export default async function AdminPermissionsPage() {
  const matrix = await getPermissionMatrix();

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Permissions
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Role-based access control for the Products module. Super Admin always has every permission (can&rsquo;t be
        revoked, so nobody can lock themselves out). Assign a role to a staff account from the account&rsquo;s admin
        record.
      </p>

      <div className="scroll-thin mt-6 overflow-x-auto border border-stone-300 bg-white">
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
