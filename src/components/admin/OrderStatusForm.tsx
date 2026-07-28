"use client";

import { useActionState } from "react";
import { updateOrderStatus } from "@/lib/adminActions";
import type { FormState } from "@/lib/actions";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["submitted", "confirmed", "in_production", "shipped", "delivered"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  submitted: "Submitted",
  confirmed: "Confirmed",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
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
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
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
