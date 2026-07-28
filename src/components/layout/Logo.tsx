import { cn } from "@/lib/cn";

export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-baseline gap-2", className)}>
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
