import { formatDayMonth } from "@/lib/format";
import { t } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { OrderStatus, OrderStatusEvent } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * The buyer's order journey as five steps: request → confirmed & invoiced → production →
 * handed to their courier → delivered. It is how the business actually works (owner,
 * 2026-09-25): a site order is a request, the invoice with payment details follows within
 * a day, every order is produced for the buyer, and the buyer's own courier collects.
 *
 * Two uses: at checkout (`status` omitted) it previews the steps with estimates; on an
 * order page it lights the current step and fills in real dates from the status history.
 * Horizontal from `sm`, a vertical list on phones. Server component — no hooks.
 */
type Step = { key: "request" | "confirm" | "production" | "shipped" | "delivered"; label: string; note?: string };

const STEP_FOR_STATUS: Record<Exclude<OrderStatus, "cancelled">, number> = {
  submitted: 0,
  confirmed: 1,
  in_production: 2,
  shipped: 3,
  delivered: 4,
};

export function OrderJourney({
  dict,
  locale,
  leadTimeDays,
  arrivalIso,
  status,
  events = [],
  className,
}: {
  dict: Dictionary["dashboard"];
  locale: string;
  leadTimeDays: number;
  /** Estimated arrival (ISO date) — for an existing order, counted from its confirmation. */
  arrivalIso: string;
  /** Omit for the checkout preview. */
  status?: OrderStatus;
  events?: OrderStatusEvent[];
  className?: string;
}) {
  if (status === "cancelled") {
    return <p className={cn("text-sm text-ink-soft", className)}>{dict.journeyCancelled}</p>;
  }

  const reachedAt = (s: OrderStatus) => events.find((e) => e.status === s)?.changedAt;
  const dated = (s: OrderStatus, fallback?: string) => {
    const at = reachedAt(s);
    return at ? formatDayMonth(at, locale) : fallback;
  };

  const steps: Step[] = [
    { key: "request", label: dict.journeyRequest, note: dated("submitted", dict.journeyRequestNote) },
    { key: "confirm", label: dict.journeyConfirm, note: dated("confirmed", dict.journeyConfirmNote) },
    { key: "production", label: dict.journeyProduction, note: dated("in_production", t(dict.journeyProductionNote, { days: leadTimeDays })) },
    { key: "shipped", label: dict.journeyShipped, note: dated("shipped", t(dict.journeyShippedNote, { date: formatDayMonth(arrivalIso, locale) })) },
    { key: "delivered", label: dict.journeyDelivered, note: dated("delivered") },
  ];
  // At checkout nothing has happened yet, so no step is lit.
  const current = status ? STEP_FOR_STATUS[status] : -1;

  return (
    <ol className={cn("grid grid-cols-1 gap-0 sm:grid-cols-5", className)}>
      {steps.map((step, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li
            key={step.key}
            aria-current={now ? "step" : undefined}
            className="relative pb-4 pl-7 sm:pb-0 sm:pl-0 sm:pr-3 sm:pt-6"
          >
            {/* connector: vertical on phones, horizontal from sm */}
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[5px] top-3 h-full w-0.5 sm:left-3 sm:top-[5px] sm:h-0.5 sm:w-full",
                  done ? "bg-positive" : "bg-stone-300",
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                "absolute left-0 top-0.5 h-3 w-3 rounded-full border-2 sm:top-0",
                done ? "border-positive bg-positive" : now ? "border-burgundy bg-burgundy" : "border-stone-400 bg-white",
              )}
            />
            <p className={cn("text-sm font-semibold leading-snug", now ? "text-burgundy" : "text-ink")}>
              {step.label}
              {now && <span className="sr-only"> ({dict.journeyCurrent})</span>}
            </p>
            {step.note && <p className="mt-0.5 text-xs leading-snug text-ink-soft">{step.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}
