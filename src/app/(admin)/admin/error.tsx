"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

/**
 * Admin's own copy of the storefront's route-level error boundary (src/app/[lang]/error.tsx).
 * Needed separately because splitting into multiple root layouts (see
 * src/app/(admin)/admin/layout.tsx) means admin no longer shares a root layout — and
 * therefore no longer shares an error boundary — with the storefront.
 */
export default function AdminRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin route error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-stone-50 px-6 text-center">
      <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">Something went wrong</span>
      <h1 className="font-display mt-3 text-3xl font-bold uppercase tracking-tight text-ink">
        We couldn&rsquo;t load this page.
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">This is usually temporary. Try again.</p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/admin" className="flex items-center text-sm font-medium text-signal hover:underline">
          Back to admin home
        </Link>
      </div>
      {error.digest && (
        <p className="font-mono-tab mt-8 text-[11px] uppercase tracking-wide text-ink-soft">
          Reference {error.digest}
        </p>
      )}
    </div>
  );
}
