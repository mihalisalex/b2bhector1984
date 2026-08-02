"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  bulkEditProductSeoAction,
  generateMissingAltTextAction,
  generateMissingProductSeoAction,
} from "@/lib/seoActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import type { FormState } from "@/lib/actions";

const initialState: FormState = {};

export interface BulkProductRow {
  id: string;
  styleNumber: string;
  name: string;
  category: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  robots: string;
  canonicalUrl: string;
  hasCustomTitle: boolean;
  hasCustomDescription: boolean;
}

const FIELDS = [
  { value: "seoTitle", label: "SEO title" },
  { value: "metaDescription", label: "Meta description" },
  { value: "focusKeyword", label: "Focus keyword" },
  { value: "secondaryKeywords", label: "Secondary keywords" },
  { value: "canonicalUrl", label: "Canonical URL" },
  { value: "robots", label: "Robots directive" },
  { value: "ogTitle", label: "Open Graph title" },
  { value: "ogDescription", label: "Open Graph description" },
];

export function BulkSeoTools({ products, canEdit }: { products: BulkProductRow[]; canEdit: boolean }) {
  const [query, setQuery] = useState("");
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      if (onlyIncomplete && product.hasCustomTitle && product.hasCustomDescription) return false;
      if (!needle) return true;
      return (
        product.name.toLowerCase().includes(needle) ||
        product.styleNumber.toLowerCase().includes(needle) ||
        product.category.toLowerCase().includes(needle)
      );
    });
  }, [products, query, onlyIncomplete]);

  // Prune selection to what's visible, so a filter change can't leave rows
  // selected that the admin can no longer see (the same bug that was fixed in
  // the admin orders table).
  const visibleIds = useMemo(() => new Set(filtered.map((product) => product.id)), [filtered]);
  const selectedVisible = useMemo(() => [...selected].filter((id) => visibleIds.has(id)), [selected, visibleIds]);

  const allVisibleSelected = filtered.length > 0 && selectedVisible.length === filtered.length;

  function toggleAll() {
    setSelected(allVisibleSelected ? new Set() : new Set(filtered.map((product) => product.id)));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-8">
      {canEdit && (
        <section className="grid gap-4 lg:grid-cols-2">
          <GenerateMissingSeoCard />
          <GenerateAltTextCard />
        </section>
      )}

      <section>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">Bulk edit</h2>
        <p className="mt-1 max-w-3xl text-sm text-ink-soft">
          Select products, pick a field, and apply one value to all of them. Placeholders{" "}
          <code className="font-mono-tab">{"{name}"}</code>,{" "}
          <code className="font-mono-tab">{"{category}"}</code>,{" "}
          <code className="font-mono-tab">{"{season}"}</code>,{" "}
          <code className="font-mono-tab">{"{styleNumber}"}</code> and{" "}
          <code className="font-mono-tab">{"{brand}"}</code> are substituted per product — use them, or
          every selected product ends up with an identical (and duplicate-flagged) value.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter products…"
            aria-label="Filter products"
            className="w-64 border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
          />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={onlyIncomplete}
              onChange={(event) => setOnlyIncomplete(event.target.checked)}
              className="h-4 w-4 accent-ink"
            />
            Only products missing title or description
          </label>
          <span className="text-xs text-ink-soft">
            {filtered.length} of {products.length}
          </span>
          <div className="ml-auto">
            <ExportButton products={filtered} />
          </div>
        </div>

        {canEdit && selectedVisible.length > 0 && <BulkEditBar ids={selectedVisible} onDone={() => setSelected(new Set())} />}

        <div className="scroll-thin mt-4 overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-stone-300 bg-stone-50 text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                {canEdit && (
                  <th scope="col" className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      aria-label="Select all visible products"
                      className="h-4 w-4 accent-ink"
                    />
                  </th>
                )}
                <th scope="col" className="px-4 py-2.5 font-semibold">Product</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">SEO title</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Meta description</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Focus keyword</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Robots</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-stone-200 last:border-0 align-top">
                  {canEdit && (
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggle(product.id)}
                        aria-label={`Select ${product.name}`}
                        className="h-4 w-4 accent-ink"
                      />
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <a
                      href={`/admin/products/${product.id}?tab=seo`}
                      className="text-ink underline underline-offset-2"
                    >
                      {product.name}
                    </a>
                    <span className="block font-mono-tab text-xs text-ink-soft">{product.styleNumber}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    <ValueCell value={product.seoTitle} isCustom={product.hasCustomTitle} />
                  </td>
                  <td className="max-w-xs px-4 py-2.5 text-xs">
                    <ValueCell value={product.metaDescription} isCustom={product.hasCustomDescription} />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-ink-soft">{product.focusKeyword || "—"}</td>
                  <td className="px-4 py-2.5 font-mono-tab text-xs text-ink-soft">{product.robots}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/** Distinguishes admin-written copy from the generated fallback — the two are not the same thing. */
function ValueCell({ value, isCustom }: { value: string; isCustom: boolean }) {
  return (
    <span className={isCustom ? "text-ink" : "text-ink-soft italic"}>
      {value || "—"}
      {!isCustom && value && <span className="ml-1 not-italic text-[10px] uppercase">(auto)</span>}
    </span>
  );
}

function GenerateMissingSeoCard() {
  const [state, formAction, isPending] = useActionState(generateMissingProductSeoAction, initialState);
  const showResult = useToastResult();
  useEffect(() => {
    if (state.error || state.success) showResult(state);
  }, [state, showResult]);

  const [overwrite, setOverwrite] = useState(false);

  return (
    <form
      action={formAction}
      className="border border-stone-300 bg-white p-4"
      onSubmit={(event) => {
        if (overwrite && !window.confirm("This replaces every hand-written SEO title and description with generated copy. Continue?")) {
          event.preventDefault();
        }
      }}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Fill in missing SEO copy</h3>
      <p className="mt-1.5 text-sm text-ink-soft">
        Writes a generated title and meta description for every product that doesn&rsquo;t have one,
        built from its name, category, tagline and materials.
      </p>
      <label className="mt-3 flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="overwrite"
          checked={overwrite}
          onChange={(event) => setOverwrite(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-ink"
        />
        <span>
          Also overwrite copy that was written by hand
          <span className="mt-0.5 block text-xs text-ember">Destructive — there&rsquo;s no undo.</span>
        </span>
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="mt-3 border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
      >
        {isPending ? "Generating…" : "Generate"}
      </button>
    </form>
  );
}

function GenerateAltTextCard() {
  const [state, formAction, isPending] = useActionState(generateMissingAltTextAction, initialState);
  const showResult = useToastResult();
  useEffect(() => {
    if (state.error || state.success) showResult(state);
  }, [state, showResult]);

  return (
    <form action={formAction} className="border border-stone-300 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Generate missing alt text</h3>
      <p className="mt-1.5 text-sm text-ink-soft">
        Writes descriptive alt text for every product photo that has none, using the product name and
        category. Never touches alt text that already exists.
      </p>
      <p className="mt-2 text-xs text-ink-soft">
        Alt text is an accessibility requirement first and an SEO signal second — screen-reader users
        depend on it.
      </p>
      <button
        type="submit"
        disabled={isPending}
        className="mt-3 border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
      >
        {isPending ? "Writing…" : "Generate alt text"}
      </button>
    </form>
  );
}

function BulkEditBar({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(bulkEditProductSeoAction, initialState);
  const showResult = useToastResult();
  useEffect(() => {
    if (state.error || state.success) showResult(state);
    if (state.success) onDone();
  }, [state, showResult, onDone]);

  const [field, setField] = useState("seoTitle");

  return (
    <form
      action={formAction}
      className="mt-4 flex flex-wrap items-end gap-3 border border-stone-300 bg-stone-50 px-4 py-3"
      onSubmit={(event) => {
        if (!window.confirm(`Apply this value to ${ids.length} product(s)? Existing values will be replaced.`)) {
          event.preventDefault();
        }
      }}
    >
      {ids.map((id) => (
        <input key={id} type="hidden" name="ids" value={id} />
      ))}
      <span className="self-center text-sm text-ink">{ids.length} selected</span>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Field</span>
        <select
          name="field"
          value={field}
          onChange={(event) => setField(event.target.value)}
          className="border border-stone-300 bg-white px-3 py-2 text-sm"
        >
          {FIELDS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>

      <label className="block min-w-64 flex-1">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Value</span>
        {field === "robots" ? (
          <select name="value" className="w-full border border-stone-300 bg-white px-3 py-2 text-sm">
            <option value="index,follow">Index, Follow</option>
            <option value="noindex,follow">No Index, Follow</option>
            <option value="index,nofollow">Index, No Follow</option>
            <option value="noindex,nofollow">No Index, No Follow</option>
          </select>
        ) : (
          <input
            name="value"
            placeholder="{name} — {category} | Hector 1984"
            className="w-full border border-stone-300 px-3 py-2 text-sm"
          />
        )}
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
      >
        {isPending ? "Applying…" : "Apply"}
      </button>
    </form>
  );
}

function ExportButton({ products }: { products: BulkProductRow[] }) {
  function exportCsv() {
    const escape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
    const rows = [
      ["styleNumber", "name", "slug", "seoTitle", "metaDescription", "focusKeyword", "canonicalUrl", "robots"].join(","),
      ...products.map((product) =>
        [
          escape(product.styleNumber),
          escape(product.name),
          escape(product.slug),
          escape(product.seoTitle),
          escape(product.metaDescription),
          escape(product.focusKeyword),
          escape(product.canonicalUrl),
          escape(product.robots),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hector-product-seo.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportCsv}
      disabled={products.length === 0}
      className="border border-stone-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:border-ink disabled:opacity-40"
    >
      Export CSV
    </button>
  );
}
