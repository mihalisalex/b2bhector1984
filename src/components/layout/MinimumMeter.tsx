"use client";

import Link from "next/link";
import { useOptionalCart } from "@/lib/cart-context";
import { useI18n } from "@/i18n/I18nProvider";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";
import { MIN_ORDER_PAIRS } from "@/lib/pricing";
import { cn } from "@/lib/cn";

/**
 * Progress toward the order minimum, in the header of every signed-in page.
 *
 * The minimum is the first thing that stops a new buyer, and it used to appear only on the
 * product panel and in the cart. Hidden while the cart is empty (nothing to measure) and for
 * visitors (no cart at all).
 */
function useMeter() {
  const cart = useOptionalCart();
  if (!cart || cart.itemCount === 0) return null;
  const min = cart.minOrderPairs ?? MIN_ORDER_PAIRS;
  const count = cart.itemCount;
  return { count, min, done: count >= min, short: Math.max(0, min - count), pct: Math.min(100, (count / min) * 100) };
}

/** Compact "28 of 40 pairs" with a bar, beside the cart icon. Desktop and tablet. */
export function MinimumMeterPill() {
  const meter = useMeter();
  const { locale, dict } = useI18n();
  const c = dict.catalog;
  if (!meter) return null;
  return (
    <Link
      href={withLocale(locale, "/cart")}
      aria-label={t(c.meterAria, { count: meter.count, min: meter.min })}
      className="hidden w-52 flex-col gap-1 rounded px-2 py-1 transition-colors hover:bg-stone-100 md:flex"
    >
      <span className="flex items-baseline justify-between gap-2 whitespace-nowrap text-[11px] tabular-nums">
        <span className="text-ink">
          {meter.done ? t(c.meterPairsDone, { count: meter.count }) : t(c.meterPairs, { count: meter.count, min: meter.min })}
        </span>
        <span className={cn("font-semibold", meter.done ? "text-positive" : "text-burgundy")}>
          {meter.done ? c.meterReady : t(c.meterToGo, { short: meter.short })}
        </span>
      </span>
      <span className="h-1 overflow-hidden rounded-full bg-stone-200">
        <span
          className={cn("block h-full rounded-full transition-[width] duration-500", meter.done ? "bg-positive" : "bg-burgundy")}
          style={{ width: `${meter.pct}%` }}
        />
      </span>
    </Link>
  );
}

/** A thin progress line along the bottom edge of the header — the phone version. */
export function MinimumMeterLine() {
  const meter = useMeter();
  if (!meter) return null;
  return (
    <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-stone-200 md:hidden">
      <span
        className={cn("block h-full transition-[width] duration-500", meter.done ? "bg-positive" : "bg-burgundy")}
        style={{ width: `${meter.pct}%` }}
      />
    </span>
  );
}
