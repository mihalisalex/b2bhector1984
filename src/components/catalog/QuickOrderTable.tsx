"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { lookupSku } from "@/lib/skuIndex";
import { useCart } from "@/lib/cart-context";
import { BOX_TYPES } from "@/lib/data/boxTypes";
import { formatUSD, validateMatrix } from "@/lib/pricing";
import type { BoxTypeId, Style } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Row {
  id: string;
  sku: string;
  boxTypeId: BoxTypeId | "";
  qty: string;
}

function emptyRow(id: string): Row {
  return { id, sku: "", boxTypeId: "", qty: "" };
}

export function QuickOrderTable() {
  const { tier, addLines } = useCart();
  const idBase = useId();
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: 6 }, (_, i) => emptyRow(`${idBase}-${i}`)),
  );
  const [confirmed, setConfirmed] = useState(false);

  function updateRow(id: string, patch: Partial<Row>) {
    setConfirmed(false);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(`${idBase}-${prev.length}-${Date.now()}`)]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const resolved = useMemo(
    () =>
      rows.map((row) => {
        if (!row.sku.trim() || !row.boxTypeId || !row.qty.trim()) return { row, match: null, error: null };
        const match = lookupSku(row.sku);
        if (!match) return { row, match: null, error: "SKU not found" };
        const qty = Number(row.qty);
        if (!Number.isFinite(qty) || qty <= 0) return { row, match: null, error: "Quantity must be greater than 0" };
        return { row, match, error: null, qty };
      }),
    [rows],
  );

  const byStyle = useMemo(() => {
    const map = new Map<string, { style: Style; qty: Record<string, Partial<Record<BoxTypeId, number>>> }>();
    for (const r of resolved) {
      if (!r.match || r.error || !r.row.boxTypeId) continue;
      const key = r.match.style.id;
      if (!map.has(key)) map.set(key, { style: r.match.style, qty: {} });
      const entry = map.get(key)!;
      entry.qty[r.match.colorway.id] = entry.qty[r.match.colorway.id] || {};
      const boxTypeId = r.row.boxTypeId as BoxTypeId;
      entry.qty[r.match.colorway.id]![boxTypeId] = (entry.qty[r.match.colorway.id]![boxTypeId] || 0) + (r.qty ?? 0);
    }
    return map;
  }, [resolved]);

  const validations = useMemo(
    () => Array.from(byStyle.entries()).map(([styleId, { style, qty }]) => ({ styleId, style, qty, ...validateMatrix(style, tier, qty) })),
    [byStyle, tier],
  );

  const anyErrors = resolved.some((r) => r.error) || validations.some((v) => v.orderError);
  const hasEntries = resolved.some((r) => r.match);
  const grandTotal = validations.reduce((sum, v) => sum + v.subtotal, 0);

  function handleSubmit() {
    if (!hasEntries || anyErrors) return;
    for (const { styleId, qty } of validations) {
      const style = byStyle.get(styleId)!.style;
      const entries = style.colorways.flatMap((c) =>
        Object.entries(qty[c.id] ?? {}).map(([boxTypeId, q]) => ({
          colorwayId: c.id,
          boxTypeId: boxTypeId as BoxTypeId,
          qty: q as number,
        })),
      );
      addLines(styleId, entries);
    }
    setRows(Array.from({ length: 6 }, (_, i) => emptyRow(`${idBase}-reset-${i}`)));
    setConfirmed(true);
  }

  return (
    <div>
      <div className="scroll-thin overflow-x-auto border border-stone-300 bg-white">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-100 text-left">
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">SKU</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Box</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Qty</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Match</th>
              <th className="px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const r = resolved.find((x) => x.row.id === row.id)!;
              return (
                <tr key={row.id} className="border-b border-stone-200 last:border-b-0">
                  <td className="p-1.5">
                    <input
                      value={row.sku}
                      onChange={(e) => updateRow(row.id, { sku: e.target.value })}
                      placeholder="HR-1001-CIN"
                      className="font-mono-tab w-full border border-stone-300 bg-white px-2 py-1.5 text-xs uppercase outline-none focus-visible:border-signal"
                    />
                  </td>
                  <td className="p-1.5">
                    <select
                      value={row.boxTypeId}
                      onChange={(e) => updateRow(row.id, { boxTypeId: e.target.value as BoxTypeId })}
                      className="font-mono-tab w-28 border border-stone-300 bg-white px-2 py-1.5 text-xs outline-none focus-visible:border-signal"
                    >
                      <option value="">Box…</option>
                      {BOX_TYPES.map((b) => (
                        <option key={b.id} value={b.id}>{b.totalPairs}-pair</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1.5 text-right">
                    <input
                      value={row.qty}
                      onChange={(e) => updateRow(row.id, { qty: e.target.value })}
                      placeholder="0"
                      inputMode="numeric"
                      className="font-mono-tab w-16 border border-stone-300 bg-white px-2 py-1.5 text-right text-xs outline-none focus-visible:border-signal"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-xs">
                    {r.error && <span className="text-ember">{r.error}</span>}
                    {r.match && <span className="text-ink-soft">{r.match.style.name} — {r.match.colorway.name}</span>}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button type="button" onClick={() => removeRow(row.id)} className="text-xs text-ink-soft hover:text-ember" aria-label="Remove row">
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 text-xs font-semibold uppercase tracking-wide text-signal hover:underline"
      >
        + Add row
      </button>

      {validations.length > 0 && (
        <div className="mt-6 border border-stone-300 bg-stone-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Order summary by style</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {validations.map((v) => (
              <div key={v.styleId} className="flex items-center justify-between text-sm">
                <Link href={`/product/${v.style.slug}`} className="text-ink hover:underline">
                  {v.style.name}
                </Link>
                <span className="flex items-center gap-3">
                  <span className="font-mono-tab text-ink-soft">{v.totalBoxes} boxes · {v.totalPairs} pairs</span>
                  {v.orderError ? (
                    <span className="text-xs text-ember">{v.orderError}</span>
                  ) : (
                    <span className="font-mono-tab font-semibold text-ink">{formatUSD(v.subtotal)}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-stone-300 pt-4">
        <div className="flex items-center gap-4">
          <span className="font-mono-tab text-sm font-semibold text-ink">Total: {formatUSD(grandTotal)}</span>
          {confirmed && !hasEntries && <span className="text-xs text-positive">Added to cart.</span>}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasEntries || anyErrors}
          className={cn(
            "bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-ink/85",
            (!hasEntries || anyErrors) && "cursor-not-allowed bg-cinder-300 text-white/70",
          )}
        >
          Add All to Cart
        </button>
      </div>
    </div>
  );
}
