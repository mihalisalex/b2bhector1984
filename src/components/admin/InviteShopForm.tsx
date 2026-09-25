"use client";

import { useActionState, useState } from "react";
import { inviteShop, type InviteState } from "@/lib/inviteActions";

const INPUT = "w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal";
const LABEL = "grid gap-1 text-xs font-medium text-ink-soft";

/** Admin form: invite a shop you already sell to (see `inviteShop`). */
export function InviteShopForm({
  countries,
  reps,
}: {
  countries: { value: string; label: string }[];
  reps: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(inviteShop, {} as InviteState);
  const [formKey, setFormKey] = useState(0);
  const [copied, setCopied] = useState(false);

  async function copy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      window.prompt("Copy this link:", link);
    }
  }

  return (
    <div className="grid gap-5">
      {state.success && state.link && (
        <div className="grid gap-3 border border-positive/40 bg-positive-100 p-4 text-sm text-ink" role="status">
          <p className="font-semibold text-positive">{state.success}</p>
          <p className="break-all text-xs text-ink-soft">{state.link}</p>
          <div className="flex flex-wrap gap-2">
            {state.whatsappLink && (
              <a
                href={state.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90"
              >
                Send on WhatsApp
              </a>
            )}
            <button type="button" onClick={() => copy(state.link!)} className="rounded-full border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white">
              {copied ? "Copied ✓" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormKey((k) => k + 1);
                setCopied(false);
              }}
              className="px-2 text-xs font-semibold uppercase tracking-wide text-ink-soft underline hover:text-ink"
            >
              Invite another shop
            </button>
          </div>
        </div>
      )}

      <form key={formKey} action={formAction} className="grid gap-4 border border-stone-300 bg-white p-5 sm:grid-cols-2">
        <label className={LABEL}>
          Shop name *
          <input name="businessName" required className={INPUT} placeholder="e.g. Papadakis Shoes" />
        </label>
        <label className={LABEL}>
          Contact name *
          <input name="contactName" required className={INPUT} placeholder="e.g. Nikos Papadakis" />
        </label>
        <label className={LABEL}>
          Email *
          <input name="email" type="email" required className={INPUT} placeholder="shop@example.com" />
        </label>
        <label className={LABEL}>
          Mobile (for WhatsApp)
          <input name="phone" type="tel" className={INPUT} placeholder="69… or +49…" />
        </label>
        <label className={LABEL}>
          Country *
          <select name="country" defaultValue="GR" className={INPUT}>
            {countries.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL}>
          Town
          <input name="city" className={INPUT} placeholder="e.g. Chania" />
        </label>
        <label className={LABEL}>
          VAT number (ΑΦΜ)
          <input name="vatNumber" className={INPUT} />
        </label>
        <label className={LABEL}>
          Language of the invitation
          <select name="locale" defaultValue="" className={INPUT}>
            <option value="">From the country (Greece/Cyprus → Greek, else English)</option>
            <option value="el">Greek</option>
            <option value="en">English</option>
            <option value="de">German</option>
            <option value="fr">French</option>
          </select>
        </label>
        <label className={LABEL}>
          Rep
          <select name="repId" defaultValue="" className={INPUT}>
            <option value="">— Unassigned —</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL}>
          Price multiplier (1 = normal prices)
          <input name="priceMultiplier" inputMode="decimal" defaultValue="1" className={INPUT} />
        </label>

        {state.error && (
          <p role="alert" className="border border-ember/40 bg-ember-100 px-3 py-2 text-sm text-ember sm:col-span-2">
            {state.error}
          </p>
        )}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send invitation"}
          </button>
        </div>
      </form>
    </div>
  );
}
