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
  /**
   * Lines whose style is no longer purchasable — archived, or deleted outright — so it's
   * gone from the storefront catalogue this provider resolves against. They're kept in
   * `lines` (never silently dropped: an archive can be reversed, and quietly deleting a
   * buyer's work is worse than showing it) but excluded from every total, and the cart
   * surfaces them separately so they can actually be removed.
   */
  unavailableLines: CartLine[];
  /** Total pairs across the cart, excluding unavailable lines. */
  itemCount: number;
  addLines: (styleId: string, incoming: { colorwayId: string; boxTypeId: BoxTypeId; qty: number }[]) => void;
  setLineQty: (styleId: string, colorwayId: string, boxTypeId: BoxTypeId, qty: number) => void;
  removeStyle: (styleId: string) => void;
  clearCart: () => void;
  styleSubtotal: (styleId: string) => number;
  /** VAT on one style's cart lines, using that style's own vatRate. 0 for a style with no rate set. */
  styleVat: (styleId: string) => number;
  /** Net (pre-VAT) total across the cart — unchanged meaning from before VAT existed. */
  cartTotal: number;
  /** VAT across the whole cart, per-style rate applied to that style's own subtotal. */
  cartVatTotal: number;
  /** What checkout will actually charge — cartTotal + cartVatTotal. */
  cartGrandTotal: number;
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
    // Sync from localStorage (an external system unavailable during SSR), not a
    // derived-state update — the documented exception to this rule. Re-runs when
    // `accountId` changes, which is why the empty case below must still reset:
    // these layouts keep this provider mounted across soft navigations, so signing
    // in as a different account can swap `accountId` in place. Leaving `lines`
    // untouched when the new account has no saved cart would let the previous
    // account's cart fall through and then get persisted under the new key.
    let restored: CartLine[] = [];
    try {
      const raw = window.localStorage.getItem(storageKey(accountId));
      if (raw) {
        const parsed = JSON.parse(raw);
        // Defensive against an older cart shape lingering in localStorage
        // (pre box-ordering: lines keyed by size instead of boxTypeId).
        restored = Array.isArray(parsed)
          ? parsed.filter(
              (l): l is CartLine =>
                l && typeof l.qty === "number" && ["box8", "box10", "box12"].includes(l.boxTypeId),
            )
          : [];
      }
    } catch {
      // ignore malformed local storage
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(restored);
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

  const unavailableLines = useMemo(
    () => lines.filter((l) => !getStyleById(l.styleId)),
    [lines, getStyleById],
  );

  // Counts only what can actually be bought. Counting orphaned lines here is what let a
  // cart show "64 pairs" on the badge while the cart page rendered nothing — the page
  // skips styles it can't resolve, so the pairs were real to the badge and invisible
  // everywhere else, with no control to clear them.
  const itemCount = useMemo(
    () => lines.reduce((sum, l) => (getStyleById(l.styleId) ? sum + pairsInLine(l) : sum), 0),
    [lines, getStyleById],
  );

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

  const styleVat = useCallback(
    (styleId: string) => {
      const style = getStyleById(styleId);
      if (!style?.vatRate) return 0;
      return Math.round(styleSubtotal(styleId) * style.vatRate * 100) / 100;
    },
    [getStyleById, styleSubtotal],
  );

  const cartTotal = useMemo(() => {
    const styleIds = Array.from(new Set(lines.map((l) => l.styleId)));
    return Math.round(styleIds.reduce((sum, id) => sum + styleSubtotal(id), 0) * 100) / 100;
  }, [lines, styleSubtotal]);

  const cartVatTotal = useMemo(() => {
    const styleIds = Array.from(new Set(lines.map((l) => l.styleId)));
    return Math.round(styleIds.reduce((sum, id) => sum + styleVat(id), 0) * 100) / 100;
  }, [lines, styleVat]);

  const cartGrandTotal = useMemo(() => Math.round((cartTotal + cartVatTotal) * 100) / 100, [cartTotal, cartVatTotal]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      unavailableLines,
      itemCount,
      addLines,
      setLineQty,
      removeStyle,
      clearCart,
      styleSubtotal,
      styleVat,
      cartTotal,
      cartVatTotal,
      cartGrandTotal,
      priceMultiplier,
    }),
    [
      lines,
      unavailableLines,
      itemCount,
      addLines,
      setLineQty,
      removeStyle,
      clearCart,
      styleSubtotal,
      styleVat,
      cartTotal,
      cartVatTotal,
      cartGrandTotal,
      priceMultiplier,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
