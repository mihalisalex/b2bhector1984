"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function EmailBuyerPanel({
  to,
  toName,
  defaultSubject,
  defaultBody,
}: {
  to: string;
  toName: string;
  defaultSubject: string;
  defaultBody: string;
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  const mailtoHref = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  if (!open) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Email buyer
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 border border-ink bg-stone-50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Email {toName || "buyer"} · {to}
        </h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Subject</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Message</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
        />
      </label>

      <div className="flex items-center gap-3">
        <a href={mailtoHref}>
          <Button type="button" size="sm">
            Open in email app
          </Button>
        </a>
        <p className="text-xs text-ink-soft">Drafts in your default mail app — nothing sends automatically.</p>
      </div>
    </div>
  );
}
