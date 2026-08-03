import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { logout } from "@/lib/actions";
import { AdminShell, type AdminNavSection } from "@/components/admin/AdminShell";

const NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "Sales",
    items: [
      { href: "/admin", label: "Orders" },
      { href: "/admin/applications", label: "Applications" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/seasons", label: "Seasons" },
      { href: "/admin/suppliers", label: "Suppliers" },
    ],
  },
  {
    title: "Customers",
    items: [
      { href: "/admin/accounts", label: "Accounts" },
      { href: "/admin/sales-reps", label: "Sales Reps" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/content", label: "Content" },
      { href: "/admin/journal", label: "Journal" },
      { href: "/admin/seo", label: "SEO" },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/admin/analytics", label: "Analytics" },
      { href: "/admin/audit-log", label: "Audit Log" },
    ],
  },
  {
    title: "Settings",
    items: [{ href: "/admin/permissions", label: "Permissions" }],
  },
];

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") redirect("/login");

  return (
    <AdminShell navSections={NAV_SECTIONS} logoutAction={logout}>
      {children}
    </AdminShell>
  );
}
