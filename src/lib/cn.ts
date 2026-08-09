import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Conditional class joining with Tailwind conflict resolution.
 *
 * This was previously plain `clsx`, which concatenates without resolving conflicts: given
 * `cn("px-4", "px-6")` both survived into `class`, and which one actually applied came down
 * to their order in the generated stylesheet — not to the order they were written here.
 * That made a `className` prop an unreliable way to override a component's own base
 * utilities, which is precisely what every component in this codebase invites callers to do
 * (`cn(base, VARIANT, SIZE, className)` — caller last, and expected to win).
 *
 * It had already caused a real bug: `MarketingHeader` documents having to wrap a
 * `LinkButton` in a `<div className="hidden lg:block">` because passing `hidden` to the
 * button itself raced `inline-flex` from its own base classes. That workaround is still in
 * place and still correct — `twMerge` resolves `display` conflicts now, but the wrapper is
 * also just clearer about intent, so this change deliberately doesn't go rewriting existing
 * call sites.
 *
 * `twMerge` only rewrites *conflicting* Tailwind utilities (last one wins) and passes
 * everything else — arbitrary values, `font-mono-tab`, `scroll-thin`, and the other custom
 * classes in `globals.css` — through untouched.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
