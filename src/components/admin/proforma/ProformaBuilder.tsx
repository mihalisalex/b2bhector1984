"use client";

import { useMemo, useState } from "react";
import type { BoxTypeId, CreditTerms } from "@/lib/types";
import type { Locale } from "@/i18n/config";

export interface ProformaStyle {
  id: string;
  name: string;
  styleNumber: string;
  category: string;
  vatRate: number;
  colorways: { id: string; name: string }[];
  boxTypes: { id: BoxTypeId; label: string; totalPairs: number }[];
  unitPriceByTerms: Record<CreditTerms, number>;
}

export interface ProformaAccount {
  id: string;
  businessName: string;
  contactName: string;
  priceMultiplier: number;
  locale: Locale;
  shipTo: { label: string; line1: string; line2?: string; city: string; state: string; zip: string; isDefault?: boolean }[];
}

interface Line {
  /** Local row key — lines are freely added and removed, so index is not a stable key. */
  key: string;
  styleId: string;
  colorwayId: string;
  boxTypeId: BoxTypeId;
  qty: number;
}

const INPUT =
  "border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal";
const TERMS_LABEL: Record<CreditTerms, string> = {
  prepay: "Prepay — 10% off",
  net30: "Net 30 — 5% off",
  net60: "Net 60 — list price",
};
const LOCALE_LABEL: Record<Locale, string> = { el: "Greek", en: "English", de: "German", fr: "French" };

let nextKey = 0;
const newKey = () => `l${nextKey++}`;

