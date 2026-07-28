"use client";

import { formatEUR, summarizeOrder } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import type { AdminOrder } from "@/lib/runtimeOrders";

export function OrdersCsvExportButton({ orders }: { orders: AdminOrder[] }) {
  function exportCsv() {
    const header = ["Order", "Business", "Placed", "Terms", "Status", "Total (EUR)"];
    const rows = orders.map((o) => {
      const { total } = summarizeOrder(o);
      return [o.id, o.businessName, formatDate(o.placedAt), o.terms.toUpperCase(), o.status, formatEUR(total)];
    });
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hector-1984-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportCsv}
      className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white"
    >
      Export CSV
    </button>
  );
}
