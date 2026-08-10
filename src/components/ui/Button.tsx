import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink/85 hover:shadow-[0_6px_18px_rgba(26,29,34,0.22)] active:bg-ink/95 active:shadow-none active:translate-y-px",
  secondary: "bg-transparent text-ink border border-ink hover:bg-ink hover:text-white",
  ghost: "bg-transparent text-ink hover:bg-stone-200",
  danger: "bg-transparent text-ember border border-ember hover:bg-ember hover:text-white",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-sm px-6 py-3.5 gap-2",
};

// EXPERIMENTAL — rounded-full sitewide, flipped on 2026-08-10 at the user's explicit
// request to see the whole app rounded before deciding ("i might go back again to sharp").
// This is the ONE line to revert everything back to the sharp-cornered rule the rest of the
// design-system memory documents as settled — change `rounded-full` back to nothing (or
// delete the line) and every Button/LinkButton call site reverts with it. Steppers and a
// few bespoke Add-to-cart buttons that don't route through this component were rounded
// separately (QuickAdd.tsx, PrimaryPurchasePanel.tsx, OrderableLinesheet.tsx, CartView.tsx)
// and need their own reverts if this goes back — see the same date's comment in each.
const base =
  "inline-flex items-center justify-center rounded-full font-medium uppercase tracking-wide transition-all duration-200 ease-out disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

/**
 * The same class recipe `Button`/`LinkButton` render, exposed for the handful of spots that
 * can't use either component directly — a plain `<a>` triggering a file download (not a
 * `next/link` navigation) or a custom interactive control that owns its own element but
 * wants to *look* like a button. Keeps every button-shaped thing on one recipe instead of
 * each call site hand-copying `Button`'s classes and drifting from it over time.
 */
export function buttonClassNames(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <button className={cn(base, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}>
      {children}
    </Link>
  );
}
