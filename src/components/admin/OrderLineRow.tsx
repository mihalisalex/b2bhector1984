"use client";

import { updateOrderLineQtyAction, deleteOrderLineAction } from "@/lib/adminActions";
import { formatEUR } from "@/lib/pricing";

export function OrderLineRow({
  orderId,
  lineId,
  styleName,
  colorwayName,
  boxLabel,
  qty,
  unitPrice,
  lineTotal,
  canDelete,
}: {
  orderId: string;
  lineId: string;
  styleName: string;
  colorwayName: string;
  boxLabel: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  canDelete: boolean;
}) {
  return (
    <tr className="border-b border-stone-200 last:border-b-0">
      <td className="px-4 py-2 text-ink">{styleName}</td>
      <td className="px-3 py-2 text-ink-soft">{colorwayName}</td>
      <td className="font-mono-tab px-3 py-2 text-ink-soft">{boxLabel}</td>
      <td className="px-3 py-2 text-right">
        <form action={updateOrderLineQtyAction.bind(null, orderId)} className="flex justify-end">
          <input type="hidden" name="lineId" value={lineId} />
          <input
            name="qty"
            type="number"
            min={1}
            defaultValue={qty}
            onBlur={(e) => e.currentTarget.form?.requestSubmit()}
            className="font-mono-tab w-16 border border-stone-300 bg-white px-2 py-1 text-right text-sm tabular-nums outline-none focus-visible:border-signal"
          />
        </form>
      </td>
      <td className="font-mono-tab px-3 py-2 text-right tabular-nums text-ink-soft">{formatEUR(unitPrice)}</td>
      <td className="font-mono-tab px-4 py-2 text-right font-semibold tabular-nums text-ink">{formatEUR(lineTotal)}</td>
      <td className="px-3 py-2 text-right">
        <form
          action={deleteOrderLineAction.bind(null, orderId, lineId)}
          onSubmit={(e) => {
            if (!confirm("Remove this line item from the order?")) e.preventDefault();
          }}
        >
          <button
            type="submit"
            disabled={!canDelete}
            title={canDelete ? "Remove line" : "An order needs at least one line item"}
            className="text-xs font-medium text-ember hover:underline disabled:cursor-not-allowed disabled:text-ink-soft/40 disabled:no-underline"
          >
            Remove
          </button>
        </form>
      </td>
    </tr>
  );
}
