"use client";

import { useColorwaySelection } from "@/lib/colorway-selection-context";
import type { StyleInventory } from "@/lib/data/inventory";
import type { Style } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Colorway swatches, driven by the shared `ColorwaySelectionProvider` so every instance
 * on the page stays in sync with the gallery.
 *
 * Rendered twice by design: directly under the gallery on mobile, and inside the buy box
 * on desktop. On a phone the buy box sits a full screen below the image, so tapping a
 * swatch there changed a photo the buyer couldn't see — the selector has to be adjacent
 * to the thing it changes.
 */
export function ColorwayPicker({
  style,
  inventory,
  className,
}: {
  style: Style;
  inventory: StyleInventory;
  className?: string;
}) {
  const { colorwayId, setColorwayId } = useColorwaySelection();
  if (style.colorways.length < 2) return null;

  const selected = style.colorways.find((c) => c.id === colorwayId) ?? style.colorways[0];

  return (
    <div className={className}>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Colorway</span>
        <span className="text-sm font-medium text-ink">{selected.name}</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {style.colorways.map((c) => {
          const stocked = Object.values(inventory[c.id] ?? {}).some((n) => (n ?? 0) > 0);
          const isSelected = c.id === colorwayId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setColorwayId(c.id)}
              aria-label={stocked ? c.name : `${c.name}, out of stock`}
              aria-pressed={isSelected}
              title={c.name}
              className={cn(
                // Generous hit area: 48px target, comfortable one-handed on a phone.
                "relative flex h-12 w-12 items-center justify-center transition-transform duration-150 active:scale-95",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 overflow-hidden rounded-full transition-all duration-200",
                  isSelected
                    ? "ring-2 ring-ink ring-offset-2 ring-offset-white"
                    : "ring-1 ring-cinder-300/60 hover:ring-ink/40",
                  !stocked && "opacity-35",
                )}
              >
                <span aria-hidden className="h-full w-1/2" style={{ background: c.swatch[0] }} />
                <span aria-hidden className="h-full w-1/2" style={{ background: c.swatch[1] ?? c.swatch[0] }} />
              </span>
              {!stocked && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute h-[1px] w-9 rotate-45 bg-ink/70"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
