"use client";

import { useActionState, useState } from "react";
import { sendSeasonReminder, type SeasonReminderState } from "@/lib/campaignActions";

const INPUT = "w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal";
const MAX_STYLES = 6;

interface PickerStyle {
  id: string;
  name: string;
  imageUrl?: string;
  addedOn: string;
}

/** Admin form for the "new styles" buyer email (see sendSeasonReminder): pick styles, test, send. */
export function SeasonReminderForm({
  buyerCount,
  leadTimeDays,
  styles,
  adminEmail,
}: {
  buyerCount: number;
  leadTimeDays: number;
  styles: PickerStyle[];
  adminEmail: string;
}) {
  const [state, formAction, pending] = useActionState(sendSeasonReminder, {} as SeasonReminderState);
  const [picked, setPicked] = useState<string[]>(() => styles.slice(0, MAX_STYLES).map((s) => s.id));
  const [orderBy, setOrderBy] = useState("");
  const [copied, setCopied] = useState(false);
  const deliveredBy = orderBy
    ? new Date(new Date(`${orderBy}T12:00:00Z`).getTime() + leadTimeDays * 86_400_000).toISOString().slice(0, 10)
    : "";

  const toggle = (id: string) =>
    setPicked((current) => (current.includes(id) ? current.filter((x) => x !== id) : current.length < MAX_STYLES ? [...current, id] : current));

  return (
    <div className="grid gap-5">
      {state.success && (
        <div className="grid gap-3 border border-positive/40 bg-positive-100 p-4 text-sm" role="status">
          <p className="font-semibold text-positive">{state.success}</p>
          {state.whatsappText && (
            <>
              <p className="text-xs text-ink-soft">The same message in Greek, for a WhatsApp broadcast list:</p>
              <textarea readOnly value={state.whatsappText} rows={8} className={`${INPUT} font-mono-tab text-xs`} />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(state.whatsappText!);
                    setCopied(true);
                  } catch {
                    /* select the textarea manually */
                  }
                }}
                className="justify-self-start rounded-full border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white"
              >
                {copied ? "Copied ✓" : "Copy for WhatsApp"}
              </button>
            </>
          )}
        </div>
      )}

      <form action={formAction} className="grid gap-5 border border-stone-300 bg-white p-5">
        <fieldset className="grid gap-2">
          <legend className="text-xs font-medium text-ink-soft">
            Styles in the email ({picked.length}/{MAX_STYLES}) — newest first
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {styles.map((s) => {
              const on = picked.includes(s.id);
              const full = !on && picked.length >= MAX_STYLES;
              return (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-center gap-2 border p-2 text-xs ${on ? "border-ink bg-stone-50" : "border-stone-200"} ${full ? "opacity-40" : ""}`}
                >
                  <input type="checkbox" name="styleIds" value={s.id} checked={on} disabled={full} onChange={() => toggle(s.id)} className="accent-ink" />
                  {s.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- tiny admin thumbnail
                    <img src={s.imageUrl} alt="" className="h-10 w-10 shrink-0 object-cover" />
                  ) : (
                    <span className="h-10 w-10 shrink-0 bg-stone-100" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{s.name}</span>
                    <span className="text-ink-soft">{s.addedOn}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="grid gap-1 text-xs font-medium text-ink-soft">
          Language
          <select name="language" defaultValue="el" className={`${INPUT} max-w-xs`}>
            <option value="el">Greek, for everyone</option>
            <option value="auto">Each buyer&rsquo;s own language</option>
            <option value="en">English, for everyone</option>
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium text-ink-soft">
          Order by (optional)
          <input type="date" name="orderBy" value={orderBy} onChange={(e) => setOrderBy(e.target.value)} className={`${INPUT} max-w-xs`} />
        </label>
        <p className="-mt-3 text-sm text-ink">
          {deliveredBy ? (
            <>
              Buyers are told their boxes will be ready around <strong>{deliveredBy}</strong>.
            </>
          ) : (
            <>Without a date, the email says boxes are ready about {leadTimeDays} days after they order.</>
          )}
        </p>

        <label className="grid gap-1 text-xs font-medium text-ink-soft">
          Short note (optional, shown in the email as written)
          <textarea name="note" rows={3} maxLength={600} className={INPUT} placeholder="π.χ. Τα νέα sneakers είναι διαθέσιμα σε μαύρο και ταμπά." />
        </label>

        <div className="grid gap-2 border border-dashed border-stone-300 bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">1. Send yourself a test</p>
          <div className="flex flex-wrap items-center gap-2">
            <input type="email" name="testEmail" defaultValue={adminEmail} className={`${INPUT} max-w-xs`} aria-label="Test email address" />
            <button
              type="submit"
              name="intent"
              value="test"
              disabled={pending || picked.length === 0}
              className="rounded-full border border-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send test"}
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">2. Send to buyers</p>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="confirm" className="accent-ink" />
            Send this email now to all {buyerCount} buyer{buyerCount === 1 ? "" : "s"}
          </label>
          <div>
            <button
              type="submit"
              name="intent"
              value="send"
              disabled={pending || picked.length === 0}
              className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send to buyers"}
            </button>
          </div>
        </div>

        {state.error && (
          <p role="alert" className="border border-ember/40 bg-ember-100 px-3 py-2 text-sm text-ember">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
