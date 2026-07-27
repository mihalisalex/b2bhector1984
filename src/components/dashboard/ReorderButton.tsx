"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { BoxTypeId, Order } from "@/lib/types";

export function ReorderButton({ order, className }: { order: Order; className?: string }) {
  const { addLines } = useCart();
  const router = useRouter();
  const [done, setDone] = useState(false);

  function handleReorder() {
    const byStyle = new Map<string, { colorwayId: string; boxTypeId: BoxTypeId; qty: number }[]>();
    for (const line of order.lines) {
      if (!byStyle.has(line.styleId)) byStyle.set(line.styleId, []);
      byStyle.get(line.styleId)!.push({ colorwayId: line.colorwayId, boxTypeId: line.boxTypeId, qty: line.qty });
    }
    for (const [styleId, entries] of byStyle.entries()) addLines(styleId, entries);
    setDone(true);
    setTimeout(() => router.push("/cart"), 350);
  }

  return (
    <button
      type="button"
      onClick={handleReorder}
      className={className ?? "text-xs font-semibold uppercase tracking-wide text-signal hover:underline"}
    >
      {done ? "Added — opening cart…" : "Reorder"}
    </button>
  );
}
