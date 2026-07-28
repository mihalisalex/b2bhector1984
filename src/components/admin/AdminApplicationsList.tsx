"use client";

import { useState, useTransition } from "react";
import { approveApplication, declineApplication, bulkApproveApplications } from "@/lib/adminActions";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Application } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  pending: "border-court/40 bg-court-100 text-ink",
  approved: "border-positive/40 bg-positive-100 text-positive",
  active: "border-signal/40 bg-signal-100 text-signal",
  declined: "border-ember/40 bg-ember-100 text-ember",
};

export function AdminApplicationsList({ applications }: { applications: Application[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pending = applications.filter((a) => a.status === "pending");
  const allSelected = pending.length > 0 && pending.every((a) => selected.has(a.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(pending.map((a) => a.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyBulkApprove() {
    const ids = Array.from(selected);
    setMessage(null);
    startTransition(async () => {
      const result = await bulkApproveApplications(ids);
      setMessage(result.error ?? result.success ?? null);
      if (!result.error) setSelected(new Set());
    });
  }

  return (
    <div>
      {pending.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 border border-stone-300 bg-stone-100 px-4 py-3">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            Select all pending
          </label>
          {selected.size > 0 && (
            <>
              <span className="text-xs text-ink-soft">{selected.size} selected</span>
              <button
                type="button"
                onClick={applyBulkApprove}
                disabled={isPending}
                className="bg-ink px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
              >
                {isPending ? "Approving…" : `Approve ${selected.size}`}
              </button>
            </>
          )}
          {message && <p className="text-xs text-ink-soft">{message}</p>}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {applications.map((app) => (
          <div key={app.id} className="flex flex-wrap items-center justify-between gap-4 border border-stone-300 bg-white p-4">
            <div className="flex items-start gap-3">
              {app.status === "pending" && (
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.has(app.id)}
                  onChange={() => toggleOne(app.id)}
                  aria-label={`Select ${app.businessName}`}
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{app.businessName}</p>
                  <span className={cn("border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", STATUS_STYLE[app.status])}>
                    {app.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {app.contactName} · {app.email} · {app.storeLocation} · Submitted {formatDate(app.submittedAt)}
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {app.businessType} · {app.expectedVolume} · Resale cert {app.resaleCertId}
                </p>
              </div>
            </div>
            {app.status === "pending" && (
              <div className="flex shrink-0 items-center gap-2">
                <form action={approveApplication.bind(null, app.id)}>
                  <button
                    type="submit"
                    className="border border-ink bg-ink px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
                  >
                    Approve
                  </button>
                </form>
                <form action={declineApplication.bind(null, app.id)}>
                  <button
                    type="submit"
                    className="border border-stone-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft hover:border-ember hover:text-ember"
                  >
                    Decline
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
