"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { parseCsv, rowsToObjects } from "@/lib/csv";
import { validateImportRowsAction, importProductRowsAction } from "@/lib/productActions";
import type { ImportRow, ImportRowPreview, ImportRowResult } from "@/lib/data/productImport";

const TARGET_FIELDS: { value: keyof ImportRow | "ignore"; label: string }[] = [
  { value: "ignore", label: "— Ignore this column —" },
  { value: "styleNumber", label: "Style number (required, matches existing)" },
  { value: "name", label: "Product name (required)" },
  { value: "category", label: "Category" },
  { value: "season", label: "Season" },
  { value: "gender", label: "Gender" },
  { value: "tagline", label: "Short description" },
  { value: "description", label: "Full description" },
  { value: "taglineEl", label: "Short description — Greek" },
  { value: "descriptionEl", label: "Full description — Greek" },
  { value: "materialsEl", label: "Materials — Greek (pipe-separated)" },
  { value: "lastNoteEl", label: "Last note — Greek" },
  { value: "basePrice", label: "Wholesale price" },
  { value: "msrp", label: "MSRP" },
  { value: "costPrice", label: "Cost price" },
  { value: "brandName", label: "Brand name" },
  { value: "tags", label: "Tags (comma/semicolon-separated)" },
];

function guessMapping(column: string): keyof ImportRow | "ignore" {
  const key = column.toLowerCase().replace(/[^a-z0-9]/g, "");
  const table: Record<string, keyof ImportRow> = {
    stylenumber: "styleNumber", sku: "styleNumber", style: "styleNumber",
    name: "name", productname: "name", title: "name",
    category: "category", season: "season", gender: "gender",
    tagline: "tagline", shortdescription: "tagline",
    description: "description", fulldescription: "description",
    // Match the exact headers the "Greek copy CSV" export writes, so a round-trip of that
    // file auto-maps every column and the owner never touches the mapping step.
    taglineel: "taglineEl", descriptionel: "descriptionEl",
    materialsel: "materialsEl", lastnoteel: "lastNoteEl",
    price: "basePrice", wholesaleprice: "basePrice", baseprice: "basePrice",
    msrp: "msrp", retailprice: "msrp",
    cost: "costPrice", costprice: "costPrice",
    brand: "brandName", brandname: "brandName",
    tags: "tags",
  };
  return table[key] ?? "ignore";
}

async function parseFile(file: File): Promise<Record<string, string>[]> {
  const text = await file.text();
  if (file.name.endsWith(".json")) {
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [data];
  }
  if (file.name.endsWith(".xml")) {
    // Loaded on demand: fast-xml-parser is ~67KB of the client bundle and CSV/JSON are
    // the common import formats, so it shouldn't be downloaded until an XML file is picked.
    const { XMLParser } = await import("fast-xml-parser");
    const parser = new XMLParser({ ignoreAttributes: false });
    const data = parser.parse(text);
    const root = data.products?.product ?? data.rows?.row ?? data.root?.row ?? Object.values(data)[0];
    const rows = Array.isArray(root) ? root : [root];
    return rows.map((r: Record<string, unknown>) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v)])));
  }
  return rowsToObjects(parseCsv(text));
}

