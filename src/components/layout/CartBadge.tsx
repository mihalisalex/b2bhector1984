"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { CartIcon } from "@/components/layout/icons";

export function CartBadge() {
  const { itemCount } = useCart();
  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${itemCount} pair${itemCount === 1 ? "" : "s"}`}
      className="relative flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-signal"
    >
      <CartIcon />
      {itemCount > 0 && (
        <span
          aria-hidden
          className="font-mono-tab absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-0.5 text-[10px] leading-none text-white"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
