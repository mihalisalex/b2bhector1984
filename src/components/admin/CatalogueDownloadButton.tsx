"use client";

import { useState } from "react";
import type { Season } from "@/lib/types";

export function CatalogueDownloadButton({ season, withPrices, primary }: { season: Season; withPrices: boolean; primary?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/catalogue-pdf?season=${season}&prices=${withPrices ? 1 : 0}`);
      if (!response.ok) throw new Error((await response.text()) || "Δεν έγινε το PDF. Δοκίμασε ξανά.");
      const name = /filename="([^"]+)"/.exec(response.headers.get("Content-Disposition") ?? "")?.[1] ?? "Hector-katalogos.pdf";
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Δεν έγινε το PDF. Δοκίμασε ξανά.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className={
          primary
            ? "w-full border border-ink bg-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-60"
            : "w-full border border-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-stone-100 disabled:opacity-60"
        }
      >
        {busy ? "Ετοιμάζεται…" : withPrices ? "PDF με τιμές" : "PDF χωρίς τιμές"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-ember">
          {error}
        </p>
      )}
    </div>
  );
}
