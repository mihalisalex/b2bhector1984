"use client";

import { useColorwaySelection } from "@/lib/colorway-selection-context";
import type { StyleInventory } from "@/lib/data/inventory";
import type { Style } from "@/lib/types";
import { ColorSwatchButton } from "@/components/product/ColorSwatchButton";
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
        return (
          <ColorSwatchButton
            key={c.id}
            swatch={c.swatch}
            selected={c.id === colorwayId}
            stocked={stocked}
            label={stocked ? c.name : `${c.name}, out of stock`}
            onClick={() => setColorwayId(c.id)}
          />
        );
      })}
    </div>
  );
}
