"use client";

import { useActionState } from "react";
import { updateOrderStatus } from "@/lib/adminActions";
import type { FormState } from "@/lib/actions";
import type { OrderStatus } from "@/lib/types";

/** The order journey the buyer sees, one step at a time (see OrderJourney). */
const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  submitted: { status: "confirmed", label: "Επιβεβαίωση & τιμολόγιο" },
  confirmed: { status: "in_production", label: "Μπήκε στην παραγωγή" },
  in_production: { status: "shipped", label: "Δόθηκε στη μεταφορική" },
  shipped: { status: "delivered", label: "Παραδόθηκε" },
};

/**
 * One tap to move an order to its next step. The buyer's timeline updates and they get an
 * email in their own language saying what changed. The status select beside it stays for
 * anything else (going back a step, cancelling).
 */
export function OrderNextStep({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [state, formAction, pending] = useActionState(updateOrderStatus.bind(null, orderId), {} as FormState);
  const next = NEXT[status];
  if (!next) return null;
  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="status" value={next.status} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
      >
        {pending ? "Saving…" : `${next.label} →`}
      </button>
      <span className="text-[11px] text-ink-soft">Ενημερώνει τον πελάτη με email</span>
      {state.error && <span className="max-w-[240px] text-right text-[11px] text-ember">{state.error}</span>}
    </form>
  );
}
