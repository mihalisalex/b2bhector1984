"use client";

import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/i18n/I18nProvider";
import { TERMS_DISCOUNT } from "@/lib/pricing";
import { cn } from "@/lib/cn";
import type { CreditTerms } from "@/lib/types";

const TERMS: CreditTerms[] = ["prepay", "net30", "net60"];

/**
 * Pick the payment terms every price on the site is shown at. Changing it here changes
 * the product page, the catalogue cards, the cart and the checkout together — it is one
 * choice, stored in the cart context (see `terms` in src/lib/cart-context.tsx).
 */
export function TermsSwitch({ className }: { className?: string }) {
  const { terms, setTerms } = useCart();
  const { dict } = useI18n();
  const c = dict.checkout;
  const label = (v: CreditTerms) => (v === "prepay" ? c.termsPrepay : v === "net30" ? c.termsNet30 : c.termsNet60);

  return (
    <div role="radiogroup" aria-label={c.paymentTerms} className={cn("flex overflow-hidden rounded-full border border-stone-300 bg-white", className)}>
      {TERMS.map((value) => {
        const active = value === terms;
        const discount = Math.round(TERMS_DISCOUNT[value] * 100);
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTerms(value)}
            className={cn(
              "flex-1 whitespace-nowrap px-2 py-2 text-xs font-medium tabular-nums transition-colors",
              active ? "bg-ink text-white" : "text-ink-soft hover:bg-stone-100 hover:text-ink",
            )}
          >
            {label(value)}
            {discount > 0 && <span className={active ? "text-white/75" : "text-positive"}> −{discount}%</span>}
          </button>
        );
      })}
    </div>
  );
}
