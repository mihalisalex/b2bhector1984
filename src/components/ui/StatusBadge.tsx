import { cn } from "@/lib/cn";
import type { OrderStatus } from "@/lib/types";

const STATUS: Record<OrderStatus, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "border-cinder-300 bg-stone-100 text-ink-soft" },
  confirmed: { label: "Confirmed", className: "border-signal/40 bg-signal-100 text-signal-600" },
  in_production: { label: "In Production", className: "border-court/50 bg-court-100 text-ink" },
  shipped: { label: "Shipped", className: "border-signal/40 bg-signal-100 text-signal-600" },
  delivered: { label: "Delivered", className: "border-positive/40 bg-positive-100 text-positive" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status];
  return (
    <span className={cn("inline-flex items-center border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", s.className)}>
      {s.label}
    </span>
  );
}
