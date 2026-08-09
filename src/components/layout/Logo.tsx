import { cn } from "@/lib/cn";

export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    // Stacked below `sm` — inline "Hector Footwear" is wide enough that on a narrow phone
    // (or once a signed-in header adds a cart icon next to the account icon) it can run
    // into the header's right-hand icon cluster. Stacking "Footwear" under "Hector" keeps
    // the centered logo's footprint narrow regardless of screen width or icon count; back
    // to the original inline wordmark from `sm:` up, where there's always been room.
    <span className={cn("flex flex-col items-center gap-0.5 sm:flex-row sm:items-baseline sm:gap-2", className)}>
      <span
        className={cn(
          "font-display text-[23px] font-bold uppercase leading-none tracking-[0.08em]",
          inverted ? "text-white" : "text-ink",
        )}
      >
        Hector
      </span>
      <span
        className={cn(
          "font-display text-[11px] font-normal uppercase leading-none tracking-[0.18em]",
          inverted ? "text-stone-300" : "text-ink-soft",
        )}
      >
        Footwear
      </span>
    </span>
  );
}
