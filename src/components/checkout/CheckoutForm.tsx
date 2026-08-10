"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-context";
import { formatEUR, getOrderMinimumError, getUnitPrice, TERMS_DISCOUNT, TERMS_LABEL, validateMatrix } from "@/lib/pricing";
import { placeOrder, type CheckoutState } from "@/lib/actions";
import type { Account, BoxTypeId, CreditTerms } from "@/lib/types";
import { Button, LinkButton } from "@/components/ui/Button";
import { VatSuffix } from "@/components/ui/VatSuffix";

const TERMS_OPTIONS: { value: CreditTerms; label: string }[] = [
  { value: "prepay", label: "Prepay" },
  { value: "net30", label: "Net 30" },
  { value: "net60", label: "Net 60" },
];

const initialState: CheckoutState = {};

export function CheckoutForm({ account }: { account: Account }) {
  const { lines } = useCart();
  const { getStyleById, inventory, productionLeadTimeDays } = useCatalog();
  const [terms, setTerms] = useState<CreditTerms>(account.creditTerms);

  const [state, formAction, pending] = useActionState(async (prev: CheckoutState, formData: FormData) => {
    formData.set("lines", JSON.stringify(lines));
    return placeOrder(prev, formData);
  }, initialState);

  const styleGroups = useMemo(() => {
    const ids = Array.from(new Set(lines.map((l) => l.styleId)));
    return ids.flatMap((styleId) => {
      const style = getStyleById(styleId);
      if (!style) return [];
      const qtyMap: Record<string, Partial<Record<BoxTypeId, number>>> = {};
      for (const l of lines.filter((x) => x.styleId === styleId)) {
        qtyMap[l.colorwayId] = qtyMap[l.colorwayId] || {};
        qtyMap[l.colorwayId]![l.boxTypeId] = l.qty;
      }
      return [{ style, ...validateMatrix(style, qtyMap, terms, account.priceMultiplier) }];
    });
  }, [lines, terms, getStyleById, account.priceMultiplier]);

  const cartTotal = useMemo(
    () => Math.round(styleGroups.reduce((sum, g) => sum + g.subtotal, 0) * 100) / 100,
    [styleGroups],
  );
  const vatTotal = useMemo(
    () => Math.round(styleGroups.reduce((sum, g) => sum + g.subtotal * (g.style.vatRate ?? 0), 0) * 100) / 100,
    [styleGroups],
  );
  const grandTotal = useMemo(() => Math.round((cartTotal + vatTotal) * 100) / 100, [cartTotal, vatTotal]);
  const totalPairs = useMemo(() => styleGroups.reduce((sum, g) => sum + g.totalPairs, 0), [styleGroups]);
  const minimumError = getOrderMinimumError(totalPairs, account.minOrderPairs);

  // Preview only — mirrors the same on-hand comparison PrimaryPurchasePanel/QuickAdd/
  // OrderableLinesheet already show per line, just rolled up per style here. The real,
  // authoritative fulfillment decision is made server-side in placeOrder()'s atomic stock
  // check; this can't guarantee it (stock can move between this render and submission),
  // it's just an honest heads-up before the buyer clicks submit.
  const backordered = useMemo(
    () =>
      styleGroups.filter((g) => {
        if (!g.style.allowBackorder) return false;
        const styleInventory = inventory[g.style.id] ?? {};
        return lines.some((l) => {
          if (l.styleId !== g.style.id) return false;
          const onHand = styleInventory[l.colorwayId]?.[l.boxTypeId] ?? 0;
          return l.qty > onHand;
        });
      }),
    [styleGroups, inventory, lines],
  );
  // Same underlying mechanic (order beyond on-hand -> production), split by the
  // admin-editable per-style toggle that decides how it's communicated: a fixed ETA
  // ("made to order") vs. timing confirmed later ("pre-order").
  const madeToOrder = useMemo(() => backordered.filter((g) => g.style.backorderMode !== "pre_order"), [backordered]);
  const preOrder = useMemo(() => backordered.filter((g) => g.style.backorderMode === "pre_order"), [backordered]);

  // `style.availability` ("available" vs "prebook") is a merchandising/season field —
  // completely separate from real-time stock. A style can be "available" (in-season,
  // normally ships at-once) while this specific cart line still runs past its on-hand
  // and lands in `backordered` above. Without excluding those here, a fully-backordered
  // style (0 on hand, everything going to production) was showing up in BOTH "At-once"
  // *and* "Pre-order/Made to order" — telling the buyer the same style both ships in 5
  // days and has no fixed ship date. `backordered` is the more specific, stock-aware
  // signal, so it wins.
  const backorderedIds = useMemo(() => new Set(backordered.map((g) => g.style.id)), [backordered]);
  const availableNow = styleGroups.filter((g) => g.style.availability === "available" && !backorderedIds.has(g.style.id));
  const prebook = styleGroups.filter((g) => g.style.availability === "prebook" && !backorderedIds.has(g.style.id));

  if (lines.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-ink-soft">Your cart is empty — nothing to check out yet.</p>
        <LinkButton href="/catalogue" className="mt-6 inline-flex">Browse Catalogue</LinkButton>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 grid grid-cols-1 gap-10 pb-24 lg:grid-cols-[1fr_400px] lg:pb-0">
      <div className="flex flex-col gap-8">
        <Section title="Ship To">
          <div className="flex flex-col gap-2">
            {account.shipTo.map((addr) => (
              <label key={addr.id} className="flex cursor-pointer items-start gap-3 border border-stone-300 p-3 has-[:checked]:border-ink has-[:checked]:bg-stone-100">
                <input type="radio" name="shipToId" value={addr.id} defaultChecked={addr.isDefault} className="mt-1 accent-ink" />
                <span className="text-sm">
                  <span className="block font-medium text-ink">{addr.label}</span>
                  <span className="block text-ink-soft">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</span>
                  <span className="block text-ink-soft">{addr.city}, {addr.state} {addr.zip}</span>
                </span>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Payment Terms">
          <select
            name="terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value as CreditTerms)}
            className="max-w-xs border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus-visible:border-signal"
          >
            {TERMS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}{TERMS_DISCOUNT[opt.value] > 0 ? ` — ${Math.round(TERMS_DISCOUNT[opt.value] * 100)}% off` : " — list price"}
              </option>
            ))}
          </select>
          <p className="mt-2 max-w-sm text-xs text-ink-soft">
            Your account is currently approved for <strong className="text-ink">{TERMS_LABEL[account.creditTerms]}</strong>.
            Requesting different terms routes this order to {account.rep.name} for credit approval before it ships.
          </p>
        </Section>

        <Section title="Notes for your rep">
          <textarea
            name="notes"
            rows={4}
            placeholder="Delivery instructions, combine shipments, anything your rep should know…"
            className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus-visible:border-signal"
          />
        </Section>

        {(availableNow.length > 0 || prebook.length > 0 || madeToOrder.length > 0 || preOrder.length > 0) && (
          <Section title="Estimated Shipping">
            <div className="flex flex-col gap-2 text-sm text-ink-soft">
              {availableNow.length > 0 && (
                <p>
                  <span className="font-medium text-ink">At-once ({availableNow.length} style{availableNow.length > 1 ? "s" : ""}):</span>{" "}
                  ships within 5 business days of confirmation.
                </p>
              )}
              {prebook.map((g) => (
                <p key={g.style.id}>
                  <span className="font-medium text-ink">{g.style.name} (pre-book):</span> {g.style.shipWindow}.
                </p>
              ))}
              {madeToOrder.length > 0 && (
                <p>
                  <span className="font-medium text-ink">
                    Made to order ({madeToOrder.length} style{madeToOrder.length > 1 ? "s" : ""}):
                  </span>{" "}
                  not fully in stock — ships in about {productionLeadTimeDays} days. Exact per-item status is
                  confirmed after you submit.
                </p>
              )}
              {preOrder.length > 0 && (
                <p>
                  <span className="font-medium text-ink">
                    Pre-order ({preOrder.length} style{preOrder.length > 1 ? "s" : ""}):
                  </span>{" "}
                  not fully in stock — no fixed ship date yet. {account.rep.name} will confirm timing once
                  production is scheduled.
                </p>
              )}
              {[availableNow.length > 0, prebook.length > 0, madeToOrder.length > 0, preOrder.length > 0].filter(Boolean).length > 1 && (
                <p className="text-xs">This order will ship in multiple shipments.</p>
              )}
            </div>
          </Section>
        )}
      </div>

      <div className="h-fit border border-stone-300 bg-white p-5 lg:sticky lg:top-[calc(var(--shell-header-h)+1.5rem)]">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Order Summary</h2>
        <div className="mt-3 flex flex-col gap-2.5 border-b border-stone-200 pb-4">
          {styleGroups.map((g) => {
            // List price (no terms discount) for this line, so the terms-driven saving —
            // "sale," in effect, exactly like a scheduled product sale — is visible right
            // on the line it applies to, not just as a summary note under the grand total.
            const termsDiscount = TERMS_DISCOUNT[terms];
            const listSubtotal =
              termsDiscount > 0
                ? Math.round(getUnitPrice(g.style, "net60", account.priceMultiplier) * g.totalPairs * 100) / 100
                : g.subtotal;
            return (
              <div key={g.style.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">
                  {g.style.name} <span className="font-mono-tab text-xs">×{g.totalPairs}</span>
                  {termsDiscount > 0 && (
                    <span className="ml-1.5 bg-ember px-1 py-0.5 align-middle text-[9px] font-semibold uppercase tracking-wide text-white">
                      {TERMS_LABEL[terms]} −{Math.round(termsDiscount * 100)}%
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-ink">
                  {termsDiscount > 0 && (
                    <span className="mr-1.5 text-xs text-ink-soft line-through">{formatEUR(listSubtotal)}</span>
                  )}
                  {formatEUR(g.subtotal)}
                  <VatSuffix vatRate={g.style.vatRate} className="text-xs text-ink-soft" />
                </span>
              </div>
            );
          })}
        </div>
        {vatTotal > 0 && (
          <div className="mt-3 flex items-center justify-between text-xs text-ink-soft">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatEUR(cartTotal)}</span>
          </div>
        )}
        {vatTotal > 0 && (
          <div className="mt-1 flex items-center justify-between text-xs text-ink-soft">
            <span>VAT</span>
            <span className="tabular-nums">{formatEUR(vatTotal)}</span>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Total</span>
          <span className="text-xl font-semibold tabular-nums text-ink">{formatEUR(grandTotal)}</span>
        </div>
        <p className="mt-1 text-right text-[11px] text-ink-soft">
          {TERMS_DISCOUNT[terms] > 0
            ? `${TERMS_LABEL[terms]} — ${Math.round(TERMS_DISCOUNT[terms] * 100)}% off applied`
            : `${TERMS_LABEL[terms]} — list price`}
        </p>

        {minimumError && (
          <p role="alert" className="mt-4 border border-ember/40 bg-ember-100 px-3 py-2 text-xs text-ember">
            {minimumError}
          </p>
        )}
        {state.error && (
          <p role="alert" className="mt-4 border border-ember/40 bg-ember-100 px-3 py-2 text-xs text-ember">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-5 w-full" disabled={pending || !!minimumError}>
          {pending ? "Requesting…" : "Request Proforma Invoice"}
        </Button>
        <p className="mt-3 text-center text-[11px] text-ink-soft">
          This isn&rsquo;t a charge — it sends this order to {account.rep.name}{" "}
          as a proforma invoice so we can check stock and production before confirming. You&rsquo;ll see it
          in{" "}
          <Link href="/dashboard" className="underline">order history</Link> immediately.
        </p>
      </div>

      {/* Sticky mobile submit bar — the total + submit stay reachable while filling out
          PO/ship-to/terms above, instead of only appearing after scrolling past the whole form. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-300 bg-white/97 px-4 py-3 backdrop-blur lg:hidden" style={{ boxShadow: "0 -8px 24px rgba(26,29,34,0.12)" }}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold tabular-nums text-ink">{formatEUR(grandTotal)}</p>
            <p className="truncate text-[10px] text-ink-soft">{totalPairs} pairs</p>
          </div>
          <Button type="submit" disabled={pending || !!minimumError} className="shrink-0">
            {pending ? "Requesting…" : "Submit Order"}
          </Button>
        </div>
        {minimumError && <p className="mt-1.5 text-[11px] font-medium text-ember">{minimumError}</p>}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">{title}</h2>
      {children}
    </section>
  );
}