export function ProformaBuilder({ styles, accounts }: { styles: ProformaStyle[]; accounts: ProformaAccount[] }) {
  const styleById = useMemo(() => new Map(styles.map((s) => [s.id, s])), [styles]);

  const [accountId, setAccountId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [terms, setTerms] = useState<CreditTerms>("net60");
  const [locale, setLocale] = useState<Locale>("el");
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedAccount = accounts.find((a) => a.id === accountId);

  /** Fills the address block from an account, leaving it editable — a customer's delivery
   *  address for one order is not necessarily the one on file. */
  function pickAccount(id: string) {
    setAccountId(id);
    const account = accounts.find((a) => a.id === id);
    if (!account) return;
    setBusinessName(account.businessName);
    setContactName(account.contactName);
    setLocale(account.locale);
    const ship = account.shipTo.find((s) => s.isDefault) ?? account.shipTo[0];
    setAddressLine1(ship?.line1 ?? "");
    setAddressLine2(ship?.line2 ?? "");
    setCity(ship?.city ?? "");
    setRegion(ship?.state ?? "");
    setPostalCode(ship?.zip ?? "");
  }

  function addLine() {
    const first = styles[0];
    setLines((prev) => [
      ...prev,
      {
        key: newKey(),
        styleId: first.id,
        colorwayId: first.colorways[0]?.id ?? "",
        boxTypeId: first.boxTypes[0]?.id ?? ("box10" as BoxTypeId),
        qty: 1,
      },
    ]);
  }

  /** Changing the style invalidates the colourway and box choice, which belong to it. */
  function setLineStyle(key: string, styleId: string) {
    const style = styleById.get(styleId);
    setLines((prev) =>
      prev.map((l) =>
        l.key === key
          ? {
              ...l,
              styleId,
              colorwayId: style?.colorways[0]?.id ?? "",
              boxTypeId: style?.boxTypes[0]?.id ?? l.boxTypeId,
            }
          : l,
      ),
    );
  }

  const totals = useMemo(() => {
    let net = 0;
    let vat = 0;
    let pairs = 0;
    let boxes = 0;
    for (const line of lines) {
      const style = styleById.get(line.styleId);
      const box = style?.boxTypes.find((b) => b.id === line.boxTypeId);
      if (!style || !box) continue;
      const linePairs = line.qty * box.totalPairs;
      const lineNet = linePairs * style.unitPriceByTerms[terms];
      net += lineNet;
      vat += lineNet * style.vatRate;
      pairs += linePairs;
      boxes += line.qty;
    }
    return { net, vat, gross: net + vat, pairs, boxes };
  }, [lines, terms, styleById]);

  const eur = (n: number) => n.toLocaleString("el-GR", { style: "currency", currency: "EUR" });

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/proforma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { businessName, contactName, addressLine1, addressLine2, city, region, postalCode },
          terms,
          locale,
          lines: lines.map(({ styleId, colorwayId, boxTypeId, qty }) => ({ styleId, colorwayId, boxTypeId, qty })),
        }),
      });
      if (!res.ok) {
        setError((await res.text()) || "Could not generate the proforma.");
        return;
      }
      // The filename comes from the server's Content-Disposition so the downloaded file is
      // named by the same PF- reference printed on the document.
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const named = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "proforma.pdf";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = named;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const canGenerate = businessName.trim().length > 0 && lines.length > 0 && !busy;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="grid gap-6">
        <section className="border border-stone-300 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Bill to</h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 sm:col-span-2">
              <span className="text-[11px] uppercase tracking-wide text-ink-soft">Existing account (optional)</span>
              <select value={accountId} onChange={(e) => pickAccount(e.target.value)} className={INPUT}>
                <option value="">— New recipient, type below —</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.businessName} · {a.contactName}
                  </option>
                ))}
              </select>
            </label>

            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Business name *" className={INPUT} />
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact name" className={INPUT} />
            <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Address line 1" className={INPUT} />
            <input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Address line 2" className={INPUT} />
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={INPUT} />
            <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region" className={INPUT} />
            <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Postal code" className={INPUT} />
          </div>

          {/* Negotiated pricing is NOT applied here — this quote uses catalogue prices at the
              chosen terms. Saying so out loud is the difference between a deliberate choice
              and quoting a long-standing customer the wrong number by accident. */}
          {selectedAccount && selectedAccount.priceMultiplier !== 1 && (
            <p className="mt-3 border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-ink">
              <strong>{selectedAccount.businessName}</strong> has negotiated pricing (×
              {selectedAccount.priceMultiplier}). This proforma uses standard catalogue prices at the selected terms,
              so it will not match what this account pays when they order themselves.
            </p>
          )}
        </section>

        <section className="border border-stone-300 bg-white p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Products</h2>
            <button type="button" onClick={addLine} className="border border-ink px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white">
              Add line
            </button>
          </div>

          {lines.length === 0 ? (
            <p className="mt-4 border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-ink-soft">
              No lines yet. Add one to start building the quote.
            </p>
          ) : (
            <div className="scroll-thin mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-300 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                    <th className="py-2 pr-3 font-semibold">Style</th>
                    <th className="py-2 pr-3 font-semibold">Colourway</th>
                    <th className="py-2 pr-3 font-semibold">Box</th>
                    <th className="py-2 pr-3 font-semibold">Boxes</th>
                    <th className="py-2 pr-3 text-right font-semibold">Pairs</th>
                    <th className="py-2 pr-3 text-right font-semibold">Line net</th>
                    <th className="py-2 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const style = styleById.get(line.styleId);
                    const box = style?.boxTypes.find((b) => b.id === line.boxTypeId);
                    const pairs = box ? line.qty * box.totalPairs : 0;
                    const lineNet = style ? pairs * style.unitPriceByTerms[terms] : 0;
                    return (
                      <tr key={line.key} className="border-b border-stone-200 last:border-b-0">
                        <td className="py-2 pr-3">
                          <select value={line.styleId} onChange={(e) => setLineStyle(line.key, e.target.value)} className={`${INPUT} w-full`}>
                            {styles.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.category} · {s.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-3">
                          <select
                            value={line.colorwayId}
                            onChange={(e) => setLines((p) => p.map((l) => (l.key === line.key ? { ...l, colorwayId: e.target.value } : l)))}
                            className={`${INPUT} w-full`}
                          >
                            {(style?.colorways ?? []).map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-3">
                          <select
                            value={line.boxTypeId}
                            onChange={(e) => setLines((p) => p.map((l) => (l.key === line.key ? { ...l, boxTypeId: e.target.value as BoxTypeId } : l)))}
                            className={`${INPUT} w-full`}
                          >
                            {(style?.boxTypes ?? []).map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            type="number"
                            min={1}
                            max={999}
                            value={line.qty}
                            onChange={(e) =>
                              setLines((p) =>
                                p.map((l) => (l.key === line.key ? { ...l, qty: Math.max(1, Math.min(999, Number(e.target.value) || 1)) } : l)),
                              )
                            }
                            className={`${INPUT} w-20`}
                          />
                        </td>
                        <td className="py-2 pr-3 text-right font-mono-tab tabular-nums text-ink">{pairs}</td>
                        <td className="py-2 pr-3 text-right font-mono-tab tabular-nums text-ink">{eur(lineNet)}</td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setLines((p) => p.filter((l) => l.key !== line.key))}
                            aria-label="Remove line"
                            className="px-2 py-1 text-xs uppercase tracking-wide text-ink-soft hover:text-ember"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <aside className="border border-stone-300 bg-white p-4 lg:sticky lg:top-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Terms &amp; totals</h2>

        <label className="mt-3 grid gap-1">
          <span className="text-[11px] uppercase tracking-wide text-ink-soft">Payment terms</span>
          <select value={terms} onChange={(e) => setTerms(e.target.value as CreditTerms)} className={INPUT}>
            {(Object.keys(TERMS_LABEL) as CreditTerms[]).map((t) => (
              <option key={t} value={t}>
                {TERMS_LABEL[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 grid gap-1">
          <span className="text-[11px] uppercase tracking-wide text-ink-soft">Document language</span>
          <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)} className={INPUT}>
            {(Object.keys(LOCALE_LABEL) as Locale[]).map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABEL[l]}
              </option>
            ))}
          </select>
        </label>

        <dl className="mt-4 grid grid-cols-2 gap-y-1.5 border-t border-stone-200 pt-4 text-sm">
          <dt className="text-ink-soft">Boxes</dt>
          <dd className="text-right font-mono-tab tabular-nums text-ink">{totals.boxes}</dd>
          <dt className="text-ink-soft">Pairs</dt>
          <dd className="text-right font-mono-tab tabular-nums text-ink">{totals.pairs}</dd>
          <dt className="text-ink-soft">Net</dt>
          <dd className="text-right font-mono-tab tabular-nums text-ink">{eur(totals.net)}</dd>
          <dt className="text-ink-soft">VAT</dt>
          <dd className="text-right font-mono-tab tabular-nums text-ink">{eur(totals.vat)}</dd>
          <dt className="pt-1 font-semibold text-ink">Total</dt>
          <dd className="pt-1 text-right font-mono-tab tabular-nums font-semibold text-ink">{eur(totals.gross)}</dd>
        </dl>

        {error && <p className="mt-3 text-xs leading-relaxed text-ember">{error}</p>}

        <button
          type="button"
          onClick={generate}
          disabled={!canGenerate}
          className="mt-4 w-full border border-ink bg-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
        >
          {busy ? "Generating…" : "Generate proforma PDF"}
        </button>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
          Downloads a PDF. No order is created and no stock is reserved.
        </p>
      </aside>
    </div>
  );
}
