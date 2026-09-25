"use client";

import { useActionState, useState } from "react";
import { sendSeasonReminder, type SeasonReminderState } from "@/lib/campaignActions";

const INPUT = "w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal";

/** Admin form for the seasonal "new styles — order by" email (see sendSeasonReminder). */
export function SeasonReminderForm({ buyerCount, leadTimeDays, defaultOrderBy }: { buyerCount: number; leadTimeDays: number; defaultOrderBy: string }) {
  const [state, formAction, pending] = useActionState(sendSeasonReminder, {} as SeasonReminderState);
  const [orderBy, setOrderBy] = useState(defaultOrderBy);
  const [copied, setCopied] = useState(false);
  const deliveredBy = orderBy
    ? new Date(new Date(`${orderBy}T12:00:00Z`).getTime() + leadTimeDays * 86_400_000).toISOString().slice(0, 10)
    : "";

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

      <form action={formAction} className="grid gap-4 border border-stone-300 bg-white p-5">
        <label className="grid gap-1 text-xs font-medium text-ink-soft">
          Order by
          <input type="date" name="orderBy" value={orderBy} onChange={(e) => setOrderBy(e.target.value)} required className={`${INPUT} max-w-xs`} />
        </label>
        {deliveredBy && (
          <p className="text-sm text-ink">
            Buyers are told their boxes will be ready around <strong>{deliveredBy}</strong> ({leadTimeDays}-day production time
            from Content).
          </p>
        )}
        <label className="grid gap-1 text-xs font-medium text-ink-soft">
          Short note (optional, shown in the email as written)
          <textarea name="note" rows={3} maxLength={600} className={INPUT} placeholder="e.g. Winter boots are our best sellers this year — book early." />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="confirm" className="accent-ink" />
          Send this email now to all {buyerCount} buyer{buyerCount === 1 ? "" : "s"}
        </label>
        {state.error && (
          <p role="alert" className="border border-ember/40 bg-ember-100 px-3 py-2 text-sm text-ember">
            {state.error}
          </p>
        )}
        <div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send to buyers"}
          </button>
        </div>
      </form>
    </div>
  );
}
