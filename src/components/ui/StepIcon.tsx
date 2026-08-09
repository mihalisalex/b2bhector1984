/**
 * Shared minus/plus glyph for every quantity stepper (QuickAdd, PrimaryPurchasePanel,
 * OrderableLinesheet, CartView). Both drawn as SVG on the same 16x16 grid rather than text
 * glyphs — pairing a Unicode minus with an ASCII plus renders at visibly different weights
 * and reads as broken (caught and fixed once already, in PrimaryPurchasePanel's stepper;
 * this pulls that fix out so every other stepper gets it too instead of drifting back to
 * "−"/"+" text).
 */
export function StepIcon({ kind, className }: { kind: "minus" | "plus"; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? "h-3.5 w-3.5"} fill="currentColor" aria-hidden>
      <rect x="1.5" y="7.25" width="13" height="1.5" />
      {kind === "plus" && <rect x="7.25" y="1.5" width="1.5" height="13" />}
    </svg>
  );
}
