"use client";

import { useActionState } from "react";
import { createProductAction } from "@/lib/productActions";
import { CATEGORY_LABEL } from "@/lib/data/styleLabels";
import type { FormState } from "@/lib/actions";

const initialState: FormState = {};

export function NewProductForm() {
  const [state, formAction, isPending] = useActionState(createProductAction, initialState);

  return (
    <form action={formAction} className="mt-6 max-w-2xl space-y-5">
      {state?.error && <p className="border border-ember bg-ember-100 px-4 py-2 text-sm text-ember">{state.error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Όνομα προϊόντος" name="name" required />
        <Field label="Κωδικός" name="styleNumber" required />
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-4">
        <Field label="Χρώμα (στα αγγλικά, π.χ. Brown)" name="colourName" required />
        <div>
          <label htmlFor="colourSwatch" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Δείγμα</label>
          <input id="colourSwatch" type="color" name="colourSwatch" defaultValue="#121212" className="h-[38px] w-16 border border-stone-300 bg-white p-1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Κατηγορία" name="category" options={Object.entries(CATEGORY_LABEL)} />
        <SelectField label="Σεζόν" name="season" options={[["summer", "Καλοκαιρινό"], ["winter", "Χειμερινό"], ["both", "Και οι δύο σεζόν"]]} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Χονδρική (€ το ζευγάρι)" name="basePrice" type="number" step="0.01" required />
        <Field label="Προτεινόμενη λιανική (€)" name="msrp" type="number" step="0.01" />
      </div>

      <p className="text-sm text-ink-soft">
        Μπαίνει ως πρόχειρο, οπότε δεν το βλέπουν οι πελάτες. Στην επόμενη οθόνη ανεβάζεις φωτογραφίες και γράφεις τα
        κείμενα. Για ένα νέο χρώμα υπάρχοντος μοντέλου, πάτα «Νέο χρώμα» στη λίστα, είναι πιο γρήγορο.
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="border border-ink bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
      >
        {isPending ? "Δημιουργία…" : "Συνέχεια"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
      />
    </div>
  );
}

function SelectField({ label, name, options }: { label: string; name: string; options: [string, string][] }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {label}
      </label>
      <select id={name} name={name} className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal">
        {options.map(([value, opt]) => (
          <option key={value} value={value}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
