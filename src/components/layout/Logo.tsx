import { cn } from "@/lib/cn";

export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "font-mono-tab flex h-8 w-8 items-center justify-center text-[11px] font-semibold",
          inverted ? "bg-white text-ink" : "bg-ink text-white",
        )}
        aria-hidden
      >
        84
      </span>
      <span
        className={cn(
          "font-display text-[17px] font-bold uppercase leading-none tracking-tight",
          inverted ? "text-white" : "text-ink",
        )}
      >
        Hector <span className={inverted ? "text-stone-300" : "text-cinder"}>1984</span>
      </span>
    </span>
  );
}
