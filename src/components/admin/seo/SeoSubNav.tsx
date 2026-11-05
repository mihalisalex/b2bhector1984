"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin/seo", label: "Επισκόπηση" },
  { href: "/admin/seo/settings", label: "Γενικές ρυθμίσεις" },
  { href: "/admin/seo/pages", label: "Σελίδες και κατηγορίες" },
  { href: "/admin/seo/redirects", label: "Ανακατευθύνσεις" },
  { href: "/admin/seo/bulk", label: "Μαζικά εργαλεία" },
];

export function SeoSubNav() {
  const pathname = usePathname();
  return (
    <nav className="scroll-thin -mb-px flex gap-1 overflow-x-auto border-b border-stone-300" aria-label="Ενότητες SEO">
      {TABS.map((tab) => {
        // "/admin/seo" is a prefix of every other tab, so it only lights up on
        // an exact match.
        const active = tab.href === "/admin/seo" ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors",
              active
                ? "border-ink text-ink"
                : "border-transparent text-ink-soft hover:border-stone-300 hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
