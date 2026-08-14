import { cn } from "@/lib/cn";

/** Minimal person/account glyph — circle head + shoulder arc, matches the flat
 * unboxed icon language used across the header (search/cart/hamburger). */
export function AccountIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
      <circle cx="12" cy="8" r="3.6" />
      <path strokeLinecap="round" d="M4.5 20.5c0-4.4 3.36-8 7.5-8s7.5 3.6 7.5 8" />
    </svg>
  );
}

/** Minimal closed-padlock glyph. Used in the mobile drawer to mark the routes that need a
 * buyer account (see MainNav) — small and low-contrast on purpose, a hint rather than a
 * warning. Same flat unboxed language as the icons above. */
export function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5", className)} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="5" y="10.5" width="14" height="9.5" rx="1.6" />
      <path strokeLinecap="round" d="M8.5 10.5V7.75a3.5 3.5 0 0 1 7 0v2.75" />
    </svg>
  );
}

/** Minimal shopping-bag glyph for the cart trigger. */
export function CartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-.9 11.2a2 2 0 0 1-2 1.8H8.9a2 2 0 0 1-2-1.8L6 8Z" />
      <path strokeLinecap="round" d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}
