import { cn } from "@/lib/cn";

export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    // Inline at every width — stacking "Footwear" under "Hector" on mobile (tried
    // previously) read wrong. Instead both words scale down below `sm`, since the header
    // it sits in there now groups the logo with the hamburger rather than centering it —
    // a narrower wordmark just leaves more breathing room, not a collision fix on its own.
    <span className={cn("flex items-baseline gap-1.5 sm:gap-2", className)}>
      <span
        className={cn(
          "font-display text-base font-bold uppercase leading-none tracking-[0.06em] sm:text-[23px] sm:tracking-[0.08em]",
          inverted ? "text-white" : "text-ink",
        )}
      >
        Hector
      </span>
      <span
        className={cn(
          "font-display text-[8px] font-normal uppercase leading-none tracking-[0.14em] sm:text-[11px] sm:tracking-[0.18em]",
          inverted ? "text-stone-300" : "text-ink-soft",
        )}
      >
        Footwear
      </span>
    </span>
  );
}
