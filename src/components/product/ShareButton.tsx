"use client";

import { useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { useCancelableTimeout } from "@/lib/useCancelableTimeout";
import { useI18n } from "@/i18n/I18nProvider";

export function ShareButton({ title }: { title: string }) {
  const { dict } = useI18n();
  const [copied, setCopied] = useState(false);
  const scheduleReset = useCancelableTimeout();

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
      scheduleReset(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — silently no-op, nothing else reasonable to do
    }
  }

  return (
    <IconButton variant="bordered" size="lg" onClick={share} aria-label={dict.catalog.shareProduct}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.7 10.7 15.3 7M8.7 13.3l6.6 3.7" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
      </svg>
      {copied && (
        <span role="status" className="absolute -bottom-8 right-0 whitespace-nowrap border border-stone-300 bg-ink px-2 py-1 text-[11px] font-medium text-white">
          Link copied
        </span>
      )}
    </IconButton>
  );
}
