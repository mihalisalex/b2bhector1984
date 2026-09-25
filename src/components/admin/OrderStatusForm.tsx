"use client";

import { useActionState } from "react";
import { updateOrderStatus } from "@/lib/adminActions";
import type { FormState } from "@/lib/actions";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["submitted", "confirmed", "in_production", "shipped", "delivered", "cancelled"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  submitted: "Submitted",
  confirmed: "Confirmed",
  in_production: "In Production",
  shipped: "Handed to courier",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const initialState: FormState = {};

export function OrderStatusForm({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [state, formAction] = useActionState(updateOrderStatus.bind(null, orderId), initialState);

  return (
    <div>
      <form action={formAction}>
        <select
          name="status"
          defaultValue={status}
          aria-label="Order status"
          onChange={(e) => {
            // Cancelling returns the order's stock and can't be undone — one stray pick in a
            // select that submits on change shouldn't be enough.
            if (
              e.currentTarget.value === "cancelled" &&
              !window.confirm("Cancel this order? Its stock goes back on the shelf and the order can't be reopened.")
            ) {
              e.currentTarget.value = status;
              return;
            }
            e.currentTarget.form?.requestSubmit();
          }}
          className="font-mono-tab border border-stone-300 bg-white px-2 py-1.5 text-xs outline-none focus-visible:border-signal"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </form>
      {state.error && <p className="mt-1 max-w-[220px] text-[11px] text-ember">{state.error}</p>}
    </div>
  );
}
