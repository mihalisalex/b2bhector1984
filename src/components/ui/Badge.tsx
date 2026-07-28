import type { Availability } from "@/lib/types";

export function AvailabilityBadge({ availability, shipWindow }: { availability: Availability; shipWindow?: string }) {
  if (availability === "available") {
    return (
      <span className="inline-flex items-center gap-1.5 border border-positive/30 bg-positive-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-positive">
        <span className="h-1.5 w-1.5 rounded-full bg-positive" aria-hidden />
        Available now
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 border border-court/40 bg-court-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink">
      <span className="h-1.5 w-1.5 rounded-full bg-court" aria-hidden />
      Pre-book{shipWindow ? ` — ${shipWindow}` : ""}
    </span>
  );
}
