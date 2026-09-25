"use client";

import { t } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { withLocale } from "@/i18n/paths";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { getUnitPrice, isOnSale, MAX_BACKORDER_QTY, validateMatrix } from "@/lib/pricing";
import { useDelivery, useFormat } from "@/i18n/I18nProvider";
import { TermsSwitch } from "@/components/product/TermsSwitch";
import { parsePastedOrder } from "@/lib/pasteOrder";
import { VatSuffix } from "@/components/ui/VatSuffix";
import { categoryLabel, genderLabel, getStyleImageUrl } from "@/lib/data/styleLabels";
import type { StyleInventory } from "@/lib/data/inventory";
import type { BoxTypeId, Style } from "@/lib/types";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { StepIcon } from "@/components/ui/StepIcon";
import { StylePlate } from "@/components/product/StylePlate";
import { cn } from "@/lib/cn";

/**
 * Every +/- writes straight to the cart via `setLineQty` — there is no local staging
 * state, no "dirty cell" tracking, and no "Add all to cart" button to commit it. Each
 * stepper's value IS the live cart quantity for that style/colorway/box line, read
 * straight off `lines`, so this table can never drift from what's actually in the cart.
 */
export function OrderableLinesheet({
  styles,
  inventory,
  priceMultiplier = 1,
}: {
  styles: Style[];
  inventory: Record<string, StyleInventory>;
  priceMultiplier?: number;
}) {
  const { eur } = useFormat();
  const { dict, locale } = useI18n();
  const d = dict.dashboard;
  const { lines, setLineQty, chargesVat, terms } = useCart();
  const { arrivalLabel } = useDelivery();
  const styleById = useMemo(() => new Map(styles.map((s) => [s.id, s])), [styles]);

  function qtyFor(styleId: string, colorwayId: string, boxTypeId: BoxTypeId): number {
    return lines.find((l) => l.styleId === styleId && l.colorwayId === colorwayId && l.boxTypeId === boxTypeId)?.qty ?? 0;
  }

  function setQty(styleId: string, colorwayId: string, boxTypeId: BoxTypeId, value: number) {
    const onHand = inventory[styleId]?.[colorwayId]?.[boxTypeId] ?? 0;
    const allowBackorder = styleById.get(styleId)?.allowBackorder ?? false;
    const maxSelectable = allowBackorder ? MAX_BACKORDER_QTY : onHand;
    setLineQty(styleId, colorwayId, boxTypeId, Math.min(maxSelectable, Math.max(0, Math.floor(value) || 0)));
  }

  function step(styleId: string, colorwayId: string, boxTypeId: BoxTypeId, delta: number) {
    setQty(styleId, colorwayId, boxTypeId, qtyFor(styleId, colorwayId, boxTypeId) + delta);
  }

  // Live "what's in the cart" summary, scoped to the styles currently shown in this table.
  const qtyByStyle = useMemo(() => {
    const map: Record<string, Record<string, Partial<Record<BoxTypeId, number>>>> = {};
    for (const line of lines) {
      map[line.styleId] = map[line.styleId] || {};
      map[line.styleId][line.colorwayId] = { ...map[line.styleId][line.colorwayId], [line.boxTypeId]: line.qty };
    }
    return map;
  }, [lines]);

  const validations = useMemo(
    () =>
      styles
        .map((style) => ({ style, ...validateMatrix(style, qtyByStyle[style.id] ?? {}, terms, priceMultiplier) }))
        .filter((v) => v.totalBoxes > 0),
    [styles, qtyByStyle, priceMultiplier, terms],
  );

  const subtotal = validations.reduce((sum, v) => sum + v.subtotal, 0);
  const vatTotal = chargesVat ? validations.reduce((sum, v) => sum + v.subtotal * (v.style.vatRate ?? 0), 0) : 0;
  const grandTotal = subtotal + vatTotal;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <TermsSwitch className="w-full max-w-md" />
      </div>
      <PasteOrder styles={styles} />

      {/* Mobile / tablet: one card per style, steppers wrap instead of requiring horizontal scroll. */}
      <div className="flex flex-col gap-3 lg:hidden">
        {styles.map((style) => {
          const boxTypes = getAvailableBoxTypes(style);
          return (
            <div key={style.id} className="border border-stone-300 bg-white">
              <div className="flex items-center gap-3 border-b border-stone-200 p-3">
                <StylePlate
                  swatch={style.colorways[0].swatch}
                  imageUrl={getStyleImageUrl(style)}
                  alt={style.name}
                  className="h-16 w-20 shrink-0"
                  dense
                />
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${style.slug}`} className="font-medium text-ink hover:underline">
                    {style.name}
                  </Link>
                  <p className="font-mono-tab text-[11px] text-ink-soft">
                    {style.styleNumber} · {genderLabel(dict, style.gender)} · {categoryLabel(dict, style.category)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <AvailabilityBadge style={style} />
                    <span className={cn("text-sm font-semibold tabular-nums", isOnSale(style) ? "text-burgundy" : "text-ink")}>
                      {eur(getUnitPrice(style, terms, priceMultiplier))}
                      <VatSuffix vatRate={style.vatRate} className="text-xs font-normal text-ink-soft" />
                    </span>
                    {isOnSale(style) && (
                      <span className="bg-burgundy px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">{dict.catalog.saleBadge}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col divide-y divide-stone-200">
                {style.colorways.map((colorway) => (
                  <div key={colorway.id} className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-6 shrink-0 overflow-hidden border border-stone-300" aria-hidden>
                        <span className="h-full w-1/2" style={{ background: colorway.swatch[0] }} />
                        <span className="h-full w-1/2" style={{ background: colorway.swatch[1] ?? colorway.swatch[0] }} />
                      </span>
                      <span className="text-sm text-ink-soft">{colorway.name}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {boxTypes.map((box) => (
                        <div key={box.id} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">{box.label}</span>
                          <Stepper
                            value={qtyFor(style.id, colorway.id, box.id)}
                            onChange={(v) => setQty(style.id, colorway.id, box.id, v)}
                            onStep={(d) => step(style.id, colorway.id, box.id, d)}
                            label={t(d.boxQtyAria, { name: style.name, colour: colorway.name })}
                            onHand={inventory[style.id]?.[colorway.id]?.[box.id] ?? 0}
                            allowBackorder={style.allowBackorder}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: the order sheet. One row per style and colour, one box column (each style
          is sold in exactly one box format — the old 8/10/12 columns were two-thirds dashes),
          and the numbers a buyer adds up in their head worked out per row. Type a number and
          Tab to the next row; every change is the live cart. */}
      <div className="scroll-thin hidden overflow-x-auto border border-stone-300 bg-white lg:block">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <caption className="sr-only">{d.linesheetCaption}</caption>
          <thead>
            <tr className="border-b border-stone-300 bg-stone-100 text-left text-xs text-ink-soft">
              <Th>{dict.orderDetail.thStyle}</Th>
              <Th>{dict.orderDetail.thColorway}</Th>
              <Th>{d.thBox}</Th>
              <Th align="right">{d.thPerPair}</Th>
              <Th align="center">{d.thBoxes}</Th>
              <Th align="right">{d.thPairs}</Th>
              <Th align="right">{d.thLineTotal}</Th>
              <Th>{d.thArrives}</Th>
            </tr>
          </thead>
          <tbody>
            {styles.map((style) => {
              const boxTypes = getAvailableBoxTypes(style);
              const unitPrice = getUnitPrice(style, terms, priceMultiplier);
              return style.colorways.flatMap((colorway, i) =>
                boxTypes.map((box, j) => {
                  const qty = qtyFor(style.id, colorway.id, box.id);
                  const onHand = inventory[style.id]?.[colorway.id]?.[box.id] ?? 0;
                  const fromStock = onHand > 0 && qty <= onHand;
                  const first = i === 0 && j === 0;
                  return (
                    <tr
                      key={`${style.id}-${colorway.id}-${box.id}`}
                      className={cn(
                        "border-b border-stone-200 last:border-b-0 hover:bg-stone-50",
                        qty > 0 && "bg-positive-100/40",
                        first && "border-t border-t-stone-400",
                      )}
                    >
                      <td className="px-3 py-2">
                        {first ? (
                          <div className="flex items-center gap-3">
                            <StylePlate
                              swatch={style.colorways[0].swatch}
                              imageUrl={getStyleImageUrl(style)}
                              alt={style.name}
                              className="h-10 w-14 shrink-0"
                              dense
                            />
                            <div className="min-w-0">
                              <Link href={`/product/${style.slug}`} className="font-medium text-ink hover:underline">
                                {style.name}
                              </Link>
                              <p className="font-mono-tab text-[11px] text-ink-soft">{style.styleNumber}</p>
                            </div>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2">
                          <span className="flex h-4 w-6 shrink-0 overflow-hidden border border-stone-300" aria-hidden>
                            <span className="h-full w-1/2" style={{ background: colorway.swatch[0] }} />
                            <span className="h-full w-1/2" style={{ background: colorway.swatch[1] ?? colorway.swatch[0] }} />
                          </span>
                          <span className="text-ink">{colorway.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 tabular-nums text-ink-soft">{t(dict.catalog.boxOfLabel, { pairs: box.totalPairs })}</td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", isOnSale(style) ? "text-burgundy" : "text-ink")}>
                        {eur(unitPrice)}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <Stepper
                          value={qty}
                          onChange={(v) => setQty(style.id, colorway.id, box.id, v)}
                          onStep={(delta) => step(style.id, colorway.id, box.id, delta)}
                          label={t(d.boxQtyAria, { name: style.name, colour: colorway.name })}
                          onHand={onHand}
                          allowBackorder={style.allowBackorder}
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-ink-soft">{qty > 0 ? qty * box.totalPairs : "—"}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-ink">
                        {qty > 0 ? eur(unitPrice * box.totalPairs * qty) : "—"}
                      </td>
                      <td className="px-3 py-2 font-mono-tab text-xs text-ink-soft">
                        {fromStock ? d.inStock5Days : arrivalLabel}
                      </td>
                    </tr>
                  );
                }),
              );
            })}
          </tbody>
        </table>
      </div>

      {validations.length > 0 && (
        <div className="mt-6 border border-stone-300 bg-stone-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{d.inYourCartFromList}</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {validations.map((v) => (
              <div key={v.style.id} className="flex items-center justify-between text-sm">
                <Link href={`/product/${v.style.slug}`} className="text-ink hover:underline">
                  {v.style.name}
                </Link>
                <span className="flex items-center gap-3">
                  <span className="font-mono-tab text-ink-soft">{t(d.boxesPairs, { boxes: v.totalBoxes, pairs: v.totalPairs })}</span>
                  <span className="font-semibold tabular-nums text-ink">
                    {eur(v.subtotal)}
                    <VatSuffix vatRate={v.style.vatRate} className="text-xs font-normal text-ink-soft" />
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky: the running total and the way to the cart stay on screen however long the
          sheet gets. */}
      <div className="sticky bottom-0 z-10 mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-stone-300 bg-stone-50/95 py-3 backdrop-blur">
        <div className="text-sm text-ink">
          {vatTotal > 0 && (
            <p className="text-xs text-ink-soft">{t(d.sheetSubtotalVat, { subtotal: eur(subtotal), vat: eur(vatTotal) })}</p>
          )}
          <span className="font-semibold tabular-nums">{t(d.sheetTotal, { total: eur(grandTotal) })}</span>
        </div>
        <LinkButton href={withLocale(locale, "/cart")} size="md" className={validations.length === 0 ? "pointer-events-none opacity-40" : ""}>
          {d.goToCart}
        </LinkButton>
      </div>
    </div>
  );
}

/** Paste lines from Excel, an email or WhatsApp ("5109 brown 3") straight into the cart. */
function PasteOrder({ styles }: { styles: Style[] }) {
  const { dict } = useI18n();
  const d = dict.dashboard;
  const { lines, setLineQty } = useCart();
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ added: number; unmatched: string[] } | null>(null);

  function apply() {
    const { matched, unmatched } = parsePastedOrder(text, styles);
    // Same style/colour twice in one paste adds up; anything already in the cart is added to.
    const totals = new Map<string, (typeof matched)[number]>();
    for (const m of matched) {
      const key = `${m.styleId}|${m.colorwayId}|${m.boxTypeId}`;
      const prev = totals.get(key);
      totals.set(key, prev ? { ...prev, qty: prev.qty + m.qty } : m);
    }
    for (const m of totals.values()) {
      const existing = lines.find((l) => l.styleId === m.styleId && l.colorwayId === m.colorwayId && l.boxTypeId === m.boxTypeId)?.qty ?? 0;
      setLineQty(m.styleId, m.colorwayId, m.boxTypeId, Math.min(MAX_BACKORDER_QTY, existing + m.qty));
    }
    setResult({ added: matched.length, unmatched });
    setText(unmatched.join("\n"));
  }

  return (
    <details className="group mb-5 border border-dashed border-stone-400 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {d.pasteTitle}
        <span aria-hidden className="text-lg font-normal text-ink-soft transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="grid gap-3 px-4 pb-4">
        <p className="text-xs text-ink-soft">{d.pasteHelp}</p>
        <textarea
          id="paste-order"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
          }}
          rows={5}
          placeholder={"5109 brown 3\n5109 black 2\n272 tan 2"}
          aria-label={d.pasteTitle}
          className="font-mono-tab w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:border-signal"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" onClick={apply} disabled={!text.trim()}>
            {d.pasteAdd}
          </Button>
          {result && result.added > 0 && (
            <p role="status" className="text-xs font-medium text-positive">{t(d.pasteAdded, { count: result.added })}</p>
          )}
        </div>
        {result && result.unmatched.length > 0 && (
          <p role="alert" className="text-xs text-ember">
            {d.pasteUnmatched} <span className="font-mono-tab">{result.unmatched.join(" · ")}</span>
          </p>
        )}
      </div>
    </details>
  );
}

function Stepper({
  value,
  onChange,
  onStep,
  label,
  onHand,
  allowBackorder,
}: {
  value: number;
  onChange: (value: number) => void;
  onStep: (delta: number) => void;
  label: string;
  onHand: number;
  allowBackorder: boolean;
}) {
  const c = useI18n().dict.catalog;
  const outOfStock = onHand === 0 && !allowBackorder;
  const maxSelectable = allowBackorder ? MAX_BACKORDER_QTY : onHand;
  return (
    <div
      className={cn(
        "mx-auto flex w-24 items-center justify-between rounded-full border px-1 py-1",
        outOfStock ? "border-stone-300 opacity-60" : value > 0 ? "border-ink bg-white" : "border-stone-300 bg-white",
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={`${c.decreaseQty} — ${label}`}
        onClick={() => onStep(-1)}
        disabled={value === 0}
        className="flex h-6 w-6 items-center justify-center text-ink hover:text-signal disabled:opacity-30"
      >
        <StepIcon kind="minus" className="h-2.5 w-2.5" />
      </button>
      <input
        type="number"
        min={0}
        max={maxSelectable}
        inputMode="numeric"
        value={value || ""}
        placeholder="0"
        disabled={outOfStock}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        onFocus={(e) => e.target.select()}
        className="font-mono-tab w-8 border-0 bg-transparent text-center text-sm font-semibold tabular-nums text-ink outline-none disabled:cursor-not-allowed [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={`${c.increaseQty} — ${label}`}
        onClick={() => onStep(1)}
        disabled={value >= maxSelectable}
        className="flex h-6 w-6 items-center justify-center text-ink hover:text-signal disabled:opacity-30"
      >
        <StepIcon kind="plus" className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" | "center" }) {
  return (
    <th
      scope="col"
      className={cn(
        "px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft",
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      {children}
    </th>
  );
}
