"use client";

import { updateInventoryLevelAction } from "@/lib/adminActions";
import type { BoxTypeId } from "@/lib/types";

export function InventoryLevelInput({
  styleId,
  colorwayId,
  boxTypeId,
  onHand,
}: {
  styleId: string;
  colorwayId: string;
  boxTypeId: BoxTypeId;
  onHand: number;
}) {
  return (
    <form action={updateInventoryLevelAction.bind(null, styleId)} className="inline-flex">
      <input type="hidden" name="colorwayId" value={colorwayId} />
      <input type="hidden" name="boxTypeId" value={boxTypeId} />
      <input
        name="onHand"
        type="number"
        min={0}
        defaultValue={onHand}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="font-mono-tab w-16 border border-stone-300 bg-white px-2 py-1 text-right text-sm outline-none focus-visible:border-signal"
      />
    </form>
  );
}
