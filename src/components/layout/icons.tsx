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

/** Minimal shopping-bag glyph for the cart trigger. */
export function CartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-.9 11.2a2 2 0 0 1-2 1.8H8.9a2 2 0 0 1-2-1.8L6 8Z" />
      <path strokeLinecap="round" d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}
