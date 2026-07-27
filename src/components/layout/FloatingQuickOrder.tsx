"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloatingQuickOrder() {
  const pathname = usePathname();
  if (pathname?.startsWith("/quick-order")) return null;

  return (
    <Link
      href="/quick-order"
      className="fixed bottom-5 right-5 z-30 flex items-center gap-2 bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_10px_30px_rgba(26,29,34,0.35)] transition-transform hover:-translate-y-0.5 hover:bg-ink/90 print:hidden"
    >
      Quick Order
    </Link>
  );
}
