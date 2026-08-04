"use client";

import { useActionState } from "react";
import { updateOrderDetailsAction } from "@/lib/adminActions";
import type { FormState } from "@/lib/actions";
import { TERMS_LABEL } from "@/lib/pricing";
import { Button } from "@/components/ui/Button";
import type { CreditTerms, ShipToAddress } from "@/lib/types";

const TERMS_OPTIONS: CreditTerms[] = ["prepay", "net30", "net60"];
const initialState: FormState = {};

export function OrderDetailsForm({
  orderId,
  accountId,
  terms,
  shipToId,
  notes,
  invoiceUrl,
  trackingNumber,
  carrier,
  shipToOptions,
}: {
  orderId: string;
  accountId: string;
  terms: CreditTerms;
  shipToId: string;
  notes?: string;
  invoiceUrl?: string;
  trackingNumber?: string;
  carrier?: string;
  shipToOptions: ShipToAddress[];
}) {
  const [state, formAction, pending] = useActionState(updateOrderDetailsAction.bind(null, orderId, accountId), initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Payment terms</span>
          <select
            name="terms"
            defaultValue={terms}
            className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
          >
            {TERMS_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TERMS_LABEL[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Ship to</span>
          <select
            name="shipToId"
            defaultValue={shipToId}
            className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
          >
            {shipToOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} — {s.line1}, {s.city}, {s.state} {s.zip}
              </option>
            ))}
          </select>
        </label>

        <Field label="Invoice URL" name="invoiceUrl" defaultValue={invoiceUrl} className="sm:col-span-2" />

        <Field label="Carrier" name="carrier" defaultValue={carrier} placeholder="e.g. UPS, DHL" />
        <Field label="Tracking number" name="trackingNumber" defaultValue={trackingNumber} />

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Notes</span>
          <textarea
            name="notes"
            defaultValue={notes}
            rows={3}
            className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
          />
        </label>
      </div>

      {state.error && (
        <p role="alert" className="border border-ember/40 bg-ember-100 px-3 py-2 text-sm text-ember">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="border border-positive/40 bg-positive-100 px-3 py-2 text-sm text-positive">
          {state.success}
        </p>
      )}

      <Button type="submit" size="sm" className="self-start" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  className,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
      />
    </label>
  );
}
