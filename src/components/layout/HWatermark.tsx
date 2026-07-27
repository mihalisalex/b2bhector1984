import { cn } from "@/lib/cn";

/**
 * Oversized, blurred "H" used as a recurring brand mark behind chrome (nav
 * drawer, headers) — same device at different scales so the brand reads
 * consistently without competing with foreground content.
 */
export function HWatermark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "font-display pointer-events-none absolute select-none font-bold leading-none text-ink blur-xl",
        className,
      )}
    >
      H
    </span>
  );
}
