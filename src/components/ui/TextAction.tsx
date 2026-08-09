import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "neutralDanger" | "danger" | "accent";

const TONE_CLASSES: Record<Tone, string> = {
  /** Quiet default action (Continue shopping, Details, Edit, Set default). */
  neutral: "text-ink-soft hover:text-ink",
  /** Quiet by default, but its outcome is destructive (Empty cart). */
  neutralDanger: "text-ink-soft hover:text-ember",
  /** Always reads as destructive (Remove, Delete). */
  danger: "text-ember hover:underline",
  /** The site's link accent — a secondary "go here" action (Reorder, Load into cart). */
  accent: "text-signal hover:underline",
};

const base = "text-xs font-semibold uppercase tracking-wide transition-colors disabled:opacity-40 disabled:pointer-events-none";

/**
 * Every small inline text action across the app (Remove/Edit/Delete/Reorder/Load into
 * cart/Continue shopping/…) was hand-copying some near-variant of
 * `text-xs font-semibold uppercase tracking-wide text-{tone} hover:{…}` — several had
 * drifted (one `font-medium` instead of `font-semibold`, a couple missing
 * `uppercase tracking-wide` entirely). One recipe now, picked by `tone` + optional
 * always-on `underline` (the one genuine exception — `SaveAssortmentButton`'s trigger reads
 * as an underlined utility link, not a plain hover action).
 */
export function TextAction({
  tone = "neutral",
  underline,
  className,
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; underline?: boolean; children: ReactNode }) {
  return (
    <button type={type} className={cn(base, TONE_CLASSES[tone], underline && "underline underline-offset-2", className)} {...props}>
      {children}
    </button>
  );
}

export function TextActionLink({
  href,
  tone = "neutral",
  underline,
  className,
  children,
}: {
  href: string;
  tone?: Tone;
  underline?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, TONE_CLASSES[tone], underline && "underline underline-offset-2", className)}>
      {children}
    </Link>
  );
}

/** For the rare spot that can't render `TextAction` directly (a caller-supplied
 * `className` override prop on a component that owns its own `<button>`, e.g.
 * `ReorderButton`/`LoadAssortmentButton`) — same recipe as `buttonClassNames` does for `Button`. */
export function textActionClassNames(tone: Tone = "accent", underline?: boolean, className?: string) {
  return cn(base, TONE_CLASSES[tone], underline && "underline underline-offset-2", className);
}
