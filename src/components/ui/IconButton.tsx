import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "chrome" | "bordered";
type Size = "sm" | "md" | "lg";

/**
 * "chrome" = sits directly on header/drawer/overlay chrome, no border of its own (account,
 * cart, search triggers; drawer/overlay close ✕). "bordered" = stands alone on a photo or
 * white card and needs a visible edge to read as a control (share, favorite-icon-on-card).
 * Extend via `className` for a variant-specific tweak (e.g. favorite's overlay backdrop) —
 * `cn` resolves Tailwind conflicts (via `tailwind-merge`), so a caller's `className` reliably
 * overrides a property either variant already sets, last-one-wins.
 */
const VARIANT_CLASSES: Record<Variant, string> = {
  chrome: "text-ink hover:text-signal",
  bordered: "border border-stone-300 text-ink hover:border-ink",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-12 w-12",
};

// EXPERIMENTAL — rounded-full, same 2026-08-10 flip as Button.tsx's `base`; see that file's
// comment for the revert path. Turns the "bordered" variant into a circle (share, favorite);
// "chrome" has no visible box either way so the shape doesn't show, but it inherits the same
// class so nothing here quietly reverts on its own.
/**
 * The `after:` block is a touch target, not decoration. Measured on the live site at 375px,
 * every one of these rendered 36x36 — under the 44x44 that both Apple's HIG and WCAG 2.5.5
 * ask for, on the controls a phone user hits most (menu, search, account, cart).
 *
 * It expands the *hit area* rather than the button, because the visual size is load-bearing:
 * the mobile header's spacing took three passes to settle, and growing these boxes by 8px
 * would reopen it. A centred 44x44 pseudo-element gives the finger a bigger goal while the
 * eye sees exactly what it saw before. Inert at `lg` (48px), which already clears the bar.
 */
const base =
  "relative flex shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 disabled:pointer-events-none " +
  "after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']";

/** Shared square icon-only button — every standalone icon trigger/close control (account,
 * cart, search, drawer/overlay close, share, favorite) renders through this one recipe
 * instead of each hand-copying `flex h-9 w-9 items-center justify-center ...`. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; children: ReactNode }
>(function IconButton({ variant = "chrome", size = "md", className, children, type = "button", ...props }, ref) {
  return (
    <button ref={ref} type={type} className={cn(base, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)} {...props}>
      {children}
    </button>
  );
});
