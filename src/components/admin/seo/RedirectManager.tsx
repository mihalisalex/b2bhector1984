"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  bulkDeleteRedirectsAction,
  createRedirectAction,
  deleteRedirectAction,
  importRedirectsAction,
  updateRedirectAction,
} from "@/lib/seoActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import type { FormState } from "@/lib/actions";
import type { SeoRedirect } from "@/lib/data/seoRedirects";

const initialState: FormState = {};

const STATUS_OPTIONS = [
  { value: "301", label: "301 — Permanent" },
  { value: "302", label: "302 — Temporary" },
  { value: "307", label: "307 — Temporary, keeps method" },
  { value: "308", label: "308 — Permanent, keeps method" },
];

const SOURCE_LABEL: Record<SeoRedirect["source"], string> = {
  manual: "Manual",
  slug_change: "Auto (slug change)",
  import: "Imported",
};

export function RedirectManager({ redirects, canEdit }: { redirects: SeoRedirect[]; canEdit: boolean }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return redirects;
    return redirects.filter(
      (redirect) =>
        redirect.fromPath.toLowerCase().includes(needle) ||
        redirect.toPath.toLowerCase().includes(needle) ||
        (redirect.notes ?? "").toLowerCase().includes(needle),
    );
  }, [redirects, query]);

  // Selection is keyed by id, so it has to be pruned when the filter changes —
  // otherwise a bulk delete could remove rows the admin can no longer see.
  const visibleIds = useMemo(() => new Set(filtered.map((redirect) => redirect.id)), [filtered]);
  const selectedVisible = useMemo(
    () => [...selected].filter((id) => visibleIds.has(id)),
    [selected, visibleIds],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {canEdit && <CreateRedirectForm />}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter redirects…"
          aria-label="Filter redirects"
          className="w-64 border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
        />
        <span className="text-xs text-ink-soft">
          {filtered.length} of {redirects.length}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <ExportButton redirects={filtered} />
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowImport((open) => !open)}
              className="border border-stone-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:border-ink"
            >
              {showImport ? "Close import" : "Import CSV"}
            </button>
          )}
        </div>
      </div>

      {showImport && canEdit && <ImportForm onDone={() => setShowImport(false)} />}

      {canEdit && selectedVisible.length > 0 && <BulkDeleteBar ids={selectedVisible} onDone={() => setSelected(new Set())} />}

      {filtered.length === 0 ? (
        <p className="border border-stone-300 bg-white px-4 py-6 text-center text-sm text-ink-soft">
          {redirects.length === 0
            ? "No redirects yet. Renaming a product URL creates one automatically."
            : "No redirects match that filter."}
        </p>
      ) : (
        <div className="scroll-thin overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-stone-300 bg-stone-50 text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                {canEdit && <th scope="col" className="w-10 px-3 py-2.5" />}
                <th scope="col" className="px-4 py-2.5 font-semibold">From</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">To</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Origin</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Hits</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">State</th>
                {canEdit && <th scope="col" className="px-4 py-2.5 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((redirect) =>
                editing === redirect.id ? (
                  <EditRow key={redirect.id} redirect={redirect} onDone={() => setEditing(null)} />
                ) : (
                  <tr key={redirect.id} className="border-b border-stone-200 last:border-0">
                    {canEdit && (
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.has(redirect.id)}
                          onChange={() => toggle(redirect.id)}
                          aria-label={`Select redirect from ${redirect.fromPath}`}
                          className="h-4 w-4 accent-ink"
                        />
                      </td>
                    )}
                    <td className="px-4 py-2.5 font-mono-tab text-xs text-ink">{redirect.fromPath}</td>
                    <td className="px-4 py-2.5 font-mono-tab text-xs text-ink-soft">{redirect.toPath}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{redirect.statusCode}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-soft">{SOURCE_LABEL[redirect.source]}</td>
                    <td className="px-4 py-2.5 text-right font-mono-tab text-xs text-ink-soft">{redirect.hitCount}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          redirect.enabled ? "bg-positive text-white" : "bg-stone-300 text-ink"
                        }`}
                      >
                        {redirect.enabled ? "Active" : "Off"}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setEditing(redirect.id)}
                          className="text-xs underline underline-offset-2 hover:text-ink"
                        >
                          Edit
                        </button>
                        <DeleteButton id={redirect.id} fromPath={redirect.fromPath} />
                      </td>
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateRedirectForm() {
  const [state, formAction, isPending] = useActionState(createRedirectAction, initialState);
  const showResult = useToastResult();
  useEffect(() => {
    if (state.error || state.success) showResult(state);
  }, [state, showResult]);

  return (
    <form action={formAction} className="border border-stone-300 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Add a redirect</p>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto]">
        <label className="block">
          <span className="sr-only">From path</span>
          <input
            name="fromPath"
            required
            placeholder="/old-url"
            className="w-full border border-stone-300 px-3 py-2 font-mono-tab text-sm outline-none focus-visible:border-signal"
          />
        </label>
        <label className="block">
          <span className="sr-only">To path</span>
          <input
            name="toPath"
            required
            placeholder="/new-url"
            className="w-full border border-stone-300 px-3 py-2 font-mono-tab text-sm outline-none focus-visible:border-signal"
          />
        </label>
        <label className="block">
          <span className="sr-only">Status code</span>
          <select
            name="statusCode"
            defaultValue="301"
            className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add"}
        </button>
      </div>
      <input
        name="notes"
        placeholder="Note (optional) — why this redirect exists"
        className="mt-3 w-full border border-stone-300 px-3 py-2 text-sm outline-none focus-visible:border-signal"
      />
      <p className="mt-2 text-xs text-ink-soft">
        Loops and chains are rejected before saving. Query strings are carried across automatically.
      </p>
    </form>
  );
}

function EditRow({ redirect, onDone }: { redirect: SeoRedirect; onDone: () => void }) {
  const action = updateRedirectAction.bind(null, redirect.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (state.error || state.success) showResult(state);
    if (state.success) onDone();
  }, [state, showResult, onDone]);

  return (
    <tr className="border-b border-stone-200 bg-stone-50 last:border-0">
      <td colSpan={8} className="px-4 py-3">
        <form action={formAction} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto_auto_auto]">
          <input
            name="fromPath"
            defaultValue={redirect.fromPath}
            required
            aria-label="From path"
            className="w-full border border-stone-300 px-3 py-2 font-mono-tab text-sm"
          />
          <input
            name="toPath"
            defaultValue={redirect.toPath}
            required
            aria-label="To path"
            className="w-full border border-stone-300 px-3 py-2 font-mono-tab text-sm"
          />
          <select
            name="statusCode"
            defaultValue={String(redirect.statusCode)}
            aria-label="Status code"
            className="border border-stone-300 bg-white px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" name="enabled" defaultChecked={redirect.enabled} className="h-4 w-4 accent-ink" />
            Active
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-soft"
          >
            Cancel
          </button>
          <input
            name="notes"
            defaultValue={redirect.notes ?? ""}
            placeholder="Note"
            aria-label="Note"
            className="w-full border border-stone-300 px-3 py-2 text-sm lg:col-span-6"
          />
        </form>
      </td>
    </tr>
  );
}

function DeleteButton({ id, fromPath }: { id: string; fromPath: string }) {
  return (
    <form
      action={deleteRedirectAction.bind(null, id)}
      className="inline"
      // A deleted redirect silently 404s every old link that depended on it, so
      // this confirms rather than firing on a stray click.
      onSubmit={(event) => {
        if (!window.confirm(`Delete the redirect from ${fromPath}? Old links to it will start 404-ing.`)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="ml-3 text-xs text-ember underline underline-offset-2">
        Delete
      </button>
    </form>
  );
}

function BulkDeleteBar({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(bulkDeleteRedirectsAction, initialState);
  const showResult = useToastResult();
  useEffect(() => {
    if (state.error || state.success) showResult(state);
    if (state.success) onDone();
  }, [state, showResult, onDone]);

  return (
    <form
      action={formAction}
      className="flex items-center gap-3 border border-stone-300 bg-stone-50 px-4 py-2.5"
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${ids.length} redirect(s)? Old links to them will start 404-ing.`)) {
          event.preventDefault();
        }
      }}
    >
      {ids.map((id) => (
        <input key={id} type="hidden" name="ids" value={id} />
      ))}
      <span className="text-sm text-ink">{ids.length} selected</span>
      <button
        type="submit"
        disabled={isPending}
        className="border border-ember bg-ember px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
      >
        {isPending ? "Deleting…" : "Delete selected"}
      </button>
    </form>
  );
}

function ImportForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(importRedirectsAction, initialState);
  const showResult = useToastResult();
  useEffect(() => {
    if (state.error || state.success) showResult(state);
    if (state.success) onDone();
  }, [state, showResult, onDone]);

  return (
    <form action={formAction} className="border border-stone-300 bg-white p-4">
      <label htmlFor="csv" className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">
        Paste CSV — <span className="font-mono-tab normal-case">from,to,status</span>
      </label>
      <p className="mt-1 text-xs text-ink-soft">
        A header row is detected and skipped. Status defaults to 301. Rows that would create a loop
        are reported and skipped — one bad line never aborts the import.
      </p>
      <textarea
        id="csv"
        name="csv"
        rows={6}
        placeholder={"/old-loafer,/product/riviera-loafer,301\n/lookbook,/collections,302"}
        className="scroll-thin mt-2 w-full border border-stone-300 px-3 py-2 font-mono-tab text-xs outline-none focus-visible:border-signal"
      />
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
      >
        {isPending ? "Importing…" : "Import"}
      </button>
    </form>
  );
}

/**
 * Client-side CSV download, matching the Blob-download pattern already used by
 * the orders and linesheet exports rather than adding a download route.
 */
function ExportButton({ redirects }: { redirects: SeoRedirect[] }) {
  function exportCsv() {
    const escape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
    const rows = [
      ["from", "to", "status", "enabled", "source", "hits", "notes"].join(","),
      ...redirects.map((redirect) =>
        [
          escape(redirect.fromPath),
          escape(redirect.toPath),
          String(redirect.statusCode),
          String(redirect.enabled),
          redirect.source,
          String(redirect.hitCount),
          escape(redirect.notes ?? ""),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hector-redirects.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportCsv}
      disabled={redirects.length === 0}
      className="border border-stone-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:border-ink disabled:opacity-40"
    >
      Export CSV
    </button>
  );
}
