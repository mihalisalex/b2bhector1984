"use client";

import { useActionState } from "react";
import { submitApplication, type FormState } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { TextField as Field, SelectField, FormMessage } from "@/components/ui/FormField";
import { useI18n } from "@/i18n/I18nProvider";
import type { Dictionary } from "@/i18n/dictionaries/en";

const initialState: FormState = {};

/**
 * "Outdoor / run specialty" and "Team sport / athletic" used to sit in this
 * list — categories from the seed data of a different kind of business. Hector
 * sells men's leather footwear to shoe retailers, so both described a customer
 * that will never apply, and every real applicant so far picked one of the
 * three door-count options. Replaced with the channels that actually buy this
 * catalogue.
 *
 * `value` is what gets STORED and is deliberately English in every locale — the
 * admin panel that reads these applications is English by decision, and a Greek
 * applicant's answers have to stay legible there. Only the label is translated.
 */
function businessTypes(d: Dictionary["apply"]) {
  return [
    { value: "Independent specialty (1 door)", label: d.typeIndependent },
    { value: "Multi-brand specialty (2–5 doors)", label: d.typeMultiBrand },
    { value: "Regional chain (6+ doors)", label: d.typeChain },
    { value: "Department store", label: d.typeDepartment },
    { value: "Online retailer", label: d.typeOnline },
    { value: "Distributor / agent", label: d.typeDistributor },
    { value: "Other", label: d.typeOther },
  ];
}

function volumeBands(d: Dictionary["apply"]) {
  return [
    { value: "Under €10,000 / year", label: d.volUnder10k },
    { value: "€10,000–€25,000 / year", label: d.vol10to25k },
    { value: "€25,000–€75,000 / year", label: d.vol25to75k },
    { value: "€75,000–€150,000 / year", label: d.vol75to150k },
    { value: "€150,000+ / year", label: d.vol150kPlus },
  ];
}

export function ApplyForm() {
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
          <Row>
            <Field label={a.businessName} name="businessName" required />
            <Field label={a.website} name="website" />
          </Row>
          <Row>
            <SelectField label={a.businessType} name="businessType" options={businessTypes(a)} placeholder={a.selectOne} required />
            <SelectField label={a.expectedVolume} name="expectedVolume" options={volumeBands(a)} placeholder={a.selectOne} required />
          </Row>
          <Field label={a.resaleCert} name="resaleCertId" required placeholder={a.resaleCertPlaceholder} mono />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <Legend>{a.legendLocation}</Legend>
          <Field label={a.address} name="addressLine1" required />
          <Row cols={3}>
            <Field label={a.city} name="city" required placeholder={a.cityPlaceholder} />
            <Field label={a.region} name="state" required placeholder={a.regionPlaceholder} />
            <Field label={a.postalCode} name="zip" required placeholder={a.postalCodePlaceholder} />
          </Row>
          <Field label={a.storeLocation} name="storeLocation" required placeholder={a.storeLocationPlaceholder} />
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

function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>{children}</div>
  );
}
