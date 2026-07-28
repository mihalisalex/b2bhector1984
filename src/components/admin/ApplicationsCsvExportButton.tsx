"use client";

import { formatDate } from "@/lib/format";
import type { Application } from "@/lib/types";

export function ApplicationsCsvExportButton({ applications }: { applications: Application[] }) {
  function exportCsv() {
    const header = ["Business", "Contact", "Email", "Status", "Submitted"];
    const rows = applications.map((a) => [a.businessName, a.contactName, a.email, a.status, formatDate(a.submittedAt)]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hector-1984-applications.csv";
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
