"use client";

import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled the native share sheet — not an error
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — silently no-op, nothing else reasonable to do
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share this product"
      className="relative flex h-12 w-12 shrink-0 items-center justify-center border border-stone-300 text-ink transition-colors hover:border-ink"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.7 10.7 15.3 7M8.7 13.3l6.6 3.7" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
      </svg>
      {copied && (
        <span className="absolute -bottom-8 right-0 whitespace-nowrap border border-stone-300 bg-ink px-2 py-1 text-[11px] font-medium text-white">
          Link copied
        </span>
      )}
    </button>
  );
}
