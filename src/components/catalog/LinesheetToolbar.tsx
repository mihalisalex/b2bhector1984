"use client";

import type { Style } from "@/lib/types";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { getUnitPrice } from "@/lib/pricing";
import { toCsv } from "@/lib/csv";
import { Button } from "@/components/ui/Button";

export function LinesheetToolbar({ styles, priceMultiplier = 1 }: { styles: Style[]; priceMultiplier?: number }) {
  function exportCsv() {
    const header = [
      "Style #",
      "Name",
      "Category",
      "Availability",
      "Colorways",
      "Box Options",
      "Wholesale Price (EUR, excl. VAT)",
      "VAT Rate",
    ];
    const rows = styles.map((s) => {
      return [
        s.styleNumber,
        s.name,
        s.category,
        s.availability === "available" ? "Available now" : `Pre-book (${s.shipWindow ?? ""})`,
        s.colorways.map((c) => c.name).join(" / "),
        getAvailableBoxTypes(s).map((b) => b.totalPairs).join(" / ") + "-pair",
        getUnitPrice(s, "net60", priceMultiplier).toFixed(2),
        s.vatRate ? `${Math.round(s.vatRate * 100)}%` : "—",
      ];
    });
    const csv = toCsv([header, ...rows]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hector-footwear-linesheet.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
        Print
      </Button>
      <Button type="button" size="sm" onClick={exportCsv}>
        Export CSV
      </Button>
    </div>
  );
}
