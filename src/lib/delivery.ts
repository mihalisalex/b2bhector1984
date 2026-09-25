/**
 * Estimated arrival for a new order.
 *
 * Every order is produced for the buyer (owner, 2026-09-25): delivery is about
 * `productionLeadTimeDays` after the order is confirmed, set in /admin. Buyers read a
 * date ("around 14 Nov") faster than a duration ("about 50 days"), so the storefront
 * shows the date.
 *
 * Computed on the server and passed down as an ISO date, so the server render and the
 * browser's hydration always agree — the browser never works out "today" itself.
 */
export function estimatedArrivalIso(leadTimeDays: number, now: Date = new Date()): string {
  const arrival = new Date(now.getTime() + leadTimeDays * 24 * 60 * 60 * 1000);
  return arrival.toISOString().slice(0, 10);
}
