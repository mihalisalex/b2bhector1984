"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORY_LABEL, GENDER_LABEL, getStyleImageUrl } from "@/lib/data/styleLabels";
import { formatEUR, getUnitPrice, isOnSale } from "@/lib/pricing";
import { VatSuffix } from "@/components/ui/VatSuffix";
import type { Style } from "@/lib/types";
import type { StyleInventory } from "@/lib/data/inventory";
import type { StyleImage } from "@/lib/data/styleImages";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { StylePlate } from "@/components/product/StylePlate";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { QuickAdd } from "@/components/product/QuickAdd";
import { pickDefaultColorway } from "@/lib/productSelectionDefaults";
import { cn } from "@/lib/cn";

/**
 * Card root is a plain container, not a single wrapping `<Link>`: the card carries real
 * controls (favorite, colour swatches, quick add) and buttons nested inside an anchor are
 * invalid HTML and unusable with a keyboard or screen reader. The image and the title are
 * each their own link to the product; the image one is hidden from assistive tech so the
 * card exposes a single accessible destination rather than two identical ones.
 *
 * Client component (not just for `QuickAdd`/`FavoriteButton`): the colour swatches below
 * swap which photo is shown, same as pressing a colour on the product page, so this needs
 * its own local `activeColorwayId` state.
 */
export function ProductCard({
  style,
  totalOnHand,
  priceMultiplier = 1,
  favorited,
  inventory,
  images = [],
  priority = false,
}: {
  style: Style;
  totalOnHand?: number;
  priceMultiplier?: number;
  /** Omit to hide the favorite toggle entirely (e.g. logged-out contexts). */
  favorited?: boolean;
  /** Set on the above-the-fold cards so next/image preloads them instead of lazy-loading.
   * The catalogue's first row is the Largest Contentful Paint element, and lazy-loading it
   * delays LCP by a round trip. */
  priority?: boolean;
  /** Per-colorway/box stock. Omit to hide Quick Add (e.g. marketing surfaces with no cart). */
  inventory?: StyleInventory;
  /** Real per-colorway tagged photos. A colorway with none just keeps showing the
   * style's default photo when selected — same honest fallback as the product gallery. */
  images?: StyleImage[];
}) {
  // "Sold out" only applies when the style truly can't be ordered further; when it can
  // (allowBackorder, the new default), zero on-hand is "Made to order" instead — still
  // purchasable, just not shipping from the shelf. See PrimaryPurchasePanel/QuickAdd for
  // the same distinction applied to the actual add-to-cart controls.
  const soldOut = totalOnHand === 0 && !style.allowBackorder;
  const madeToOrder = totalOnHand === 0 && style.allowBackorder;
  const lowStock = typeof totalOnHand === "number" && totalOnHand > 0 && totalOnHand <= 10;
  const onSale = isOnSale(style);
  const hasMultipleColorways = style.colorways.length > 1;

  const [activeColorwayId, setActiveColorwayId] = useState(() =>
    inventory ? pickDefaultColorway(style, inventory, images) : style.colorways[0].id,
  );
  const activeColorway = style.colorways.find((c) => c.id === activeColorwayId) ?? style.colorways[0];
  const taggedImage = images.find((img) => img.colorwayId === activeColorwayId);
  const imageUrl = taggedImage?.publicUrl ?? getStyleImageUrl(style);

  return (
    <div className="group flex flex-col transition-transform duration-300 ease-out hover:-translate-y-0.5">
      <div className="relative overflow-hidden bg-transparent">
        <Link href={`/product/${style.slug}`} tabIndex={-1} aria-hidden className="block">
          <StylePlate
            key={imageUrl}
            swatch={activeColorway.swatch}
            styleNumber={style.styleNumber}
            imageUrl={imageUrl}
            alt={style.name}
            priority={priority}
            className={cn("aspect-[4/5] w-full transition-transform duration-500 ease-out group-hover:scale-[1.02]", soldOut && "grayscale")}
          />
        </Link>
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5">
          {favorited !== undefined && <FavoriteButton styleId={style.id} initialFavorited={favorited} variant="icon" />}
          {(soldOut || madeToOrder || lowStock || onSale) && (
            <span
              className={cn(
                "px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white",
                soldOut ? "bg-ember" : madeToOrder ? "bg-ink" : lowStock ? "bg-ink" : "bg-ember",
              )}
            >
              {soldOut ? "Sold out" : madeToOrder ? "Made to order" : lowStock ? "Low stock" : "Sale"}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3">
        <AvailabilityBadge style={style} />
        <h3 className="font-display text-base font-bold uppercase leading-tight tracking-tight text-ink">
          <Link href={`/product/${style.slug}`} className="hover:underline">
            {style.name}
          </Link>
        </h3>
        <p className="text-xs uppercase tracking-wide text-ink-soft">
          <span className="font-mono-tab normal-case">{style.styleNumber}</span> · {GENDER_LABEL[style.gender]} ·{" "}
          {CATEGORY_LABEL[style.category]}
        </p>

        <div className="mt-auto border-t border-stone-200 pt-3">
          <p className="text-[11px] uppercase tracking-wide text-ink-soft">Wholesale</p>
          <p className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tabular-nums text-ink">
              {formatEUR(getUnitPrice(style, "net60", priceMultiplier))}
              <VatSuffix vatRate={style.vatRate} className="text-xs font-normal text-ink-soft" />
            </span>
            {onSale && (
              <span className="text-xs tabular-nums text-ink-soft line-through">
                {formatEUR(style.basePrice * priceMultiplier)}
              </span>
            )}
          </p>
        </div>

        {hasMultipleColorways && (
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-soft">
              Colours — <span className="text-ink">{activeColorway.name}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {style.colorways.map((c) => {
                const stocked = inventory ? Object.values(inventory[c.id] ?? {}).some((n) => (n ?? 0) > 0) : true;
                const selected = c.id === activeColorwayId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveColorwayId(c.id);
                    }}
                    aria-label={stocked ? c.name : style.allowBackorder ? `${c.name}, made to order` : `${c.name}, out of stock`}
                    aria-pressed={selected}
                    title={c.name}
                    className="relative flex h-8 w-8 items-center justify-center"
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 overflow-hidden rounded-full transition-all duration-150",
                        selected ? "ring-2 ring-ink ring-offset-1" : "ring-1 ring-stone-300 hover:ring-cinder-300",
                        !stocked && "opacity-35",
                      )}
                    >
                      <span aria-hidden className="h-full w-1/2" style={{ background: c.swatch[0] }} />
                      <span aria-hidden className="h-full w-1/2" style={{ background: c.swatch[1] ?? c.swatch[0] }} />
                    </span>
                    {!stocked && <span aria-hidden className="pointer-events-none absolute h-[1px] w-5 rotate-45 bg-ink/70" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {inventory && (
          <QuickAdd style={style} inventory={inventory} priceMultiplier={priceMultiplier} colorwayId={activeColorwayId} />
        )}
      </div>
    </div>
  );
}