type Step = "upload" | "map" | "preview" | "done";

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, keyof ImportRow | "ignore">>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ImportRowPreview[]>([]);
  const [results, setResults] = useState<ImportRowResult[]>([]);
  const [isPending, startTransition] = useTransition();

  async function handleFile(file: File) {
    setFileError(null);
    try {
      const rows = await parseFile(file);
      if (rows.length === 0) {
        setFileError("No rows found in that file.");
        return;
      }
      const cols = Object.keys(rows[0]);
      setColumns(cols);
      setMapping(Object.fromEntries(cols.map((c) => [c, guessMapping(c)])));
      setRawRows(rows);
      setStep("map");
    } catch (err) {
      setFileError(err instanceof Error ? `Couldn't parse that file: ${err.message}` : "Couldn't parse that file.");
    }
  }

  const mappedRows: ImportRow[] = useMemo(() => {
    return rawRows.map((raw) => {
      const row: Partial<ImportRow> = {};
      for (const col of columns) {
        const target = mapping[col];
        if (target && target !== "ignore") row[target] = raw[col];
      }
      return row as ImportRow;
    });
  }, [rawRows, columns, mapping]);

  function goToPreview() {
    startTransition(async () => {
      const v = await validateImportRowsAction(mappedRows);
      setValidation(v);
      setStep("preview");
    });
  }

  function confirmImport() {
    startTransition(async () => {
      const validRows = mappedRows.filter((_, i) => validation[i].errors.length === 0);
      const r = await importProductRowsAction(validRows);
      setResults(r);
      setStep("done");
    });
  }

  const errorCount = validation.filter((v) => v.errors.length > 0).length;
  const updateCount = validation.filter((v) => v.errors.length === 0 && v.action === "update").length;
  const createCount = validation.length - errorCount - updateCount;

  return (
    <div className="max-w-3xl space-y-6">
      {step === "upload" && (
        <div className="border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
          <p className="text-sm text-ink-soft">Upload a CSV, JSON, or XML file of products.</p>
          <p className="mt-1 text-xs text-ink-soft">
            (&ldquo;Excel&rdquo; import means CSV — the format Excel itself opens/saves natively — rather than the
            binary .xlsx format, since the only npm-available parser for that has an unpatched high-severity
            vulnerability with no fix.)
          </p>
          <input
            type="file"
            accept=".csv,.json,.xml"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            className="mx-auto mt-4 block text-sm text-ink-soft file:mr-3 file:border file:border-stone-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-ink"
          />
          {fileError && <p className="mt-3 text-sm text-ember">{fileError}</p>}
        </div>
      )}

      {step === "map" && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Map columns ({rawRows.length} rows detected)</h3>
          <div className="mt-3 space-y-2">
            {columns.map((col) => (
              <div key={col} className="flex items-center gap-3 border border-stone-300 bg-white px-3 py-2">
                <span className="w-40 shrink-0 truncate text-sm font-medium text-ink">{col}</span>
                <span className="text-ink-soft">→</span>
                <select
                  value={mapping[col]}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [col]: e.target.value as keyof ImportRow | "ignore" }))}
                  className="flex-1 border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none focus-visible:border-signal"
                >
                  {TARGET_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={goToPreview}
            disabled={isPending}
            className="mt-4 border border-ink bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
          >
            {isPending ? "Validating…" : "Validate & preview"}
          </button>
        </div>
      )}

      {step === "preview" && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Preview — {createCount} to create, {updateCount} to update, {errorCount} with errors
          </h3>
          {updateCount > 0 && (
            <p className="mt-1 text-xs text-ember">
              {updateCount} row{updateCount === 1 ? "" : "s"} matched an existing style number and will overwrite that
              product&rsquo;s fields — check the &ldquo;Action&rdquo; column below before importing.
            </p>
          )}
          <div className="scroll-thin mt-3 max-h-96 overflow-auto border border-stone-300 bg-white">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Style #</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Errors</th>
                </tr>
              </thead>
              <tbody>
                {validation.map((v, i) => (
                  <tr key={v.row} className={`border-b border-stone-200 last:border-b-0 ${v.errors.length > 0 ? "bg-ember-100" : v.action === "update" ? "bg-court-100" : ""}`}>
                    <td className="px-3 py-1.5 text-ink-soft">{v.row}</td>
                    <td className="px-3 py-1.5 text-ink">{v.styleNumber || "—"}</td>
                    <td className="px-3 py-1.5 text-ink-soft">{mappedRows[i]?.name || "—"}</td>
                    <td className="px-3 py-1.5 text-ink-soft">
                      {v.errors.length > 0 ? "—" : v.action === "update" ? `Update "${v.existingName}"` : "Create new"}
                    </td>
                    <td className="px-3 py-1.5 text-ember">{v.errors.join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={() => setStep("map")} className="border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:border-ink">
              Back
            </button>
            <button
              type="button"
              onClick={confirmImport}
              disabled={isPending || validation.length - errorCount === 0}
              className="border border-ink bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
            >
              {isPending ? "Importing…" : `Import ${validation.length - errorCount} valid rows`}
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Done — {results.filter((r) => r.action === "created").length} created, {results.filter((r) => r.action === "updated").length} updated
          </h3>
          <div className="scroll-thin mt-3 max-h-96 overflow-auto border border-stone-300 bg-white">
            <table className="w-full min-w-[500px] border-collapse text-sm">
              <tbody>
                {results.map((r) => (
                  <tr key={r.row} className="border-b border-stone-200 last:border-b-0">
                    <td className="px-3 py-1.5 text-ink-soft">Row {r.row}</td>
                    <td className="px-3 py-1.5 text-ink">{r.styleNumber}</td>
                    <td className="px-3 py-1.5 font-semibold uppercase text-xs text-ink-soft">{r.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link href="/admin/products" className="mt-4 inline-block border border-ink bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85">
            Back to Products
          </Link>
        </div>
      )}
    </div>
  );
}
