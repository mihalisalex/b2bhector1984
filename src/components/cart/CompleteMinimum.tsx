"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-context";
import { formatEUR, MIN_ORDER_PAIRS } from "@/lib/pricing";
import { suggestBoxesToCloseGap, type BoxOption } from "@/lib/orderMinimum";
import { StylePlate } from "@/components/product/StylePlate";

/**
 * The 40-pair minimum is the one hard gate on every order in this business, and
 * until now the app only ever announced the shortfall. This closes it: real
 * orderable boxes, ranked to land on (or just over) the remaining pairs, added in
 * one click. The list re-ranks after every add, so repeated clicks converge.
 *
 * Suggestions include made-to-order and pre-order boxes, not just what's on the
 * shelf — each card says which it is, so "one tap adds a box" never doubles as an
 * implied promise that it ships immediately.
 */
export function CompleteMinimum({
  options,
  totalPairs,
}: {
  options: BoxOption[];
  totalPairs: number;
}) {
  const { addLines, lines } = useCart();
  const { productionLeadTimeDays } = useCatalog();
  const shortfall = MIN_ORDER_PAIRS - totalPairs;
  if (shortfall <= 0) return null;

  // Don't offer a box the buyer already has maxed out against available stock —
  // but on-hand is only a ceiling for stock boxes. A made-to-order or pre-order box
  // has no shelf to run out of, so it stays offerable however many are already in
  // the cart (the same rule the cart's own +/- stepper follows).
  const available = options.filter((option) => {
    if (option.fulfillment !== "stock") return true;
    const inCart =
      lines.find(
        (l) =>
          l.styleId === option.styleId &&
          l.colorwayId === option.colorwayId &&
          l.boxTypeId === option.boxTypeId,
      )?.qty ?? 0;
    return option.onHand - inCart > 0;
  });
  const suggestions = suggestBoxesToCloseGap(available, shortfall);
  if (suggestions.length === 0) return null;

  function add(option: BoxOption) {
    const existing =
      lines.find(
        (l) =>
          l.styleId === option.styleId &&
          l.colorwayId === option.colorwayId &&
          l.boxTypeId === option.boxTypeId,
      )?.qty ?? 0;
    addLines(option.styleId, [
      { colorwayId: option.colorwayId, boxTypeId: option.boxTypeId, qty: existing + 1 },
    ]);
  }

  return (
    <section
      aria-labelledby="complete-minimum-heading"
      className="mt-8 border border-stone-300 bg-stone-100"
    >
      <div className="border-b border-stone-300 px-4 py-3">
        <h2
          id="complete-minimum-heading"
          className="font-display text-sm font-bold uppercase tracking-tight text-ink"
        >
          {shortfall} more {shortfall === 1 ? "pair" : "pairs"} to check out
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          Orders ship at a {MIN_ORDER_PAIRS}-pair minimum, mixable across styles. These are sized to close
          the gap — one tap adds a box.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-px bg-stone-300 sm:grid-cols-2 lg:grid-cols-4">
        {suggestions.map((option) => {
          const closes = option.pairs >= shortfall;
          return (
            <li
              key={`${option.styleId}-${option.colorwayId}-${option.boxTypeId}`}
              className="flex flex-col bg-white p-3"
            >
              <div className="flex items-start gap-3">
                <StylePlate
                  swatch={option.swatch}
                  imageUrl={option.imageUrl}
                  alt={option.styleName}
                  className="h-14 w-16 shrink-0"
                  dense
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${option.slug}`}
                    className="font-display block truncate text-sm font-bold uppercase text-ink hover:underline"
                  >
                    {option.styleName}
                  </Link>
                  <p className="truncate text-xs text-ink-soft">
                    {option.colorwayName} · {option.boxLabel}
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-ink">
                    {formatEUR(option.unitPrice * option.pairs)}
                    <span className="font-mono-tab text-ink-soft"> · {option.pairs} pairs</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-soft">
                    {option.fulfillment === "stock"
                      ? `${option.onHand} in stock`
                      : option.fulfillment === "pre_order"
                        ? "Pre-order — ships upon arrangement"
                        : `Made to order — ~${productionLeadTimeDays} days`}
                  </p>
                </div>
              </div>

              <p className={`mt-2 text-[11px] ${closes ? "text-positive" : "text-ink-soft"}`}>
                {closes
                  ? `Clears the minimum (${totalPairs + option.pairs} pairs)`
                  : `Leaves ${shortfall - option.pairs} to go`}
              </p>

              <button
                type="button"
                onClick={() => add(option)}
                className="mt-2 w-full border border-ink px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-white"
              >
                Add box
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
