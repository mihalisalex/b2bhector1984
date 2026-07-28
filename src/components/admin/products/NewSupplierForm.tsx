"use client";

import { useActionState } from "react";
import { createSupplierAction } from "@/lib/productActions";
import type { FormState } from "@/lib/actions";

const initialState: FormState = {};

export function NewSupplierForm() {
  const [state, formAction, isPending] = useActionState(createSupplierAction, initialState);

  return (
    <form action={formAction} className="mt-6 grid max-w-2xl grid-cols-2 gap-3 border border-stone-300 bg-white p-4">
      <h2 className="col-span-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Add supplier</h2>
      <input name="name" placeholder="Name" required className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal" />
      <input name="contactName" placeholder="Contact name" className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal" />
      <input name="email" type="email" placeholder="Email" className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal" />
      <input name="phone" placeholder="Phone" className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal" />
      <input name="leadTimeDays" type="number" placeholder="Lead time (days)" className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal" />
      {state.error && <p className="col-span-2 text-xs text-ember">{state.error}</p>}
      <button type="submit" disabled={isPending} className="col-span-2 border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50">
        {isPending ? "Adding…" : "Add supplier"}
      </button>
    </form>
  );
}
