"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatEUR } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { toCsv } from "@/lib/csv";
import { useToastResult } from "@/components/ui/ToastProvider";
import {
  duplicateProductAction,
  setProductQuickFieldAction,
  bulkAdjustPriceAction,
  bulkArchiveAction,
  bulkDeleteAction,
  bulkAddTagAction,
  bulkUpdateStatusAction,
} from "@/lib/productActions";
import { hasGreekCopy, missingGreekFields } from "@/lib/localizeStyle";
import { campaignImageUrl } from "@/lib/campaignEmail";
import type { ProductRow } from "@/lib/data/productAdmin";
import type { ProductStatus, Style } from "@/lib/types";

const STATUS_LABEL: Record<ProductStatus | "out_of_stock", string> = {
  active: "Ενεργό",
  draft: "Πρόχειρο",
  archived: "Αρχειοθετημένο",
  private: "Ιδιωτικό",
  out_of_stock: "Εξαντλημένο",
};

const CATEGORY_GREEK: Record<string, string> = {
  boots: "Μπότες",
  formal: "Επίσημα",
  wedding: "Γαμπριάτικα",
  loafers: "Loafers",
  sneakers: "Sneakers",
  anatomic: "Ανατομικά",
  sandals: "Σανδάλια",
};

const STATUS_CLASS: Record<ProductStatus | "out_of_stock", string> = {
  active: "bg-positive-100 text-positive",
  draft: "bg-stone-200 text-ink-soft",
  archived: "bg-court-100 text-court",
  private: "bg-stone-200 text-ink-soft",
  out_of_stock: "bg-ember-100 text-ember",
};

type BulkMode = "status" | "archive" | "delete" | "price" | "tag";

