"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

/**
 * Route-level error boundary. Without this, any throw from a Server Component render —
 * and the data layer throws on every Supabase error (`throw new Error("styles: ...")`) —
 * renders Next.js' unstyled default error screen to buyers. This keeps a transient DB
 * failure inside the brand's own shell and, critically, offers a retry: `reset()`
 * re-renders the segment, which is usually all a blip needs.
 *
 * `digest` is the server-side error's hash; the message itself is deliberately withheld
 * from the client by Next.js in production, so it's surfaced as a support reference
 * rather than as the (redacted) message.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-stone-50 px-6 text-center">
      <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">Something went wrong</span>
      <h1 className="font-display mt-3 text-3xl font-bold uppercase tracking-tight text-ink">
        We couldn&rsquo;t load this page.
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        This is usually temporary. Try again — if it keeps happening, your sales rep can help.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/catalogue" className="flex items-center text-sm font-medium text-signal hover:underline">
          Go to Catalogue
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
