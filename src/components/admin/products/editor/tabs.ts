/**
 * The product editor's tab list, kept out of `ProductEditorShell` on purpose.
 *
 * The shell is a `"use client"` module, and a plain function exported from one cannot be
 * called by a server component — Next throws "Attempted to call parseTab() from the server
 * but parseTab is on the client" at request time, which no typecheck catches. The page needs
 * `parseTab` to turn `?tab=` into the shell's initial tab, so the shared vocabulary lives
 * here, in a module both sides may import.
 */
export const TABS = [
  "General", "Pricing", "Inventory", "Images & Media", "Variants", "Attributes",
  "Shipping", "SEO", "Related", "Documents", "Visibility", "Analytics",
] as const;

export type Tab = (typeof TABS)[number];

/** Case-insensitive `?tab=` lookup, so any tab can be deep-linked and survive a reload. */
export function parseTab(value: string | undefined): Tab | undefined {
  if (!value) return undefined;
  return TABS.find((t) => t.toLowerCase() === value.toLowerCase());
}
