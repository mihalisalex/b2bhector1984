import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { logout } from "@/lib/actions";
import { AdminShell } from "@/components/admin/AdminShell";

const NAV = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/sales-reps", label: "Sales Reps" },
  { href: "/admin/suppliers", label: "Suppliers" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/audit-log", label: "Audit Log" },
  { href: "/admin/permissions", label: "Permissions" },
];

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") redirect("/login");

  return (
    <AdminShell navItems={NAV} logoutAction={logout}>
      {children}
    </AdminShell>
  );
}
