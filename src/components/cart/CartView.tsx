"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-context";
import { getBoxType } from "@/lib/data/boxTypes";
import { getStyleImageUrl } from "@/lib/data/styleLabels";
import { formatEUR, getOrderMinimumError, validateMatrix } from "@/lib/pricing";
import type { BoxTypeId } from "@/lib/types";
import type { StyleInventory } from "@/lib/data/inventory";
import type { BoxOption } from "@/lib/orderMinimum";
import { LinkButton } from "@/components/ui/Button";
import { VatSuffix } from "@/components/ui/VatSuffix";
import { StylePlate } from "@/components/product/StylePlate";
import { SaveAssortmentButton } from "@/components/dashboard/SaveAssortmentButton";
import { CompleteMinimum } from "@/components/cart/CompleteMinimum";
import { cn } from "@/lib/cn";

/** Ceiling on the stepper when a style allows ordering beyond on-hand stock (the shortfall
 * goes to production) — not a real business constraint, just a sanity bound on the input.
 * Mirrors PrimaryPurchasePanel/QuickAdd/OrderableLinesheet's constant of the same name. */
const MAX_BACKORDER_QTY = 999;

export function CartView({
  inStockOptions,
  inventory,
}: {
  inStockOptions: BoxOption[];
  /** Real per-colorway/box stock — the +/- steppers below clamp against this (or, for a
   * style with backorders allowed, against MAX_BACKORDER_QTY instead — the shortfall goes
   * to production rather than blocking the buyer). */
  inventory: Record<string, StyleInventory>;
}) {
  const { lines, unavailableLines, setLineQty, removeStyle, cartTotal, cartVatTotal, cartGrandTotal, priceMultiplier } = useCart();
  const { getStyleById, productionLeadTimeDays } = useCatalog();

  function onHandFor(styleId: string, colorwayId: string, boxTypeId: BoxTypeId): number {
    return inventory[styleId]?.[colorwayId]?.[boxTypeId] ?? 0;
  }

  /** The real ceiling for a line: uncapped (well, sanity-capped) when its style allows
   * backorders, otherwise exactly what's on the shelf — same distinction every other
   * add-to-cart surface (PrimaryPurchasePanel, QuickAdd, OrderableLinesheet) already makes. */
  function maxFor(styleId: string, colorwayId: string, boxTypeId: BoxTypeId): number {
    const onHand = onHandFor(styleId, colorwayId, boxTypeId);
    return getStyleById(styleId)?.allowBackorder ? MAX_BACKORDER_QTY : onHand;
  }

  function clamp(styleId: string, colorwayId: string, boxTypeId: BoxTypeId, value: number): number {
    const max = maxFor(styleId, colorwayId, boxTypeId);
    return Math.min(max, Math.max(0, Math.floor(value) || 0));
  }

  /** Per-line stock status: whether the "+" should be disabled, whether the quantity
   * typed/loaded in is a real problem (over the true ceiling, blocking checkout), and the
   * message to show underneath — including the made-to-order/pre-order distinction once a
   * backorder-allowed style's line runs past on-hand into production. */
  function lineStatus(styleId: string, colorwayId: string, boxTypeId: BoxTypeId, qty: number) {
    const style = getStyleById(styleId);
    const onHand = onHandFor(styleId, colorwayId, boxTypeId);
    const allowBackorder = style?.allowBackorder ?? false;
    const max = allowBackorder ? MAX_BACKORDER_QTY : onHand;
    const overStock = qty > max;
    const willBeProduction = allowBackorder && qty > onHand;
    const label = overStock
      ? `Only ${onHand} available — reduce quantity`
      : willBeProduction
        ? style?.backorderMode === "pre_order"
          ? `${onHand} in stock · rest is pre-order, ships upon arrangement`
          : `${onHand} in stock · rest ships in ~${productionLeadTimeDays} days`
        : `${onHand} available`;
    return { onHand, max, overStock, willBeProduction, label };
  }

  // Everything below counts only sellable lines. A line whose style has been archived or
  // deleted can't be priced, ordered, or even rendered, so including it inflated the pair
  // count and the stock check against a style that isn't there.
  const sellableLines = useMemo(() => lines.filter((l) => getStyleById(l.styleId)), [lines, getStyleById]);
  const styleIds = useMemo(
    () => Array.from(new Set(sellableLines.map((l) => l.styleId))),
    [sellableLines],
  );
  const grandTotalPairs = useMemo(
    () => sellableLines.reduce((sum, l) => sum + l.qty * getBoxType(l.boxTypeId).totalPairs, 0),
    [sellableLines],
  );
  const minimumError = getOrderMinimumError(grandTotalPairs);
  // Belt-and-suspenders alongside the disabled "+" button: also gate the actual checkout
  // hand-off, so a line that's over its real ceiling for any reason (a stale cart from
  // before this fix, stock dropping after the line was added) can't slip through. A line
  // over on-hand is fine — expected, even — when its style allows backorders; `maxFor`
  // is what actually caps it (on-hand, or MAX_BACKORDER_QTY when backorders are allowed),
  // so only a line past *that* ceiling is a real problem.
  const overStockLine = sellableLines.find((l) => l.qty > maxFor(l.styleId, l.colorwayId, l.boxTypeId));
  const unavailableStyleIds = useMemo(
    () => Array.from(new Set(unavailableLines.map((l) => l.styleId))),
    [unavailableLines],
  );
  const blockedReason =
    minimumError ||
    (overStockLine ? "One or more lines exceed available stock — reduce quantity to check out." : undefined) ||
    (unavailableLines.length > 0
      ? "Remove the styles that are no longer available before checking out."
      : undefined);

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

      {unavailableStyleIds.length > 0 && (
        <div className="mt-6 border border-ember/40 bg-ember-100 px-4 py-3">
          <p className="text-sm font-semibold text-ember">
            {unavailableStyleIds.length === 1 ? "A style in your cart is" : "Some styles in your cart are"} no longer
            available
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            These were withdrawn after you added them, so they can&rsquo;t be priced or ordered. They&rsquo;re not
            included in your totals — remove them to check out.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {unavailableStyleIds.map((styleId) => {
              const pairs = unavailableLines
                .filter((l) => l.styleId === styleId)
                .reduce((sum, l) => sum + l.qty * getBoxType(l.boxTypeId).totalPairs, 0);
              return (
                <li key={styleId} className="flex items-center justify-between gap-3 border-t border-ember/20 pt-2">
                  <span className="text-xs text-ink-soft">
                    <span className="font-mono-tab text-ink">{styleId}</span> · {pairs} pair{pairs === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStyle(styleId)}
                    className="text-xs font-semibold uppercase tracking-wide text-ember hover:underline"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
                  const { max, overStock, willBeProduction, label } = lineStatus(styleId, l.colorwayId, l.boxTypeId, l.qty);
                  return (
                    <div key={`${l.colorwayId}-${l.boxTypeId}`} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-ink">{colorway?.name ?? l.colorwayId}</p>
                        <p className="font-mono-tab text-xs text-ink-soft">
                          {box.label} · {l.qty * box.totalPairs} pairs
                        </p>
                        <p className={cn("text-[11px]", overStock ? "font-medium text-ember" : willBeProduction ? "text-ink" : "text-ink-soft")}>
                          {label}
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
                          max={max}
                          value={l.qty}
                          onChange={(e) => setLineQty(styleId, l.colorwayId, l.boxTypeId, clamp(styleId, l.colorwayId, l.boxTypeId, Number(e.target.value)))}
                          aria-label={`${colorway?.name ?? "Colorway"} ${box.label} quantity`}
                          className="font-mono-tab w-12 border-x border-stone-300 bg-white px-1 py-1 text-center text-sm outline-none focus-visible:border-signal"
                        />
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => setLineQty(styleId, l.colorwayId, l.boxTypeId, l.qty + 1)}
                          disabled={l.qty >= max}
                          className="flex h-9 w-9 items-center justify-center text-ink hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
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
                      const { max, overStock, willBeProduction, label } = lineStatus(styleId, l.colorwayId, l.boxTypeId, l.qty);
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
                                max={max}
                                value={l.qty}
                                onChange={(e) =>
                                  setLineQty(styleId, l.colorwayId, l.boxTypeId, clamp(styleId, l.colorwayId, l.boxTypeId, Number(e.target.value)))
                                }
                                aria-label={`${colorway?.name ?? "Colorway"} ${box.label} quantity`}
                                className="font-mono-tab w-12 border-x border-stone-300 bg-white px-1 py-1 text-center text-sm outline-none focus-visible:border-signal"
                              />
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() => setLineQty(styleId, l.colorwayId, l.boxTypeId, l.qty + 1)}
                                disabled={l.qty >= max}
                                className="flex h-9 w-9 items-center justify-center text-ink hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                +
                              </button>
                            </div>
                            <p className={cn("mt-1 text-[11px]", overStock ? "font-medium text-ember" : willBeProduction ? "text-ink" : "text-ink-soft")}>
                              {label}
                            </p>
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
                <span className="text-base font-semibold tabular-nums text-ink">
                  {formatEUR(validation.subtotal)}
                  <VatSuffix vatRate={style.vatRate} className="text-xs font-normal text-ink-soft" />
                </span>
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
        {cartVatTotal > 0 && (
          <p className="text-right text-xs text-ink-soft">
            + VAT {formatEUR(cartVatTotal)} = {formatEUR(cartGrandTotal)}
          </p>
        )}
        <p className="text-right text-xs text-ink-soft">{grandTotalPairs} pairs in cart</p>
        <p className="text-right text-xs font-medium text-positive">
          Prepay in full at checkout to save {formatEUR(cartGrandTotal * 0.1)} (10% off)
        </p>
        {blockedReason && (
          <p className="max-w-sm text-right text-xs font-medium text-ember">{blockedReason}</p>
        )}
        <div className="hidden lg:block">
          <LinkButton
            href={blockedReason ? "#" : "/checkout"}
            size="lg"
            className={blockedReason ? "pointer-events-none opacity-40" : ""}
          >
            Proceed to Checkout
          </LinkButton>
        </div>
      </div>

      {/* Sticky mobile checkout bar — the primary action stays reachable without scrolling back down a long cart. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-300 bg-white/97 px-4 py-3 backdrop-blur lg:hidden" style={{ boxShadow: "0 -8px 24px rgba(26,29,34,0.12)" }}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold tabular-nums text-ink">{formatEUR(cartGrandTotal)}</p>
            <p className="truncate text-[10px] text-ink-soft">{grandTotalPairs} pairs</p>
          </div>
          <LinkButton
            href={blockedReason ? "#" : "/checkout"}
            className={cn("shrink-0", blockedReason ? "pointer-events-none opacity-40" : "")}
          >
            Checkout
          </LinkButton>
        </div>
        {blockedReason && <p className="mt-1.5 text-[11px] font-medium text-ember">{blockedReason}</p>}
      </div>
    </div>
  );
}
