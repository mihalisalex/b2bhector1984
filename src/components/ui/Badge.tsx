import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import type { Style } from "@/lib/types";

/** Styles ship in whichever pre-pack box size(s) they're configured for — usually just
 * one (e.g. only 8-pair), occasionally two or three. Buyers need that up front, next to
 * "Available now", since it's the only unit the style actually sells in. */
function boxAssortmentLabel(style: Style): string | null {
  const boxTypes = getAvailableBoxTypes(style);
  if (boxTypes.length === 0) return null;
  return `${boxTypes.map((b) => b.totalPairs).join("/")}-pair assortment`;
}

export function AvailabilityBadge({ style }: { style: Style }) {
  const { availability, shipWindow } = style;
  if (availability === "available") {
    const boxLabel = boxAssortmentLabel(style);
    return (
      <span className="inline-flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-positive">
          <span className="h-1.5 w-1.5 rounded-full bg-positive" aria-hidden />
          Available now
        </span>
        {boxLabel && (
          <span className="pl-2.5 text-[10px] font-medium uppercase tracking-wide text-ink-soft">{boxLabel}</span>
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
      <span className="h-1.5 w-1.5 rounded-full bg-court" aria-hidden />
      Pre-book{shipWindow ? ` — ${shipWindow}` : ""}
    </span>
  );
}
