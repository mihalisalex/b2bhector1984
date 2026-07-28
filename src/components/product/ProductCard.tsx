import Link from "next/link";
import { CATEGORY_LABEL, GENDER_LABEL, getStyleImageUrl } from "@/lib/data/styles";
import { formatEUR } from "@/lib/pricing";
import type { Style } from "@/lib/types";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { StylePlate } from "@/components/product/StylePlate";
import { cn } from "@/lib/cn";

export function ProductCard({ style, totalOnHand }: { style: Style; totalOnHand?: number }) {
  const soldOut = totalOnHand === 0;
  const lowStock = typeof totalOnHand === "number" && totalOnHand > 0 && totalOnHand <= 10;

  return (
    <Link
      href={`/product/${style.slug}`}
      className="group flex flex-col border border-stone-300 bg-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_14px_32px_rgba(26,29,34,0.12)]"
    >
      <div className="relative overflow-hidden">
        <StylePlate
          swatch={style.colorways[0].swatch}
          styleNumber={style.styleNumber}
          imageUrl={getStyleImageUrl(style)}
          alt={style.name}
          className={cn(
            "aspect-[4/3] w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]",
            soldOut && "grayscale",
          )}
          dense
        />
        {(soldOut || lowStock) && (
          <span
            className={cn(
              "absolute right-2 top-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white",
              soldOut ? "bg-ember" : "bg-ink",
            )}
          >
            {soldOut ? "Sold out" : "Low stock"}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <AvailabilityBadge availability={style.availability} shipWindow={style.shipWindow} />
          <span className="text-[11px] uppercase tracking-wide text-ink-soft">
            {CATEGORY_LABEL[style.category]}
          </span>
        </div>
        <h3 className="font-display text-base font-bold uppercase leading-tight tracking-tight text-ink group-hover:underline">
          {style.name}
        </h3>
        <p className="text-xs text-ink-soft">{GENDER_LABEL[style.gender]} · {style.colorways.length} colorways</p>

        <div className="mt-1 flex items-center gap-1.5">
          {style.colorways.slice(0, 4).map((c) => (
            <span key={c.id} className="flex h-4 w-6 overflow-hidden border border-stone-300">
              <span className="h-full w-1/2" style={{ background: c.swatch[0] }} />
              <span className="h-full w-1/2" style={{ background: c.swatch[1] ?? c.swatch[0] }} />
            </span>
          ))}
        </div>

        <div className="mt-auto border-t border-stone-200 pt-3">
          <p className="font-mono-tab text-[11px] uppercase tracking-wide text-ink-soft">Wholesale</p>
          <p className="font-mono-tab text-lg font-semibold tabular-nums text-ink">{formatEUR(style.basePrice)}</p>
        </div>
      </div>
    </Link>
  );
}
