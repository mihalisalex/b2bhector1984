"use client";

import { useActionState, useRef, useEffect } from "react";
import { createSalesRepAction } from "@/lib/adminActions";
import type { FormState } from "@/lib/actions";

const initialState: FormState = {};

const inputClass =
  "w-full border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none focus-visible:border-signal";

export function NewSalesRepForm() {
  const [state, formAction] = useActionState(createSalesRepAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="mt-6 border border-stone-300 bg-stone-50 p-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Νέος εκπρόσωπος</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <input name="name" placeholder="Όνομα" required className={inputClass} />
        <input name="title" placeholder="Τίτλος" className={inputClass} />
        <input name="email" type="email" placeholder="Email" required className={inputClass} />
        <input name="phone" placeholder="Τηλέφωνο" className={inputClass} />
        <input name="initials" placeholder="Αρχικά (προαιρετικό)" className={inputClass} />
        <input name="territory" placeholder="Περιοχή" className={inputClass} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          className="bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
        >
          Προσθήκη
        </button>
        {state.error && <p className="text-xs text-ember">{state.error}</p>}
        {state.success && <p className="text-xs text-positive">{state.success}</p>}
      </div>
    </form>
  );
}