export function ProductsBrowser({ items }: { items: ProductRow[] }) {
  // Fixed once per mount: reading the clock during render is impure.
  const [renderedAt] = useState(() => Date.now());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState<BulkMode>("status");
  const [bulkStatus, setBulkStatus] = useState<ProductStatus>("active");
  const [bulkPriceMode, setBulkPriceMode] = useState<"set" | "increase_pct" | "decrease_pct">("increase_pct");
  const [bulkPriceValue, setBulkPriceValue] = useState("10");
  const [bulkTag, setBulkTag] = useState("");
  const [isPending, startTransition] = useTransition();
  const showResult = useToastResult();
  const router = useRouter();

  // Drop any selected id no longer in the current (filtered/paginated) list —
  // otherwise a bulk action after changing filters/pages can silently act on
  // off-screen rows the admin can no longer see.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing selection to the current external item list, not derived render state
    setSelected((prev) => {
      const visibleIds = new Set(items.map((i) => i.id));
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  // Counted over the page being shown, matching "{n} shown" beside it — a total across the
  // whole catalogue would contradict the number next to it whenever a filter is applied.
  // The catalogue-wide figure is on the page header, which knows the unfiltered total.
  const missingGreekCount = items.filter((i) => !hasGreekCopy(i)).length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyBulk() {
    const ids = Array.from(selected);
    if (bulkMode === "delete" && !confirm(
      `Οριστική διαγραφή ${ids.length} προϊόντων; Δεν αναιρείται: φεύγουν και οι φωτογραφίες και τα έγγραφά τους. ` +
      `Οι παλιές παραγγελίες κρατούν τις γραμμές τους, αλλά το προϊόν θα φαίνεται διαγραμμένο.`,
    )) return;
    startTransition(async () => {
      let result;
      switch (bulkMode) {
        case "status":
          result = await bulkUpdateStatusAction(ids, bulkStatus);
          break;
        case "archive":
          result = await bulkArchiveAction(ids);
          break;
        case "delete":
          result = await bulkDeleteAction(ids);
          break;
        case "price":
          result = await bulkAdjustPriceAction(ids, bulkPriceMode, Number(bulkPriceValue) || 0);
          break;
        case "tag":
          result = await bulkAddTagAction(ids, bulkTag);
          break;
      }
      showResult(result);
      if (!result?.error) setSelected(new Set());
    });
  }

  function exportCsv() {
    const header = [
      "SKU", "Name", "Category", "Brand", "Supplier", "Price", "Sale Price", "Cost Price", "Margin %",
      "Stock", "Reserved", "Status", "Featured", "Created", "Updated",
    ];
    const rows = items.map((p) => [
      p.styleNumber, p.name, p.category, p.brandName, p.supplierName ?? "", p.basePrice, p.salePrice ?? "", p.costPrice,
      p.marginPct, p.onHand, p.reserved, p.derivedStatus, p.featured ? "Yes" : "No", formatDate(p.createdAt), formatDate(p.createdAt),
    ]);
    download(toCsv([header, ...rows]), "hector-footwear-products.csv");
  }

  /**
   * The Greek-copy worksheet. Deliberately a *separate* export from the operational one
   * above: this is a translation job, and pouring price, stock and margin columns into it
   * would bury the four fields being written under eleven that aren't.
   *
   * Shape is chosen for writing rather than for reading. Each English source column sits
   * immediately left of the empty Greek column it feeds, so the translator never has to
   * scroll sideways to see what they are translating, and `Slug` is included so the
   * product page can be opened alongside — you asked to translate in context, not guess
   * which field you are filling.
   *
   * Ordered featured-first, then by catalogue order, so the styles that carry the launch
   * are the ones at the top of the file.
   */
  function exportGreekCopyCsv() {
    // Headers are chosen so the filled file re-imports with zero mapping work: "SKU" and
    // "Name" are what the importer matches and requires, and the four _el headers match
    // `guessMapping`'s table exactly. "Slug"/"Featured"/"Has Greek?" fall through to
    // Ignore, which is what they are — context for the translator, not data coming back.
    //
    // "Name" is NOT labelled "do not translate" in the header despite that being the
    // intent: the importer requires a name on every row, and a decorated header would map
    // to Ignore and fail validation on all 31. The instruction lives in the README instead.
    const header = [
      "SKU", "Slug", "Name", "Featured", "Has Greek?",
      "Tagline (EN)", "tagline_el",
      "Description (EN)", "description_el",
      "Materials (EN, pipe-separated)", "materials_el",
      "Last note (EN)", "last_note_el",
    ];
    const ordered = [...items].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    const rows = ordered.map((p) => [
      p.styleNumber,
      p.slug,
      p.name,
      p.featured ? "Yes" : "No",
      hasGreekCopy(p) ? "Yes" : "No",
      p.tagline,
      p.taglineEl ?? "",
      p.description,
      p.descriptionEl ?? "",
      p.materials.join(" | "),
      (p.materialsEl ?? []).join(" | "),
      p.lastNote,
      p.lastNoteEl ?? "",
    ]);
    download(toCsv([header, ...rows]), "hector-footwear-greek-copy.csv");
  }

  /**
   * A BOM is prepended, and it matters here specifically. Excel on Windows opens a CSV as
   * the system ANSI codepage unless one is present, which renders every Greek character as
   * mojibake — and this is the one export whose whole purpose is Greek text going out and
   * coming back. Without it the round-trip corrupts on the owner's own machine.
   */
  function download(csv: string, filename: string) {
    const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-ink-soft">
            {selected.size > 0 ? `${selected.size} επιλεγμένα` : `${items.length} σε αυτή τη σελίδα`}
          </span>
          {missingGreekCount > 0 && <span className="text-sm text-ember">{missingGreekCount} χωρίς ελληνικά</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportGreekCopyCsv}
            className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            Αρχείο ελληνικών (CSV)
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            Εξαγωγή (CSV)
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-3 border border-stone-300 bg-stone-100 px-4 py-3 shadow-sm">
          <select
            value={bulkMode}
            onChange={(e) => setBulkMode(e.target.value as BulkMode)}
            className="border border-stone-300 bg-white px-2 py-1.5 text-xs outline-none focus-visible:border-signal"
            aria-label="Μαζική ενέργεια"
          >
            <option value="status">Αλλαγή κατάστασης</option>
            <option value="price">Αλλαγή τιμής</option>
            <option value="archive">Αρχειοθέτηση</option>
            <option value="tag">Προσθήκη ετικέτας</option>
            <option value="delete">Διαγραφή</option>
          </select>

          {bulkMode === "status" && (
            <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as ProductStatus)} className="border border-stone-300 bg-white px-2 py-1.5 text-xs">
              <option value="active">Ενεργό</option>
              <option value="draft">Πρόχειρο</option>
              <option value="archived">Αρχειοθετημένο</option>
            </select>
          )}
          {bulkMode === "price" && (
            <>
              <select value={bulkPriceMode} onChange={(e) => setBulkPriceMode(e.target.value as typeof bulkPriceMode)} className="border border-stone-300 bg-white px-2 py-1.5 text-xs">
                <option value="increase_pct">Αύξηση %</option>
                <option value="decrease_pct">Μείωση %</option>
                <option value="set">Συγκεκριμένη τιμή (€)</option>
              </select>
              <input
                type="number"
                value={bulkPriceValue}
                onChange={(e) => setBulkPriceValue(e.target.value)}
                className="w-24 border border-stone-300 bg-white px-2 py-1.5 text-xs"
                aria-label="Τιμή"
              />
            </>
          )}
          {bulkMode === "tag" && (
            <input
              type="text"
              value={bulkTag}
              onChange={(e) => setBulkTag(e.target.value)}
              placeholder="ετικέτα"
              className="w-32 border border-stone-300 bg-white px-2 py-1.5 text-xs"
            />
          )}

          <button
            type="button"
            onClick={applyBulk}
            disabled={isPending}
            className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50 ${
              bulkMode === "delete" ? "bg-ember hover:bg-ember/85" : "bg-ink hover:bg-ink/85"
            }`}
          >
            {isPending ? "Εφαρμογή…" : bulkMode === "delete" ? `Διαγραφή ${selected.size}` : `Εφαρμογή σε ${selected.size}`}
          </button>
        </div>
      )}

      <div className="scroll-thin overflow-x-auto border border-stone-300 bg-white">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 text-left text-xs text-ink-soft">
              <th className="px-3 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Επιλογή όλων" />
              </th>
              <th className="px-3 py-3 font-medium">Προϊόν</th>
              <th className="px-3 py-3 font-medium">Κατηγορία</th>
              <th className="px-3 py-3 font-medium">Σεζόν</th>
              <th className="px-3 py-3 text-right font-medium">Χονδρική</th>
              <th className="px-3 py-3 text-right font-medium">Λιανική</th>
              <th className="px-3 py-3 text-center font-medium">Νέο</th>
              <th className="px-3 py-3 font-medium">Κατάσταση</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const onSale = p.salePrice !== undefined && (!p.saleEndAt || new Date(p.saleEndAt).getTime() > renderedAt);
              return (
                <tr key={p.id} className="border-b border-stone-200 last:border-b-0 hover:bg-stone-50">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} aria-label={`Επιλογή ${p.name}`} />
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <span className="relative block h-14 w-14 shrink-0 overflow-hidden bg-stone-100">
                        {p.primaryImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- our own resizer, see /api/img
                          <img src={campaignImageUrl(p.primaryImageUrl, 240)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[10px] text-ember">χωρίς φωτό</span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-ink hover:underline">{p.name}</span>
                        <span className="block text-xs text-ink-soft">
                          {p.styleNumber}
                          {!hasGreekCopy(p) && <span title={`Λείπουν: ${missingGreekFields(p).join(", ")}`} className="text-ember"> · λείπουν ελληνικά</span>}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-ink-soft">{CATEGORY_GREEK[p.category] ?? p.category}</td>
                  <td className="px-3 py-2">
                    <select
                      key={p.season}
                      defaultValue={p.season}
                      disabled={isPending}
                      aria-label={`Σεζόν ${p.name}`}
                      onChange={(e) => startTransition(async () => showResult(await setProductQuickFieldAction(p.id, { season: e.target.value as Style["season"] })))}
                      className="border border-stone-300 bg-white px-2 py-1 text-xs outline-none focus-visible:border-signal"
                    >
                      <option value="summer">Καλοκαιρινό</option>
                      <option value="winter">Χειμερινό</option>
                      <option value="both">Και οι δύο</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink">
                    {onSale ? (
                      <>
                        {formatEUR(p.salePrice!)} <span className="text-xs text-ink-soft line-through">{formatEUR(p.basePrice)}</span>
                      </>
                    ) : (
                      formatEUR(p.basePrice)
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink-soft">{formatEUR(p.msrp)}</td>
                  <td className="px-3 py-2 text-center">
                    <input
                      key={String(p.newArrival)}
                      type="checkbox"
                      defaultChecked={p.newArrival}
                      disabled={isPending}
                      aria-label={`Νέο μοντέλο ${p.name}`}
                      onChange={(e) => startTransition(async () => showResult(await setProductQuickFieldAction(p.id, { newArrival: e.target.checked })))}
                      className="h-4 w-4 accent-ink"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 text-xs ${STATUS_CLASS[p.derivedStatus]}`}>{STATUS_LABEL[p.derivedStatus]}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-xs font-medium text-ink hover:underline">
                      Επεξεργασία
                    </Link>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => startTransition(async () => {
                        const result = await duplicateProductAction(p.id);
                        if (result.error) { showResult({ error: result.error }); return; }
                        router.push(`/admin/products/${result.id}?newColour=1`);
                      })}
                      className="ml-3 text-xs font-medium text-ink-soft hover:text-ink"
                    >
                      Νέο χρώμα
                    </button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-ink-soft">
                  Κανένα προϊόν με αυτά τα φίλτρα.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
