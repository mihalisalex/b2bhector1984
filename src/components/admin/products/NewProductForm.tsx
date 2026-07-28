"use client";

import { useActionState } from "react";
import { createProductAction } from "@/lib/productActions";
import { CATEGORY_LABEL, SEASON_LABEL, GENDER_LABEL } from "@/lib/data/styleLabels";
import type { FormState } from "@/lib/actions";

const initialState: FormState = {};

export function NewProductForm() {
  const [state, formAction, isPending] = useActionState(createProductAction, initialState);

  return (
    <form action={formAction} className="mt-6 max-w-2xl space-y-5">
      {state?.error && <p className="border border-ember bg-ember-100 px-4 py-2 text-sm text-ember">{state.error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Product name" name="name" required />
        <Field label="Style number" name="styleNumber" required />
      </div>

      <Field label="Short description (tagline)" name="tagline" />

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Full description</label>
        <textarea name="description" rows={4} className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SelectField label="Category" name="category" options={Object.entries(CATEGORY_LABEL)} />
        <SelectField label="Season" name="season" options={Object.entries(SEASON_LABEL)} />
        <SelectField label="Gender" name="gender" options={Object.entries(GENDER_LABEL)} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Wholesale price (EUR)" name="basePrice" type="number" step="0.01" required />
        <Field label="MSRP (EUR)" name="msrp" type="number" step="0.01" />
        <Field label="Cost price (EUR)" name="costPrice" type="number" step="0.01" />
      </div>

      <p className="text-xs text-ink-soft">
        Created as a Draft — colorways, images, inventory, and everything else can be added from the editor after
        creation.
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="border border-ink bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Create Product"}
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
