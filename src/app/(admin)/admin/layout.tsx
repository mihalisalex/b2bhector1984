import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { logout } from "@/lib/actions";
import { AdminShell, type AdminNavSection } from "@/components/admin/AdminShell";
import { bodySans, displaySerif, mono } from "@/lib/fonts";
import "@/app/globals.css";

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

  // Its own root layout (see the "multiple root layouts" note on src/app/[lang]/layout.tsx) —
  // admin never shared the storefront's fonts/body shell with a single top-level layout.tsx,
  // so this now owns <html>/<body> directly. Always English; admin is an internal tool, not
  // part of this feature's translated surface.
  return (
    <html
      lang="en"
      className={`${displaySerif.variable} ${bodySans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-stone-50 text-ink">
        <AdminShell navSections={NAV_SECTIONS} logoutAction={logout}>
          {children}
        </AdminShell>
      </body>
    </html>
  );
}
