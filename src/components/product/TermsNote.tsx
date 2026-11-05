"use client";

import { useBuyerTerms } from "@/lib/cart-context";
import { useI18n } from "@/i18n/I18nProvider";
import { t } from "@/i18n/format";
import { TERMS_DISCOUNT } from "@/lib/pricing";
import { cn } from "@/lib/cn";

/**
 * Says which payment terms the prices on screen are at. The choice itself is made once, at
 * checkout: prices follow the account's own terms until then, so a buyer browsing the
 * catalogue has one number to read instead of a switch to work out first.
 */
export function TermsNote({ className }: { className?: string }) {
  const terms = useBuyerTerms();
  const c = useI18n().dict.checkout;
  const label = terms === "prepay" ? c.termsPrepay : terms === "net30" ? c.termsNet30 : c.termsNet60;
  const discount = Math.round(TERMS_DISCOUNT[terms] * 100);
  return (
    <p className={cn("text-xs text-ink-soft", className)}>
      {t(c.termsNote, { terms: discount > 0 ? `${label} −${discount}%` : label })}
    </p>
  );
}
