"use client";

import { useColorwaySelection } from "@/lib/colorway-selection-context";
import type { StyleInventory } from "@/lib/data/inventory";
import type { Style } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Colorway swatches for the sticky purchase bar, driven by the shared
 * `ColorwaySelectionProvider` so a tap here updates the gallery photo above it.
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

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
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
            className="relative flex h-9 w-9 items-center justify-center transition-transform duration-150 active:scale-95"
          >
            <span
              className={cn(
                "flex h-6 w-6 overflow-hidden rounded-full transition-all duration-200",
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
              <span aria-hidden className="pointer-events-none absolute h-[1px] w-6 rotate-45 bg-ink/70" />
            )}
          </button>
        );
      })}
    </div>
  );
}
