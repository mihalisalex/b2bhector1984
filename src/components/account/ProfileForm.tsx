"use client";

import { useActionState } from "react";
import { updateAccountProfile, type FormState } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import type { Account } from "@/lib/types";

const initialState: FormState = {};

/**
 * `whatsappEnabled` comes from the server (see `isWhatsAppConfigured`) because the field's
 * label and hint describe what actually happens with the number. Claiming a WhatsApp
 * confirmation on a deployment with no WhatsApp credentials is a promise to the buyer that
 * nothing keeps.
 */
export function ProfileForm({ account, whatsappEnabled }: { account: Account; whatsappEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(updateAccountProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Business name" name="businessName" defaultValue={account.businessName} required />
      <Field label="Contact name" name="contactName" defaultValue={account.contactName} required />
      <Field label="Email" name="email" type="email" defaultValue={account.email} required />
      <Field
        label={whatsappEnabled ? "Mobile phone (WhatsApp)" : "Mobile phone"}
        name="phone"
        type="tel"
        defaultValue={account.phone}
        placeholder="+30 691 234 5678"
      />
      <p className="-mt-2.5 text-xs text-ink-soft">
        Include the country code.{" "}
        {whatsappEnabled
          ? "Used to send an order confirmation by WhatsApp when you request a proforma invoice."
          : "Used by your rep to reach you about an order. Order confirmations are sent by email."}
      </p>

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
  type = "text",
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
      />
    </label>
  );
}
