"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-context";
import { getBoxType } from "@/lib/data/boxTypes";
import { getStyleImageUrl } from "@/lib/data/styleLabels";
import { formatEUR, getOrderMinimumError, validateMatrix } from "@/lib/pricing";
import type { BoxTypeId } from "@/lib/types";
import type { BoxOption } from "@/lib/orderMinimum";
import { LinkButton } from "@/components/ui/Button";
import { StylePlate } from "@/components/product/StylePlate";
import { SaveAssortmentButton } from "@/components/dashboard/SaveAssortmentButton";
import { CompleteMinimum } from "@/components/cart/CompleteMinimum";
import { cn } from "@/lib/cn";

export function CartView({ inStockOptions }: { inStockOptions: BoxOption[] }) {
  const { lines, setLineQty, removeStyle, cartTotal, priceMultiplier } = useCart();
  const { getStyleById } = useCatalog();

  const styleIds = useMemo(() => Array.from(new Set(lines.map((l) => l.styleId))), [lines]);
  const grandTotalPairs = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty * getBoxType(l.boxTypeId).totalPairs, 0),
    [lines],
  );
  const minimumError = getOrderMinimumError(grandTotalPairs);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-[900px] px-6 py-24 text-center">
        <p className="font-display text-xl font-bold uppercase tracking-tight text-ink">Your cart is empty</p>
        <p className="mt-2 text-sm text-ink-soft">Build an order from the catalog, linesheet, or quick order.</p>
        <LinkButton href="/catalogue" className="mt-6 inline-flex">Browse Catalogue</LinkButton>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8 pb-28 lg:px-10 lg:pb-8">
      <div className="flex items-center justify-between border-b border-stone-300 pb-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
          Cart
        </h1>
        <Link href="/catalogue" className="text-xs font-semibold uppercase tracking-wide text-ink-soft hover:text-ink">
          ← Continue shopping
        </Link>
      </div>

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
          const validation = validateMatrix(style, qtyMap, "net60", priceMultiplier);

          return (
            <div key={styleId} className="border border-stone-300 bg-white">
              <div className="flex items-center gap-4 border-b border-stone-200 p-4">
                <StylePlate
                  swatch={style.colorways[0].swatch}
                  imageUrl={getStyleImageUrl(style)}
                  alt={style.name}
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

              {/* Mobile/tablet: one stacked row per line, full-width controls — no
                  horizontal scroll needed to reach the stepper or remove button. */}
              <div className="flex flex-col divide-y divide-stone-100 lg:hidden">
                {styleLines.map((l) => {
                  const colorway = style.colorways.find((c) => c.id === l.colorwayId);
                  const box = getBoxType(l.boxTypeId);
                  return (
                    <div key={`${l.colorwayId}-${l.boxTypeId}`} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-ink">{colorway?.name ?? l.colorwayId}</p>
                        <p className="font-mono-tab text-xs text-ink-soft">
                          {box.label} · {l.qty * box.totalPairs} pairs
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center border border-stone-300">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => setLineQty(styleId, l.colorwayId, l.boxTypeId, Math.max(0, l.qty - 1))}
                          className="flex h-9 w-9 items-center justify-center text-ink hover:bg-stone-100"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={l.qty}
                          onChange={(e) =>
                            setLineQty(styleId, l.colorwayId, l.boxTypeId, Number(e.target.value) || 0)
                          }
                          aria-label={`${colorway?.name ?? "Colorway"} ${box.label} quantity`}
                          className="font-mono-tab w-12 border-x border-stone-300 bg-white px-1 py-1 text-center text-sm outline-none focus-visible:border-signal"
                        />
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => setLineQty(styleId, l.colorwayId, l.boxTypeId, l.qty + 1)}
                          className="flex h-9 w-9 items-center justify-center text-ink hover:bg-stone-100"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLineQty(styleId, l.colorwayId, l.boxTypeId, 0)}
                        aria-label={`Remove ${colorway?.name ?? "line"} from cart`}
                        className="shrink-0 px-1 text-ink-soft hover:text-ember"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: full table. */}
              <div className="scroll-thin hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[480px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                      <th className="px-4 py-2 font-semibold">Colorway</th>
                      <th className="px-2 py-2 font-semibold">Box</th>
                      <th className="px-2 py-2 text-right font-semibold">Qty</th>
                      <th className="px-4 py-2 text-right font-semibold">Pairs</th>
                      <th className="w-10 px-2 py-2" />
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
                            <div className="ml-auto flex w-fit items-center border border-stone-300">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                onClick={() => setLineQty(styleId, l.colorwayId, l.boxTypeId, Math.max(0, l.qty - 1))}
                                className="flex h-9 w-9 items-center justify-center text-ink hover:bg-stone-100"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={0}
                                value={l.qty}
                                onChange={(e) =>
                                  setLineQty(styleId, l.colorwayId, l.boxTypeId, Number(e.target.value) || 0)
                                }
                                aria-label={`${colorway?.name ?? "Colorway"} ${box.label} quantity`}
                                className="font-mono-tab w-12 border-x border-stone-300 bg-white px-1 py-1 text-center text-sm outline-none focus-visible:border-signal"
                              />
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() => setLineQty(styleId, l.colorwayId, l.boxTypeId, l.qty + 1)}
                                className="flex h-9 w-9 items-center justify-center text-ink hover:bg-stone-100"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="font-mono-tab px-4 py-2 text-right text-ink-soft">{l.qty * box.totalPairs}</td>
                          <td className="px-2 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => setLineQty(styleId, l.colorwayId, l.boxTypeId, 0)}
                              aria-label={`Remove ${colorway?.name ?? "line"} from cart`}
                              className="text-ink-soft hover:text-ember"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-stone-50 px-4 py-3">
                <div className="flex items-center gap-4 text-xs text-ink-soft">
                  <span className="font-mono-tab">{validation.totalBoxes} boxes · {validation.totalPairs} pairs</span>
                </div>
                <span className="text-base font-semibold tabular-nums text-ink">{formatEUR(validation.subtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <CompleteMinimum options={inStockOptions} totalPairs={grandTotalPairs} />

      <div className="mt-8 flex flex-col items-end gap-3 border-t border-stone-300 pt-6">
        <SaveAssortmentButton lines={lines} />
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Cart total (net-60)</span>
          <span className="text-2xl font-semibold tabular-nums text-ink">{formatEUR(cartTotal)}</span>
        </div>
        <p className="text-right text-xs text-ink-soft">{grandTotalPairs} pairs in cart</p>
        <p className="text-right text-xs font-medium text-positive">
          Prepay in full at checkout to save {formatEUR(cartTotal * 0.1)} (10% off)
        </p>
        {minimumError && (
          <p className="max-w-sm text-right text-xs font-medium text-ember">{minimumError}</p>
        )}
        <div className="hidden lg:block">
          <LinkButton
            href={minimumError ? "#" : "/checkout"}
            size="lg"
            className={minimumError ? "pointer-events-none opacity-40" : ""}
          >
            Proceed to Checkout
          </LinkButton>
        </div>
      </div>

      {/* Sticky mobile checkout bar — the primary action stays reachable without scrolling back down a long cart. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-300 bg-white/97 px-4 py-3 backdrop-blur lg:hidden" style={{ boxShadow: "0 -8px 24px rgba(26,29,34,0.12)" }}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold tabular-nums text-ink">{formatEUR(cartTotal)}</p>
            <p className="truncate text-[10px] text-ink-soft">{grandTotalPairs} pairs</p>
          </div>
          <LinkButton
            href={minimumError ? "#" : "/checkout"}
            className={cn("shrink-0", minimumError ? "pointer-events-none opacity-40" : "")}
          >
            Checkout
          </LinkButton>
        </div>
        {minimumError && <p className="mt-1.5 text-[11px] font-medium text-ember">{minimumError}</p>}
      </div>
    </div>
  );
}
