"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-context";
import { formatEUR, getOrderMinimumError, TERMS_DISCOUNT, TERMS_LABEL, validateMatrix } from "@/lib/pricing";
import { placeOrder, type CheckoutState } from "@/lib/actions";
import type { Account, BoxTypeId, CreditTerms } from "@/lib/types";
import { Button, LinkButton } from "@/components/ui/Button";

const TERMS_OPTIONS: { value: CreditTerms; label: string }[] = [
  { value: "prepay", label: "Prepay" },
  { value: "net30", label: "Net 30" },
  { value: "net60", label: "Net 60" },
];

const initialState: CheckoutState = {};

export function CheckoutForm({ account }: { account: Account }) {
  const { lines } = useCart();
  const { getStyleById } = useCatalog();
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
      return [{ style, ...validateMatrix(style, qtyMap, terms) }];
    });
  }, [lines, terms, getStyleById]);

  const cartTotal = useMemo(
    () => Math.round(styleGroups.reduce((sum, g) => sum + g.subtotal, 0) * 100) / 100,
    [styleGroups],
  );
  const totalPairs = useMemo(() => styleGroups.reduce((sum, g) => sum + g.totalPairs, 0), [styleGroups]);
  const minimumError = getOrderMinimumError(totalPairs);

  const availableNow = styleGroups.filter((g) => g.style.availability === "available");
  const prebook = styleGroups.filter((g) => g.style.availability === "prebook");

  if (lines.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-ink-soft">Your cart is empty — nothing to check out yet.</p>
        <LinkButton href="/catalogue" className="mt-6 inline-flex">Browse Catalogue</LinkButton>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-8">
        <Section title="Purchase Order">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">PO number *</span>
            <input
              name="poNumber"
              required
              placeholder="e.g. US-0530"
              className="max-w-xs border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus-visible:border-signal"
            />
          </label>
        </Section>

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

        {(availableNow.length > 0 || prebook.length > 0) && (
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
              {prebook.length > 0 && availableNow.length > 0 && (
                <p className="text-xs">This order will ship in multiple shipments.</p>
              )}
            </div>
          </Section>
        )}
      </div>

      <div className="h-fit border border-stone-300 bg-white p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Order Summary</h2>
        <div className="mt-3 flex flex-col gap-2.5 border-b border-stone-200 pb-4">
          {styleGroups.map((g) => (
            <div key={g.style.id} className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">
                {g.style.name} <span className="font-mono-tab text-xs">×{g.totalPairs}</span>
              </span>
              <span className="font-mono-tab text-ink">{formatEUR(g.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Total</span>
          <span className="font-mono-tab text-xl font-bold text-ink">{formatEUR(cartTotal)}</span>
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
          This isn&rsquo;t a charge — it sends this PO to {account.rep.name}{" "}
          as a proforma invoice so we can check stock and production before confirming. You&rsquo;ll see it
          in{" "}
          <Link href="/dashboard" className="underline">order history</Link> immediately.
        </p>
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
