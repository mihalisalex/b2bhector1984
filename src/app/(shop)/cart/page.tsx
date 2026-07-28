"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-context";
import { getBoxType } from "@/lib/data/boxTypes";
import { formatUSD, validateMatrix } from "@/lib/pricing";
import type { BoxTypeId } from "@/lib/types";
import { LinkButton } from "@/components/ui/Button";
import { StylePlate } from "@/components/product/StylePlate";

export default function CartPage() {
  const { lines, setLineQty, removeStyle, cartTotal } = useCart();
  const { getStyleById } = useCatalog();

  const styleIds = useMemo(() => Array.from(new Set(lines.map((l) => l.styleId))), [lines]);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-[900px] px-6 py-24 text-center">
        <p className="font-display text-xl font-bold uppercase tracking-tight text-ink">Your cart is empty</p>
        <p className="mt-2 text-sm text-ink-soft">Build an order from the catalog, linesheet, or quick order.</p>
        <LinkButton href="/catalog" className="mt-6 inline-flex">Browse Catalog</LinkButton>
      </div>
    );
  }

  let blocking = false;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8 lg:px-10">
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Cart
      </h1>

      <div className="mt-6 flex flex-col gap-6">
        {styleIds.map((styleId) => {
          const style = getStyleById(styleId);
          if (!style) return null;
          const styleLines = lines.filter((l) => l.styleId === styleId);
          const qtyMap: Record<string, Partial<Record<BoxTypeId, number>>> = {};
          for (const l of styleLines) {
            qtyMap[l.colorwayId] = qtyMap[l.colorwayId] || {};
            qtyMap[l.colorwayId]![l.boxTypeId] = l.qty;
          }
          const validation = validateMatrix(style, qtyMap);
          if (!validation.moqMet) blocking = true;

          return (
            <div key={styleId} className="border border-stone-300 bg-white">
              <div className="flex items-center gap-4 border-b border-stone-200 p-4">
                <StylePlate
                  swatch={style.colorways[0].swatch}
                  imageUrl={style.primaryImageUrl}
                  className="h-16 w-20 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${style.slug}`} className="font-display text-base font-bold uppercase text-ink hover:underline">
                    {style.name}
                  </Link>
                  <p className="font-mono-tab text-xs text-ink-soft">{style.styleNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeStyle(styleId)}
                  className="text-xs font-medium uppercase tracking-wide text-ember hover:underline"
                >
                  Remove
                </button>
              </div>

              <div className="scroll-thin overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                      <th className="px-4 py-2 font-semibold">Colorway</th>
                      <th className="px-2 py-2 font-semibold">Box</th>
                      <th className="px-2 py-2 text-right font-semibold">Qty</th>
                      <th className="px-4 py-2 text-right font-semibold">Pairs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {styleLines.map((l) => {
                      const colorway = style.colorways.find((c) => c.id === l.colorwayId);
                      const box = getBoxType(l.boxTypeId);
                      return (
                        <tr key={`${l.colorwayId}-${l.boxTypeId}`} className="border-b border-stone-100 last:border-b-0">
                          <td className="px-4 py-2 text-ink">{colorway?.name ?? l.colorwayId}</td>
                          <td className="font-mono-tab px-2 py-2 text-ink-soft">{box.label}</td>
                          <td className="px-2 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              value={l.qty}
                              onChange={(e) =>
                                setLineQty(styleId, l.colorwayId, l.boxTypeId, Number(e.target.value) || 0)
                              }
                              className="font-mono-tab w-16 border border-stone-300 bg-white px-2 py-1 text-right text-sm outline-none focus-visible:border-signal"
                            />
                          </td>
                          <td className="font-mono-tab px-4 py-2 text-right text-ink-soft">{l.qty * box.totalPairs}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-stone-50 px-4 py-3">
                <div className="flex items-center gap-4 text-xs text-ink-soft">
                  <span className="font-mono-tab">{validation.totalBoxes} boxes · {validation.totalPairs} pairs</span>
                  <span>Min {validation.moqBoxes} box{validation.moqBoxes > 1 ? "es" : ""}</span>
                  {!validation.moqMet && (
                    <span className="font-medium text-ember">{validation.orderError}</span>
                  )}
                </div>
                <span className="font-mono-tab text-base font-semibold text-ink">{formatUSD(validation.subtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-end gap-3 border-t border-stone-300 pt-6">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Cart total</span>
          <span className="font-mono-tab text-2xl font-bold text-ink">{formatUSD(cartTotal)}</span>
        </div>
        {blocking && (
          <p className="max-w-sm text-right text-xs font-medium text-ember">
            One or more styles are below their box minimum. Fix these before checkout.
          </p>
        )}
        <LinkButton href={blocking ? "#" : "/checkout"} size="lg" className={blocking ? "pointer-events-none opacity-40" : ""}>
          Proceed to Checkout
        </LinkButton>
      </div>
    </div>
  );
}
