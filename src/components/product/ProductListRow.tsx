import Link from "next/link";
import { backorderLabel, CATEGORY_LABEL, GENDER_LABEL, getStyleImageUrl } from "@/lib/data/styleLabels";
import { formatEUR, getUnitPrice, isOnSale } from "@/lib/pricing";
import { VatSuffix } from "@/components/ui/VatSuffix";
import type { Style } from "@/lib/types";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { StylePlate } from "@/components/product/StylePlate";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { cn } from "@/lib/cn";

export function ProductListRow({
  style,
  totalOnHand,
  priceMultiplier = 1,
  showPricing = true,
  favorited,
  locale = "en",
}: {
  style: Style;
  totalOnHand?: number;
  priceMultiplier?: number;
  /** Set false for anonymous visitors — see the same prop on ProductCard. */
  showPricing?: boolean;
  favorited?: boolean;
  /** Drives price formatting — Greek needs "24,90 €", not "€24.90". */
  locale?: string;
}) {
  // See ProductCard for the same soldOut/madeToOrder split — "Sold out" only when the
  // style genuinely can't be ordered further; zero on-hand with backorders allowed is
  // "Made to order" instead.
  const soldOut = totalOnHand === 0 && !style.allowBackorder;
  const madeToOrder = totalOnHand === 0 && style.allowBackorder;
  const backorderText = backorderLabel(style);
  const lowStock = typeof totalOnHand === "number" && totalOnHand > 0 && totalOnHand <= 10;
  const onSale = isOnSale(style);

  return (
    <Link
      href={`/product/${style.slug}`}
      className="group flex items-center gap-4 border border-stone-300 bg-white p-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-ink sm:gap-5 sm:p-4"
    >
      <div className="relative shrink-0 overflow-hidden">
        <StylePlate
          swatch={style.colorways[0].swatch}
          imageUrl={getStyleImageUrl(style)}
          alt={style.name}
          className={cn("h-20 w-24 sm:h-24 sm:w-32", soldOut && "grayscale")}
          dense
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <AvailabilityBadge style={style} />
          <span className="text-[11px] uppercase tracking-wide text-ink-soft">{CATEGORY_LABEL[style.category]}</span>
          <span className="text-[11px] uppercase tracking-wide text-ink-soft">{GENDER_LABEL[style.gender]}</span>
        </div>
        <h3 className="font-display mt-1 truncate text-base font-bold uppercase leading-tight tracking-tight text-ink group-hover:underline">
          {style.name}
        </h3>
        <p className="font-mono-tab text-xs text-ink-soft">{style.styleNumber} · {style.colorways.length} colorways</p>
        <p className={cn("mt-1 text-xs font-medium", soldOut || lowStock ? "text-ember" : madeToOrder ? "text-ink-soft" : "text-positive")}>
          {soldOut ? "Sold out" : madeToOrder ? backorderText : lowStock ? `Low stock — ${totalOnHand} left` : "In stock"}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 text-right">
        {favorited !== undefined && <FavoriteButton styleId={style.id} initialFavorited={favorited} variant="icon" />}
        {showPricing ? (
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-soft">Wholesale</p>
            <p className="flex items-baseline justify-end gap-1.5">
              <span className={cn("text-lg font-semibold tabular-nums", onSale ? "text-burgundy" : "text-ink")}>
                {formatEUR(getUnitPrice(style, "net60", priceMultiplier), locale)}
                <VatSuffix vatRate={style.vatRate} className="text-xs font-normal text-ink-soft" />
              </span>
              {onSale && (
                <span className="text-xs tabular-nums text-ink-soft line-through">
                  {formatEUR(style.basePrice * priceMultiplier, locale)}
                </span>
              )}
            </p>
          </div>
        ) : (
          <p className="text-[11px] uppercase tracking-wide text-ink-soft">Trade pricing on approval</p>
        )}
      </div>
    </Link>
  );
}
