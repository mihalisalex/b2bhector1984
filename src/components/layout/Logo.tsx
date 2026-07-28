import { cn } from "@/lib/cn";

export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "font-display flex h-8 w-8 shrink-0 items-center justify-center text-[19px] font-bold",
          inverted ? "bg-white text-ink" : "bg-ink text-white",
        )}
        aria-hidden
      >
        H
      </span>
      <span
        className={cn(
          "font-display text-[19px] font-bold uppercase leading-none tracking-[0.08em]",
          inverted ? "text-white" : "text-ink",
        )}
      >
        Hector
      </span>
    </span>
  );
}
