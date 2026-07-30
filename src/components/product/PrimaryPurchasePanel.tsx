"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useColorwaySelection } from "@/lib/colorway-selection-context";
import { pickDefaultBoxType } from "@/lib/productSelectionDefaults";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { formatEUR, getUnitPrice, MIN_ORDER_PAIRS } from "@/lib/pricing";
import { ColorwayPicker } from "@/components/product/ColorwayPicker";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { ShareButton } from "@/components/product/ShareButton";
import type { BoxTypeId, Style } from "@/lib/types";
import type { StyleInventory } from "@/lib/data/inventory";
import { cn } from "@/lib/cn";

/**
 * Id of the sentinel the product page renders just above its related-styles section.
 * The mobile buy bar watches it to know when to release.
 */
export const BUY_BAR_RELEASE_ID = "product-buybar-release";

export function PrimaryPurchasePanel({
  style,
  inventory,
  priceMultiplier = 1,
  initialFavorited,
}: {
  style: Style;
  inventory: StyleInventory;
  priceMultiplier?: number;
  initialFavorited: boolean;
}) {
  const { addLines, lines, itemCount } = useCart();
  const boxTypes = getAvailableBoxTypes(style);

  const { colorwayId } = useColorwaySelection();
  const [boxTypeId, setBoxTypeId] = useState<BoxTypeId>(() => pickDefaultBoxType(style, inventory, colorwayId));
  const [addQty, setAddQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [reachedBrowsing, setReachedBrowsing] = useState(false);

  // Re-pick the best-stocked box type whenever the shared colorway selection changes
  // (a swatch click here, but the colorway can now also be driven from elsewhere).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the box-type choice for a newly-selected colorway, not derived render state
    setBoxTypeId(pickDefaultBoxType(style, inventory, colorwayId));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the colorway change should trigger this, not every style/inventory identity change
  }, [colorwayId]);

  // Release the sticky bar once the buyer reaches the related-styles section: past that
  // point they've moved from deciding on this style to browsing the category, and a
  // permanent bar just eats screen. The sentinel is rendered by the product page.
  useEffect(() => {
    const el = document.getElementById(BUY_BAR_RELEASE_ID);
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Shrink the root to its top 30%: a bare sentinel would intersect the moment it
    // clipped the bottom edge, which happens *before* the in-page CTA has scrolled away —
    // the bar would then never appear at all. This fires only once the related styles have
    // genuinely taken over the screen.
    // `top < 0` keeps it released once the sentinel has scrolled clear off the top —
    // otherwise the bar would pop back the moment it left the band on the way down.
    const observer = new IntersectionObserver(
      ([entry]) => setReachedBrowsing(entry.isIntersecting || entry.boundingClientRect.top < 0),
      { rootMargin: "0px 0px -70% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const box = boxTypes.find((b) => b.id === boxTypeId) ?? boxTypes[0];
  const onHand = inventory[colorwayId]?.[boxTypeId] ?? 0;
  const existingQty = lines.find((l) => l.styleId === style.id && l.colorwayId === colorwayId && l.boxTypeId === boxTypeId)?.qty ?? 0;
  const remaining = Math.max(0, onHand - existingQty);
  const outOfStock = onHand === 0;
  const lowStock = onHand > 0 && onHand <= 4;

  const unitPrice = getUnitPrice(style, "net60", priceMultiplier);
  const pairsPerBox = box.totalPairs;
  const subtotal = useMemo(() => unitPrice * pairsPerBox * addQty, [unitPrice, pairsPerBox, addQty]);

  // The 40-pair order minimum is enforced in the cart, at checkout, and server-side in
  // placeOrder — but until now it was invisible here, so a buyer could add a single box and
  // only discover the wall two screens later. `itemCount` is cart-wide pairs; the minimum is
  // mixable across styles, so this projects the total *after* this add rather than per-style.
  const pendingPairs = addQty * pairsPerBox;
  const pairsAfterAdd = itemCount + pendingPairs;
  const pairsShort = Math.max(0, MIN_ORDER_PAIRS - pairsAfterAdd);

  // Re-clamp the pending add-qty whenever the selected colorway/box combo changes stock.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clamping local qty to the newly-selected combo's stock, not derived render state
    setAddQty((prev) => Math.min(Math.max(1, prev), Math.max(1, remaining)));
  }, [colorwayId, boxTypeId, remaining]);

  function step(delta: number) {
    setJustAdded(false);
    setAddQty((prev) => Math.min(remaining, Math.max(1, prev + delta)));
  }

  function handleAddToCart() {
    if (remaining <= 0) return;
    addLines(style.id, [{ colorwayId, boxTypeId, qty: existingQty + addQty }]);
    setJustAdded(true);
    setAddQty(1);
    setTimeout(() => setJustAdded(false), 2500);
  }

  const selectedColorway = style.colorways.find((c) => c.id === colorwayId) ?? style.colorways[0];
  // The bar is the only Add-to-cart at every size, so it stays up for the whole decision
  // and only steps aside once the buyer moves on to browsing the category.
  const barVisible = !reachedBrowsing;

  return (
    <>
      {/* Everything a buyer needs to buy (price, colour, quantity, CTA) lives in the
          sticky bar below at every screen size — this card is the supplementary detail
          the bar can't carry: exact box size, stock, subtotal, order-minimum progress,
          favorite/share. Not sticky, matching how it behaves on a phone. */}
      <div className="border border-stone-300 bg-white">
        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Box size
            </p>
            {/* Pills, not full-width tiles — with a single box type this used to render as
                one giant solid-black bar, which read as a second call-to-action competing
                with "Add to cart" rather than a quiet selector. */}
            {boxTypes.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {boxTypes.map((b) => {
                  const stock = inventory[colorwayId]?.[b.id] ?? 0;
                  const active = b.id === boxTypeId;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBoxTypeId(b.id)}
                      aria-pressed={active}
                      className={cn(
                        "px-3.5 py-2 text-xs font-semibold tabular-nums transition-colors duration-150",
                        active ? "bg-ink text-white" : "bg-stone-100 text-ink-soft hover:bg-stone-200",
                        stock === 0 && "opacity-45",
                      )}
                    >
                      {b.totalPairs}-Pair Box
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm font-medium text-ink">{boxTypes[0].totalPairs}-pair pre-pack box</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="mb-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Boxes
            </p>
            <p className={cn("text-xs font-medium", outOfStock || lowStock ? "text-ember" : "text-ink-soft")}>
              {outOfStock
                ? "Out of stock in this combination"
                : lowStock
                  ? `Only ${onHand} left`
                  : `${onHand} in stock`}
              {existingQty > 0 && <span className="text-ink-soft"> · {existingQty} in cart</span>}
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                {addQty * pairsPerBox} pairs
              </span>
              <span className="text-2xl font-semibold tabular-nums text-ink">{formatEUR(subtotal)}</span>
            </div>

            {!outOfStock && (
              <p className={cn("mt-2 text-[11px] leading-snug", pairsShort > 0 ? "text-ink-soft" : "text-positive")}>
                {pairsShort > 0 ? (
                  <>
                    Takes your order to <span className="font-semibold text-ink">{pairsAfterAdd} pairs</span> —{" "}
                    {pairsShort} short of the {MIN_ORDER_PAIRS}-pair minimum, mixable across any styles.
                  </>
                ) : (
                  <>Meets the {MIN_ORDER_PAIRS}-pair order minimum ({pairsAfterAdd} pairs after adding).</>
                )}
              </p>
            )}

            <div className="mt-4 flex items-center gap-2">
              <FavoriteButton styleId={style.id} initialFavorited={initialFavorited} />
              <ShareButton title={style.name} />
            </div>

            {justAdded && (
              <p className="mt-2.5 text-xs font-medium text-positive">
                Added.{" "}
                <a href="/cart" className="underline hover:text-ink">
                  View cart
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sticky purchase bar — the single Add-to-cart at every screen size, carrying
          everything needed to buy (box size, price, colour, quantity, CTA) so the buyer
          never scrolls back up. Full-width band so it reads as a fixture of the page
          regardless of viewport, but its content is capped/centered to match the column
          above on wide screens rather than sprawling across a monitor. Releases once the
          related-products section comes into view, handing the screen over to browsing. */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 bg-white/97 px-4 pb-3 pt-3 backdrop-blur-md transition-transform duration-300 ease-out",
          barVisible ? "translate-y-0" : "translate-y-full",
        )}
        style={{ boxShadow: "0 -10px 30px rgba(26,29,34,0.12)" }}
        aria-hidden={!barVisible}
      >
        <div className="mx-auto max-w-[600px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {/* Box size sits where the product name used to — the name is redundant with
                  the page title just above, but which box you're about to buy isn't. */}
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                {box.totalPairs}-Pair Box
              </p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[17px] font-semibold tabular-nums text-ink">
                  {formatEUR(unitPrice)}
                </span>
                <span className="text-[11px] text-ink-soft">/ pair · {selectedColorway.name}</span>
              </p>
            </div>
            <ColorwayPicker style={style} inventory={inventory} className="-mr-1 shrink-0" />
          </div>

          <div className="mt-2.5 flex items-stretch gap-2">
            <Stepper qty={addQty} max={remaining} disabled={outOfStock} onStep={step} />
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={remaining <= 0}
              className="flex-1 bg-ink px-3 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-transform active:scale-[0.99] disabled:bg-cinder-300 disabled:text-white/70"
            >
              {outOfStock
                ? "Sold out"
                : justAdded
                  ? "Added to cart ✓"
                  : `Add ${box.totalPairs}-pair box${addQty > 1 ? "es" : ""} · ${formatEUR(subtotal)}`}
            </button>
          </div>
        </div>
      </div>
      {/* Reserves space so the fixed bar doesn't cover page content/footer */}
      {barVisible && <div className="h-[108px]" aria-hidden />}
    </>
  );
}

/**
 * Quantity stepper for the purchase bar — the only place quantity is adjusted now that
 * desktop matches mobile (tap +/-, no typed-number entry; a phone never had one either).
 * Both glyphs are drawn as SVG on an identical 16x16 grid — pairing a Unicode minus with
 * an ASCII plus renders at visibly different weights and made the control look broken.
 */
function Stepper({
  qty,
  max,
  disabled,
  onStep,
}: {
  qty: number;
  max: number;
  disabled?: boolean;
  onStep: (delta: number) => void;
}) {
  return (
    <div className="flex shrink-0 items-center bg-stone-100">
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={disabled || qty <= 1}
        aria-label="Decrease quantity"
        className="flex h-11 w-10 items-center justify-center text-ink transition-colors hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <StepIcon kind="minus" />
      </button>
      <span className="font-mono-tab flex h-11 w-9 items-center justify-center text-base font-bold tabular-nums text-ink">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onStep(1)}
        disabled={disabled || qty >= max}
        aria-label="Increase quantity"
        className="flex h-11 w-10 items-center justify-center text-ink transition-colors hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <StepIcon kind="plus" />
      </button>
    </div>
  );
}

function StepIcon({ kind }: { kind: "minus" | "plus" }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <rect x="1.5" y="7.25" width="13" height="1.5" />
      {kind === "plus" && <rect x="7.25" y="1.5" width="1.5" height="13" />}
    </svg>
  );
}
