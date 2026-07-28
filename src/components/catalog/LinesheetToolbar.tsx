"use client";

import type { Style } from "@/lib/types";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";

export function LinesheetToolbar({ styles }: { styles: Style[] }) {
  function exportCsv() {
    const header = ["Style #", "Name", "Category", "Availability", "Colorways", "Box Options", "Min Boxes", "Wholesale Price"];
    const rows = styles.map((s) => {
      return [
        s.styleNumber,
        s.name,
        s.category,
        s.availability === "available" ? "Available now" : `Pre-book (${s.shipWindow ?? ""})`,
        s.colorways.map((c) => c.name).join(" / "),
        getAvailableBoxTypes(s).map((b) => b.totalPairs).join(" / ") + "-pair",
        String(s.moqBoxes),
        s.basePrice.toFixed(2),
      ];
    });
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hector-1984-linesheet.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white"
      >
        Print
      </button>
      <button
        type="button"
        onClick={exportCsv}
        className="bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
      >
        Export CSV
      </button>
    </div>
  );
}
