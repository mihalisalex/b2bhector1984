import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { logout } from "@/lib/actions";
import { AdminShell, type AdminNavSection } from "@/components/admin/AdminShell";
import { bodySansGreek, displaySerifGreek, mono } from "@/lib/fonts";
import "@/app/globals.css";

const NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "Καθημερινά",
    items: [
      { href: "/admin", label: "Παραγγελίες" },
      { href: "/admin/applications", label: "Αιτήσεις" },
      { href: "/admin/products", label: "Προϊόντα" },
      { href: "/admin/seasons", label: "Σεζόν" },
      { href: "/admin/accounts", label: "Πελάτες" },
      { href: "/admin/invite", label: "Πρόσκληση καταστήματος" },
      { href: "/admin/buyer-emails", label: "Emails πελατών" },
      { href: "/admin/proforma", label: "Προτιμολόγιο" },
      { href: "/admin/catalogue", label: "Κατάλογος PDF" },
    ],
  },
  {
    title: "Περισσότερα",
    collapsible: true,
    items: [
      { href: "/admin/content", label: "Περιεχόμενο" },
      { href: "/admin/journal", label: "Άρθρα" },
      { href: "/admin/seo", label: "SEO" },
      { href: "/admin/analytics", label: "Στατιστικά" },
      { href: "/admin/sales-reps", label: "Εκπρόσωποι" },
      { href: "/admin/suppliers", label: "Προμηθευτές" },
      { href: "/admin/audit-log", label: "Ιστορικό ενεργειών" },
      { href: "/admin/permissions", label: "Δικαιώματα" },
    ],
  },
];

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") redirect("/login");

  // Its own root layout (see the "multiple root layouts" note on src/app/[lang]/layout.tsx) —
  // admin never shared the storefront's fonts/body shell with a single top-level layout.tsx,
  // so this now owns <html>/<body> directly. In Greek for the owner, so it uses the Greek type
  // pair: the Latin one has no real Greek letters (see src/lib/fonts.ts).
  return (
    <html
      lang="el"
      className={`${displaySerifGreek.variable} ${bodySansGreek.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-stone-50 text-ink">
        <AdminShell navSections={NAV_SECTIONS} logoutAction={logout}>
          {children}
        </AdminShell>
      </body>
    </html>
  );
}
