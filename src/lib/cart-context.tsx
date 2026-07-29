"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCatalog } from "@/lib/catalog-context";
import { getBoxType } from "@/lib/data/boxTypes";
import { getUnitPrice } from "@/lib/pricing";
import type { BoxTypeId } from "@/lib/types";

export interface CartLine {
  styleId: string;
  colorwayId: string;
  boxTypeId: BoxTypeId;
  /** Number of boxes. */
  qty: number;
}

interface CartContextValue {
  lines: CartLine[];
  /** Total pairs across the cart (not box count). */
  itemCount: number;
  addLines: (styleId: string, incoming: { colorwayId: string; boxTypeId: BoxTypeId; qty: number }[]) => void;
  setLineQty: (styleId: string, colorwayId: string, boxTypeId: BoxTypeId, qty: number) => void;
  removeStyle: (styleId: string) => void;
  clearCart: () => void;
  styleSubtotal: (styleId: string) => number;
  cartTotal: number;
  priceMultiplier: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(accountId: string) {
  return `hector_cart_${accountId}`;
}

function pairsInLine(line: CartLine): number {
  return line.qty * getBoxType(line.boxTypeId).totalPairs;
}

export function CartProvider({
  accountId,
  priceMultiplier = 1,
  children,
}: {
  accountId: string;
  priceMultiplier?: number;
  children: ReactNode;
}) {
  const { getStyleById } = useCatalog();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // One-time sync from localStorage (an external system unavailable during SSR),
    // not a derived-state update — the documented exception to this rule.
    try {
      const raw = window.localStorage.getItem(storageKey(accountId));
      if (raw) {
        const parsed = JSON.parse(raw);
        // Defensive against an older cart shape lingering in localStorage
        // (pre box-ordering: lines keyed by size instead of boxTypeId).
        const valid = Array.isArray(parsed)
          ? parsed.filter(
              (l): l is CartLine =>
                l && typeof l.qty === "number" && ["box8", "box10", "box12"].includes(l.boxTypeId),
            )
          : [];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLines(valid);
      }
    } catch {
      // ignore malformed local storage
    }
    setHydrated(true);
  }, [accountId]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey(accountId), JSON.stringify(lines));
  }, [lines, accountId, hydrated]);

  const addLines: CartContextValue["addLines"] = useCallback((styleId, incoming) => {
    setLines((prev) => {
      const next = [...prev];
      for (const item of incoming) {
        const idx = next.findIndex(
          (l) => l.styleId === styleId && l.colorwayId === item.colorwayId && l.boxTypeId === item.boxTypeId,
        );
        if (item.qty <= 0) {
          if (idx >= 0) next.splice(idx, 1);
          continue;
        }
        if (idx >= 0) next[idx] = { ...next[idx], qty: item.qty };
        else next.push({ styleId, colorwayId: item.colorwayId, boxTypeId: item.boxTypeId, qty: item.qty });
      }
      return next;
    });
  }, []);

  const setLineQty: CartContextValue["setLineQty"] = useCallback((styleId, colorwayId, boxTypeId, qty) => {
    setLines((prev) => {
      if (qty <= 0) {
        return prev.filter(
          (l) => !(l.styleId === styleId && l.colorwayId === colorwayId && l.boxTypeId === boxTypeId),
        );
      }
      const idx = prev.findIndex(
        (l) => l.styleId === styleId && l.colorwayId === colorwayId && l.boxTypeId === boxTypeId,
      );
      if (idx < 0) return [...prev, { styleId, colorwayId, boxTypeId, qty }];
      const next = [...prev];
      next[idx] = { ...next[idx], qty };
      return next;
    });
  }, []);

  const removeStyle: CartContextValue["removeStyle"] = useCallback((styleId) => {
    setLines((prev) => prev.filter((l) => l.styleId !== styleId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + pairsInLine(l), 0), [lines]);

  const styleSubtotal = useCallback(
    (styleId: string) => {
      const style = getStyleById(styleId);
      if (!style) return 0;
      const styleLines = lines.filter((l) => l.styleId === styleId);
      const totalPairs = styleLines.reduce((sum, l) => sum + pairsInLine(l), 0);
      const unitPrice = getUnitPrice(style, "net60", priceMultiplier);
      return Math.round(unitPrice * totalPairs * 100) / 100;
    },
    [getStyleById, lines, priceMultiplier],
  );

  const cartTotal = useMemo(() => {
    const styleIds = Array.from(new Set(lines.map((l) => l.styleId)));
    return Math.round(styleIds.reduce((sum, id) => sum + styleSubtotal(id), 0) * 100) / 100;
  }, [lines, styleSubtotal]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount,
      addLines,
      setLineQty,
      removeStyle,
      clearCart,
      styleSubtotal,
      cartTotal,
      priceMultiplier,
    }),
    [lines, itemCount, addLines, setLineQty, removeStyle, clearCart, styleSubtotal, cartTotal, priceMultiplier],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
