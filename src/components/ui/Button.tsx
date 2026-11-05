import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink/80",
  secondary: "bg-transparent text-ink border border-ink hover:bg-ink hover:text-white",
  ghost: "bg-transparent text-ink hover:bg-stone-200",
  danger: "bg-transparent text-ember border border-ember hover:bg-ember hover:text-white",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-[11px] px-4 py-2 gap-1.5",
  md: "text-xs px-6 py-3 gap-2",
  lg: "text-xs px-9 py-4 gap-2",
};

// Square corners, small tracked capitals (2026-11-05, ends the rounded experiment of 2026-08-10).
const base =
  "inline-flex items-center justify-center font-medium uppercase tracking-[0.14em] transition-colors duration-300 ease-out disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

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
