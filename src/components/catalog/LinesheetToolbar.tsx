"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { t } from "@/i18n/format";
import { categoryLabel } from "@/lib/data/styleLabels";
import type { Style } from "@/lib/types";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { getUnitPrice } from "@/lib/pricing";
import { toCsv } from "@/lib/csv";
import { Button } from "@/components/ui/Button";
import { useChargesVat } from "@/lib/cart-context";

export function LinesheetToolbar({ styles, priceMultiplier = 1 }: { styles: Style[]; priceMultiplier?: number }) {
  const { dict } = useI18n();
  const chargesVat = useChargesVat();
  const d = dict.dashboard;
  function exportCsv() {
    const header = [
      d.csvStyleNumber,
      d.csvName,
      d.csvCategory,
      d.csvAvailability,
      d.csvColorways,
      d.csvBoxOptions,
      d.csvPrice,
      d.csvVatRate,
    ];
    const rows = styles.map((s) => {
      return [
        s.styleNumber,
        s.name,
        categoryLabel(dict, s.category),
        s.availability === "available" ? dict.catalog.availableNow : t(d.csvPrebook, { window: s.shipWindow ?? "" }),
        s.colorways.map((c) => c.name).join(" / "),
        getAvailableBoxTypes(s).map((b) => b.totalPairs).join(" / ") + d.csvPairSuffix,
        getUnitPrice(s, "net60", priceMultiplier).toFixed(2),
        chargesVat && s.vatRate ? `${Math.round(s.vatRate * 100)}%` : "0%",
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
        {d.print}
      </Button>
      <Button type="button" size="sm" onClick={exportCsv}>
        {d.exportCsv}
      </Button>
    </div>
  );
}
