"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-context";
import { useI18n } from "@/i18n/I18nProvider";
import { withLocale } from "@/i18n/paths";
import { useColorwaySelection } from "@/lib/colorway-selection-context";
import { pickDefaultBoxType } from "@/lib/productSelectionDefaults";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { formatEUR, getUnitPrice, isOnSale, MAX_BACKORDER_QTY, MIN_ORDER_PAIRS } from "@/lib/pricing";
import { SaleBadge } from "@/components/product/SaleBadge";
import { VatSuffix, vatSuffixText } from "@/components/ui/VatSuffix";
import { ColorwayPicker } from "@/components/product/ColorwayPicker";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { ShareButton } from "@/components/product/ShareButton";
import { StepIcon } from "@/components/ui/StepIcon";
import { useCancelableTimeout } from "@/lib/useCancelableTimeout";
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
  const { addLines, lines, itemCount, minOrderPairs: accountMinOrderPairs } = useCart();
  const minOrderPairs = accountMinOrderPairs ?? MIN_ORDER_PAIRS;
  const { productionLeadTimeDays } = useCatalog();
  const { locale } = useI18n();
  const boxTypes = getAvailableBoxTypes(style);

  const { colorwayId } = useColorwaySelection();
  const [boxTypeId, setBoxTypeId] = useState<BoxTypeId>(() => pickDefaultBoxType(style, inventory, colorwayId));
  const [addQty, setAddQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [reachedBrowsing, setReachedBrowsing] = useState(false);
  const scheduleReset = useCancelableTimeout();

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
  // Whether this style can be ordered past its on-hand stock at all (the shortfall goes
  // to production instead of blocking the order) — an admin-editable per-style flag, on by
  // default. `outOfStock` alone (no backorder allowed) is the only case that still hard-blocks.
  const allowBackorder = style.allowBackorder;
  const outOfStock = onHand === 0 && !allowBackorder;
  const lowStock = !allowBackorder && onHand > 0 && onHand <= 4;
  // The stepper's real ceiling: uncapped (well, sanity-capped) when backorder is allowed,
  // otherwise exactly what's left on the shelf, same as before this feature existed.
  const maxSelectable = allowBackorder ? MAX_BACKORDER_QTY : remaining;
  // What placeOrder() will actually decide for this line if added right now — the full
  // quantity for this colorway/box, cart + pending add, compared against on-hand.
  const willBeProduction = allowBackorder && existingQty + addQty > onHand;

  const unitPrice = getUnitPrice(style, "net60", priceMultiplier);
  // List price ignoring any active sale, so the struck-through figure is the real "was".
  const onSale = isOnSale(style);
  const listUnitPrice = Math.round(style.basePrice * priceMultiplier * 100) / 100;
  const pairsPerBox = box.totalPairs;
  const subtotal = useMemo(() => unitPrice * pairsPerBox * addQty, [unitPrice, pairsPerBox, addQty]);

  // The 40-pair order minimum is enforced in the cart, at checkout, and server-side in
  // placeOrder — but until now it was invisible here, so a buyer could add a single box and
  // only discover the wall two screens later. `itemCount` is cart-wide pairs; the minimum is
  // mixable across styles, so this projects the total *after* this add rather than per-style.
  const pendingPairs = addQty * pairsPerBox;
  const pairsAfterAdd = itemCount + pendingPairs;
  const pairsShort = Math.max(0, minOrderPairs - pairsAfterAdd);

  // Re-clamp the pending add-qty whenever the selected colorway/box combo changes stock.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clamping local qty to the newly-selected combo's stock, not derived render state
    setAddQty((prev) => Math.min(Math.max(1, prev), Math.max(1, maxSelectable)));
  }, [colorwayId, boxTypeId, maxSelectable]);

  function step(delta: number) {
    setJustAdded(false);
    setAddQty((prev) => Math.min(maxSelectable, Math.max(1, prev + delta)));
  }

  function handleAddToCart() {
    if (remaining <= 0 && !allowBackorder) return;
    addLines(style.id, [{ colorwayId, boxTypeId, qty: existingQty + addQty }]);
    setJustAdded(true);
    setAddQty(1);
    scheduleReset(() => setJustAdded(false), 2500);
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
                        // EXPERIMENTAL rounded-full, 2026-08-10 — see Button.tsx's `base` comment for the revert path.
                        "rounded-full px-3.5 py-2 text-xs font-semibold tabular-nums transition-colors duration-150",
                        active ? "bg-ink text-white" : "bg-stone-100 text-ink-soft hover:bg-stone-200",
                        stock === 0 && !allowBackorder && "opacity-45",
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
            <p className={cn("text-xs font-medium", outOfStock || lowStock || willBeProduction ? "text-ember" : "text-ink-soft")}>
              {outOfStock
                ? "Out of stock in this combination"
                : willBeProduction
                  ? style.backorderMode === "pre_order"
                    ? "Available for pre-order — ships upon arrangement"
                    : `Made to order — ships in ~${productionLeadTimeDays} days`
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
              <span className="text-2xl font-semibold tabular-nums text-ink">
                {formatEUR(subtotal)}
                <VatSuffix vatRate={style.vatRate} className="text-xs font-normal text-ink-soft" />
              </span>
            </div>

            {!outOfStock && (
              <p className={cn("mt-2 text-[11px] leading-snug", pairsShort > 0 ? "text-ink-soft" : "text-positive")}>
                {pairsShort > 0 ? (
                  <>
                    Takes your order to <span className="font-semibold text-ink">{pairsAfterAdd} pairs</span> —{" "}
                    {pairsShort} short of the {minOrderPairs}-pair minimum, mixable across any styles.
                  </>
                ) : (
                  <>Meets the {minOrderPairs}-pair order minimum ({pairsAfterAdd} pairs after adding).</>
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
                <Link href={withLocale(locale, "/cart")} className="underline hover:text-ink">
                  View cart
                </Link>
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
              <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-[17px] font-semibold tabular-nums text-ink">
                  {formatEUR(unitPrice)}
                  <VatSuffix vatRate={style.vatRate} className="text-[11px] font-normal text-ink-soft" />
                </span>
                {/* The catalogue card advertises the discount; this page was showing only the
                    already-reduced number, so the saving was invisible exactly where the buyer
                    decides. Struck list price is computed the same way the card does it. */}
                {onSale && (
                  <span className="text-[11px] tabular-nums text-ink-soft line-through">
                    {formatEUR(listUnitPrice)}
                  </span>
                )}
                <span className="text-[11px] text-ink-soft">/ pair · {selectedColorway.name}</span>
                {onSale && <SaleBadge style={style} />}
              </p>
            </div>
            <ColorwayPicker style={style} inventory={inventory} className="-mr-1 shrink-0" />
          </div>

          {/* EXPERIMENTAL rounded-full, 2026-08-10 — see Button.tsx's `base` comment for the revert path. */}
          <div className="mt-2.5 flex items-stretch gap-2">
            <Stepper qty={addQty} max={maxSelectable} disabled={outOfStock} onStep={step} />
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="flex-1 rounded-full bg-ink px-3 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-transform active:scale-[0.99] disabled:bg-cinder-300 disabled:text-white/70"
            >
              {outOfStock
                ? "Sold out"
                : justAdded
                  ? "Added to cart ✓"
                  : `Add ${box.totalPairs}-pair box${addQty > 1 ? "es" : ""} · ${formatEUR(subtotal)}${vatSuffixText(style.vatRate)}`}
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
    // EXPERIMENTAL rounded-full, 2026-08-10 — see Button.tsx's `base` comment for the revert
    // path. `overflow-hidden` caps the square inner buttons into the pill shape.
    <div className="flex shrink-0 items-center overflow-hidden rounded-full bg-stone-100">
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
