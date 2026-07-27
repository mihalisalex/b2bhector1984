"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function CartBadge() {
  const { itemCount } = useCart();
  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-2 border border-ink px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-white"
    >
      Cart
      <span className="font-mono-tab min-w-[1.25rem] text-center">{itemCount}</span>
    </Link>
  );
}
