import { formatDate } from "@/lib/format";
import enDict, { type Dictionary } from "@/i18n/dictionaries/en";
import type { OrderStatus, OrderStatusEvent } from "@/lib/types";

/**
 * `dict`/`locale` default to English so the admin order view — which is English-only and
 * renders this same component — keeps working unchanged without passing anything.
 */
export function StatusTimeline({
  events,
  dict = enDict.dashboard,
  locale = "en",
}: {
  events: OrderStatusEvent[];
  dict?: Dictionary["dashboard"];
  locale?: string;
}) {
  if (events.length === 0) return null;

  const label = (status: OrderStatus): string =>
    ({
      submitted: dict.statusSubmitted,
      confirmed: dict.statusConfirmed,
      in_production: dict.statusInProduction,
      shipped: dict.statusShipped,
      delivered: dict.statusDelivered,
    })[status] ?? status;

  return (
    <ol className="flex flex-col gap-4">
      {events.map((event, i) => (
        <li key={i} className="flex items-start gap-3">
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i === events.length - 1 ? "bg-ink" : "bg-stone-300"}`}
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium text-ink">{label(event.status)}</p>
            <p className="text-xs text-ink-soft">{formatDate(event.changedAt, locale)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
