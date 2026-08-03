"use client";

import { useActionState } from "react";
import { submitApplication, type FormState } from "@/lib/actions";
import { Button } from "@/components/ui/Button";

const initialState: FormState = {};

const BUSINESS_TYPES = [
  "Independent specialty (1 door)",
  "Multi-brand specialty (2–5 doors)",
  "Regional chain (6+ doors)",
  "Outdoor / run specialty",
  "Team sport / athletic",
  "Other",
];

const VOLUME_BANDS = [
  "Under €10,000 / year",
  "€10,000–€25,000 / year",
  "€25,000–€75,000 / year",
  "€75,000–€150,000 / year",
  "€150,000+ / year",
];

export function ApplyForm() {
  const [state, formAction, pending] = useActionState(submitApplication, initialState);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
      <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">Wholesale Access</span>
      <h1 className="font-display mt-2 text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
        Apply for a Wholesale Account
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
        We review every application manually — typically within 2 business days. You&rsquo;ll need
        your resale certificate or tax ID on hand. Approved accounts get immediate access to full
        pricing, matrix ordering, and the digital linesheet.
      </p>

      <form action={formAction} className="mt-10 flex flex-col gap-10">
        <fieldset className="flex flex-col gap-4">
          <Legend>Business</Legend>
          <Row>
            <Field label="Business name *" name="businessName" required />
            <Field label="Website" name="website" />
          </Row>
          <Row>
            <SelectField label="Business type *" name="businessType" options={BUSINESS_TYPES} required />
            <SelectField label="Expected annual volume *" name="expectedVolume" options={VOLUME_BANDS} required />
          </Row>
          <Field label="Resale certificate / Tax ID *" name="resaleCertId" required placeholder="e.g. EL123456789" mono />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <Legend>Store Location</Legend>
          <Field label="Store address *" name="addressLine1" required />
          <Row cols={3}>
            <Field label="City *" name="city" required placeholder="Athens" />
            <Field label="Region *" name="state" required placeholder="Attica" />
            <Field label="Postal code *" name="zip" required placeholder="104 31" />
          </Row>
          <Field label="City, region (as shown publicly) *" name="storeLocation" required placeholder="Athens, Attica" />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <Legend>Contact</Legend>
          <Row>
            <Field label="Contact name *" name="contactName" required />
            <Field label="Phone *" name="phone" required type="tel" />
          </Row>
          <Field label="Email *" name="email" required type="email" />
        </fieldset>

        {state.error && (
          <p role="alert" className="border border-ember/40 bg-ember-100 px-3 py-2 text-sm text-ember">
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Submitting…" : "Submit Application"}
          </Button>
          <p className="text-xs text-ink-soft">No payment or purchase required to apply.</p>
        </div>
      </form>
    </div>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return <legend className="font-display text-sm font-bold uppercase tracking-wide text-ink">{children}</legend>;
}

function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>{children}</div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  mono,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  mono?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal ${mono ? "font-mono-tab" : ""}`}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  required,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
      >
        <option value="" disabled>Select one</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}
