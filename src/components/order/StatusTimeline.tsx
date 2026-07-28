import { formatDate } from "@/lib/format";
import type { OrderStatus, OrderStatusEvent } from "@/lib/types";

const STATUS_LABEL: Record<OrderStatus, string> = {
  submitted: "Submitted",
  confirmed: "Confirmed",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
};

export function StatusTimeline({ events }: { events: OrderStatusEvent[] }) {
  if (events.length === 0) return null;
  return (
    <ol className="flex flex-col gap-4">
      {events.map((event, i) => (
        <li key={i} className="flex items-start gap-3">
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i === events.length - 1 ? "bg-ink" : "bg-stone-300"}`}
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium text-ink">{STATUS_LABEL[event.status] ?? event.status}</p>
            <p className="text-xs text-ink-soft">{formatDate(event.changedAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
