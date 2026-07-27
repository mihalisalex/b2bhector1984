import Link from "next/link";
import { CATEGORY_LABEL, GENDER_LABEL } from "@/lib/data/styles";
import { formatUSD, getPriceBreakTable } from "@/lib/pricing";
import type { PricingTierId, Style } from "@/lib/types";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { StylePlate } from "@/components/product/StylePlate";

export function ProductCard({ style, tier }: { style: Style; tier: PricingTierId }) {
  const breaks = getPriceBreakTable(style, tier);
  const from = breaks[breaks.length - 1].price;
  const startAt = breaks[0].price;

  return (
    <Link
      href={`/product/${style.slug}`}
      className="group flex flex-col border border-stone-300 bg-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_14px_32px_rgba(26,29,34,0.12)]"
    >
      <div className="overflow-hidden">
        <StylePlate
          swatch={style.colorways[0].swatch}
          styleNumber={style.styleNumber}
          imageUrl={style.primaryImageUrl}
          className="aspect-[4/3] w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          dense
        />
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

        <div className="mt-auto flex items-end justify-between border-t border-stone-200 pt-3">
          <div>
            <p className="font-mono-tab text-[11px] uppercase tracking-wide text-ink-soft">
              {startAt < breaks[0].price ? "As low as" : "Wholesale from"}
            </p>
            <p className="font-mono-tab text-lg font-semibold tabular-nums text-ink">{formatUSD(from)}</p>
          </div>
          <p className="font-mono-tab text-[11px] text-ink-soft">
            Min {style.moqBoxes} box{style.moqBoxes > 1 ? "es" : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}
