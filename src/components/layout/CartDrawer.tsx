"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-context";
import { getBoxType } from "@/lib/data/boxTypes";
import { getStyleImageUrl } from "@/lib/data/styleLabels";

import { CartIcon } from "@/components/layout/icons";
import { StylePlate } from "@/components/product/StylePlate";
import { LinkButton } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { cn } from "@/lib/cn";
import { useI18n, useFormat } from "@/i18n/I18nProvider";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";

/**
 * The cart icon used to be a plain `<Link href="/cart">` — one click and the whole page
 * navigated away. It now opens a preview panel in place, mirroring `MainNav`'s drawer
 * (same portal/backdrop/focus-trap/Escape pattern) but sliding in from the right, under
 * the icon that opened it, instead of the left. Reviewing or clearing a line no longer
 * costs a full page load; getting to the real cart — for quantity edits and
 * checkout — is one press of "Go to cart" away, same destination as before.
 */
export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const { lines, unavailableLines, itemCount, removeStyle, cartTotal, cartVatTotal, cartGrandTotal } = useCart();
  const { getStyleById } = useCatalog();
  const { locale, dict } = useI18n();
  const { eur } = useFormat();
  const cart = dict.cart;

  useFocusTrap(dialogRef, open);

  // Portal target isn't available during SSR; the drawer renders after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Close on navigation — covers both "Go to cart" and any product link inside the
  // panel, neither of which needs its own onClick since the route change does it.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // A style archived or deleted after it was added can't be rendered (no colorways/price
  // to show) — same guard CartView uses. Grouped by style so one card covers every
  // colorway/box line for that product, which is what the full cart page also does.
  const sellableLines = useMemo(() => lines.filter((l) => getStyleById(l.styleId)), [lines, getStyleById]);
  const styleIds = useMemo(() => Array.from(new Set(sellableLines.map((l) => l.styleId))), [sellableLines]);
  const unavailableCount = new Set(unavailableLines.map((l) => l.styleId)).size;

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        aria-label={`${cart.title}, ${itemCount} ${itemCount === 1 ? cart.pair : cart.pairs}`}
        aria-haspopup="dialog"
        aria-expanded={open}
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
      </IconButton>

      {mounted &&
        createPortal(
          <>
            {/* A `fixed` element inside an ancestor with backdrop-blur/filter is clipped to
                that ancestor's box (it becomes the containing block) — portal to <body> so
                the drawer is positioned against the viewport instead. */}
            <div
              className={cn(
                "fixed inset-0 z-50 bg-ink/40 transition-opacity",
                open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
              )}
              onClick={() => setOpen(false)}
              aria-hidden={!open}
            />

            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={cart.title}
              className={cn(
                "fixed inset-y-0 right-0 z-50 flex w-[380px] max-w-[92vw] flex-col overflow-hidden border-l border-stone-300 bg-stone-50 transition-transform duration-300 ease-out",
                open ? "translate-x-0" : "translate-x-full",
              )}
            >
              <div className="flex items-center justify-between border-b border-stone-300 px-5 py-4">
                <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">
                  {cart.title}
                  {itemCount > 0 ? ` · ${itemCount} ${itemCount === 1 ? cart.pair : cart.pairs}` : ""}
                </span>
                <IconButton size="sm" onClick={() => setOpen(false)} aria-label={cart.close}>
                  ✕
                </IconButton>
              </div>

              <div className="scroll-thin flex-1 overflow-y-auto">
                {lines.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                    <p className="font-display text-lg font-bold uppercase tracking-tight text-ink">{cart.empty}</p>
                    <p className="text-sm text-ink-soft">{cart.emptyHint}</p>
                    <LinkButton href={withLocale(locale, "/catalogue")}>{cart.browseCatalogue}</LinkButton>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-stone-200">
                    {styleIds.map((styleId) => {
                      const style = getStyleById(styleId);
                      if (!style) return null;
                      const styleLines = sellableLines.filter((l) => l.styleId === styleId);
                      const styleTotalPairs = styleLines.reduce(
                        (sum, l) => sum + l.qty * getBoxType(l.boxTypeId).totalPairs,
                        0,
                      );
                      return (
                        <div key={styleId} className="flex gap-3 px-5 py-4">
                          <StylePlate
                            swatch={style.colorways[0].swatch}
                            imageUrl={getStyleImageUrl(style)}
                            alt={style.name}
                            className="h-16 w-14 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={withLocale(locale, `/product/${style.slug}`)}
                                className="font-display text-sm font-bold uppercase leading-tight text-ink hover:underline"
                              >
                                {style.name}
                              </Link>
                              <button
                                type="button"
                                onClick={() => removeStyle(styleId)}
                                aria-label={`${cart.remove} ${style.name}`}
                                className="shrink-0 text-ink-soft hover:text-ember"
                              >
                                ✕
                              </button>
                            </div>
                            <p className="font-mono-tab text-[11px] text-ink-soft">
                              {styleTotalPairs} {styleTotalPairs === 1 ? cart.pair : cart.pairs}
                            </p>
                            <ul className="mt-1.5 flex flex-col gap-0.5">
                              {styleLines.map((l) => {
                                const colorway = style.colorways.find((c) => c.id === l.colorwayId);
                                const box = getBoxType(l.boxTypeId);
                                return (
                                  <li key={`${l.colorwayId}-${l.boxTypeId}`} className="text-xs text-ink-soft">
                                    {colorway?.name ?? l.colorwayId} · {box.label} × {l.qty}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {unavailableCount > 0 && (
                  <div className="border-t border-ember/30 bg-ember-100 px-5 py-3">
                    <p className="text-xs font-semibold text-ember">
                      {unavailableCount === 1 ? cart.unavailableNoticeSingular : cart.unavailableNoticePlural}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-soft">
                      {unavailableCount === 1 ? cart.unavailableHintSingular : cart.unavailableHintPlural}
                    </p>
                  </div>
                )}
              </div>

              {lines.length > 0 && (
                <div className="border-t border-stone-300 bg-white px-5 py-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{cart.cartTotal}</span>
                    <span className="text-lg font-semibold tabular-nums text-ink">{eur(cartTotal)}</span>
                  </div>
                  {cartVatTotal > 0 && (
                    <p className="text-right text-[11px] text-ink-soft">
                      {t(cart.plusVatTotal, { vat: eur(cartVatTotal), total: eur(cartGrandTotal) })}
                    </p>
                  )}
                  <LinkButton href={withLocale(locale, "/cart")} size="lg" className="mt-3 w-full justify-center">
                    {cart.goToCart}
                  </LinkButton>
                </div>
              )}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
