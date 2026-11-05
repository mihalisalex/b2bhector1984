/**
 * Estimated arrival for a new order.
 *
 * The latest an order can be ready. `productionLeadTimeDays` (set in /admin, 50 today) is the
 * owner's outer limit including transport, not the usual time, which is 30 to 45 days. Only
 * orders already in production quote a date, as "at the latest": before that the buyer
 * chooses when they want delivery within the season (owner, 2026-11-05).
 */
export function estimatedArrivalIso(leadTimeDays: number, now: Date = new Date()): string {
  const arrival = new Date(now.getTime() + leadTimeDays * 24 * 60 * 60 * 1000);
  return arrival.toISOString().slice(0, 10);
}
