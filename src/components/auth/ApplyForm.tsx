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
    <div className="mx-auto max-w-2xl px-6 py-20 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.24em] text-ink-soft">{a.eyebrow}</p>
      <h1 className="font-display mt-4 text-4xl leading-[1.1] text-ink sm:text-5xl">
        {a.heading}
      </h1>
      <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">{a.intro}</p>

      <form action={formAction} className="mt-14 flex flex-col gap-14">
        <fieldset className="flex flex-col gap-5">
          <Legend>{a.legendBusiness}</Legend>
          <Field label={a.businessName} name="businessName" required />
          <Field label={a.resaleCert} name="resaleCertId" required placeholder={a.resaleCertPlaceholder} mono />
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-ink">{a.country}</span>
            <select
              name="country"
              required
              defaultValue={defaultCountry}
              className="border border-stone-300 bg-white px-3.5 py-3 text-sm text-ink outline-none transition-colors duration-300 focus-visible:border-signal"
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

        <fieldset className="flex flex-col gap-5">
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
  return <legend className="font-display mb-6 text-2xl text-ink">{children}</legend>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}
