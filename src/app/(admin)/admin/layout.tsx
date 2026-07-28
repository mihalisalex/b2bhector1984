import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { logout } from "@/lib/actions";

const NAV = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/styles", label: "Styles" },
  { href: "/admin/content", label: "Content" },
];

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="border-b border-stone-300 bg-ink text-stone-200">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-6 lg:px-10">
          <div className="flex items-center gap-8">
            <span className="font-display text-sm font-bold uppercase tracking-tight text-white">
              Hector 1984 — Admin
            </span>
            <nav className="flex items-center gap-5" aria-label="Admin">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-xs font-medium uppercase tracking-wide text-stone-300/80 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <form action={logout}>
            <button type="submit" className="text-xs font-medium uppercase tracking-wide text-stone-300/80 hover:text-white">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
