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
 * safe here since neither variant sets a `bg-*` utility for an addition to collide with;
 * `cn` is plain `clsx` with no Tailwind conflict resolution (see MarketingHeader's note),
 * so don't use `className` to override a property either variant already sets.
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

const base =
  "relative flex shrink-0 items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none";

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
