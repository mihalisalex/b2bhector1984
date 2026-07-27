import { cn } from "@/lib/cn";
import type { Availability, PricingTierId } from "@/lib/types";

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

const TIER_STYLE: Record<PricingTierId, string> = {
  standard: "border-cinder-300 bg-stone-100 text-ink-soft",
  preferred: "border-signal/40 bg-signal-100 text-signal-600",
  vip: "border-court/50 bg-court-100 text-ink",
};

const TIER_LABEL: Record<PricingTierId, string> = {
  standard: "Standard",
  preferred: "Preferred",
  vip: "VIP",
};

export function TierBadge({ tier, className }: { tier: PricingTierId; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        TIER_STYLE[tier],
        className,
      )}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}
