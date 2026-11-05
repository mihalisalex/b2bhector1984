"use client";

import { useActionState } from "react";
import { submitApplication, type FormState } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { TextField as Field, FormMessage } from "@/components/ui/FormField";
import { useI18n } from "@/i18n/I18nProvider";

const initialState: FormState = {};

export function ApplyForm({
  countries,
  defaultCountry,
}: {
  /** Built on the server (`countryOptions`) so names match between render and hydration. */
  countries: { value: string; label: string }[];
  /** "GR" on the Greek site; empty elsewhere, so the buyer has to choose. */
  defaultCountry: string;
}) {
  const [state, formAction, pending] = useActionState(submitApplication, initialState);
  const a = useI18n().dict.apply;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
      <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">{a.eyebrow}</span>
      <h1 className="font-display mt-2 text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
        {a.heading}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">{a.intro}</p>

      <form action={formAction} className="mt-10 flex flex-col gap-10">
        <fieldset className="flex flex-col gap-4">
          <Legend>{a.legendBusiness}</Legend>
          <Field label={a.businessName} name="businessName" required />
          <Field label={a.resaleCert} name="resaleCertId" required placeholder={a.resaleCertPlaceholder} mono />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{a.country}</span>
            <select
              name="country"
              required
              defaultValue={defaultCountry}
              className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-200 focus-visible:border-signal"
            >
              <option value="" disabled>
                {a.selectOne}
              </option>
              {countries.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-ink-soft">{a.countryHint}</span>
          </label>
          <div className="flex flex-col gap-1.5">
            <Field label={a.city} name="city" required placeholder={a.cityPlaceholder} />
            <span className="text-xs text-ink-soft">{a.addressLater}</span>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <Legend>{a.legendContact}</Legend>
          <Row>
            <Field label={a.contactName} name="contactName" required />
            <Field label={a.phone} name="phone" required type="tel" />
          </Row>
          <Field label={a.email} name="email" required type="email" />
        </fieldset>

        {state.error && <FormMessage variant="error">{state.error}</FormMessage>}

        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? a.submitting : a.submit}
          </Button>
          <p className="text-xs text-ink-soft">{a.noPayment}</p>
        </div>
      </form>
    </div>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return <legend className="font-display text-sm font-bold uppercase tracking-wide text-ink">{children}</legend>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}
