"use client";

import { updateOrderStatus } from "@/lib/adminActions";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["submitted", "confirmed", "in_production", "shipped", "delivered"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  submitted: "Submitted",
  confirmed: "Confirmed",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
};

export function OrderStatusForm({ orderId, status }: { orderId: string; status: OrderStatus }) {
  return (
    <form action={updateOrderStatus.bind(null, orderId)}>
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
  );
}
