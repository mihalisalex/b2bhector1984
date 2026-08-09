import { cn } from "@/lib/cn";

/**
 * Shared split-swatch colorway button — `ProductCard`'s card-grid picker and
 * `ColorwayPicker`'s sticky-bar picker were two hand-rolled copies of the same ring/
 * hover/out-of-stock-stripe treatment, drifted slightly apart (different ring-offset,
 * different unselected ring color, only one had `active:scale-95`). One implementation now;
 * `size` stays a prop, not collapsed to one constant — the grid card is deliberately denser
 * (`sm`) than the roomier sticky bar (`md`), a real density difference, not drift.
 */
export function ColorSwatchButton({
  swatch,
  selected,
  stocked = true,
  label,
  onClick,
  size = "md",
  className,
}: {
  swatch: [string, string?];
  selected: boolean;
  /** Omit when stock isn't known in this context (defaults to true — no out-of-stock strike). */
  stocked?: boolean;
  /** Precomputed accessible label — callers vary in what they append (backorder text, "out of stock"). */
  label: string;
  onClick: () => void;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={cn(
        "relative flex items-center justify-center transition-transform duration-150 active:scale-95",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 overflow-hidden rounded-full transition-all duration-200",
          selected ? "ring-2 ring-ink ring-offset-2 ring-offset-white" : "ring-1 ring-cinder-300/60 hover:ring-ink/40",
          !stocked && "opacity-35",
        )}
      >
        <span aria-hidden className="h-full w-1/2" style={{ background: swatch[0] }} />
        <span aria-hidden className="h-full w-1/2" style={{ background: swatch[1] ?? swatch[0] }} />
      </span>
      {!stocked && <span aria-hidden className="pointer-events-none absolute h-[1px] w-5 rotate-45 bg-ink/70" />}
    </button>
  );
}
