import { getUnitPrice } from "@/lib/pricing";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { generateOrderId } from "@/lib/orderId";
import { LOCALES, type Locale } from "@/i18n/config";
import type { BoxTypeId, CreditTerms, OrderLine, Style } from "@/lib/types";
import type { StyleInventory } from "@/lib/data/inventory";

/**
 * The admin's custom proforma builder — the model layer.
 *
 * WHAT THIS IS FOR. A retailer turns up at the office, or phones, and wants a quote on the
 * spot. They may have no account at all. This turns a hand-built basket into the same
 * proforma PDF the shop issues, addressed to whoever you type in.
 *
 * WHAT IT DELIBERATELY IS NOT. It writes nothing. No row in `orders`, no line in
 * `order_lines`, no inventory decrement, nothing in anyone's order history. A quote that
 * silently reserved stock would be the worst possible surprise here — you would hand over
 * a piece of paper and quietly take units off the shelf for an order that may never come.
 * The reference is minted with a `PF-` prefix rather than `ORD-` so the distinction is
 * legible on the document itself.
 *
 * Because nothing is written, every guard in this file is about the DOCUMENT being right:
 * a colorway that belongs to the style it is listed under, a box format the style is
 * actually sold in, a price computed by the same function checkout uses. A quote with a
 * price the shop cannot honour is worse than no quote.
 */

export interface ProformaRecipient {
  businessName: string;
  contactName: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
}

export interface ProformaDraftLine {
  styleId: string;
  colorwayId: string;
  boxTypeId: BoxTypeId;
  /** Number of boxes. */
  qty: number;
}

export interface ProformaDraft {
  recipient: ProformaRecipient;
  terms: CreditTerms;
  /** Language of the document, not of the admin. A Greek walk-in gets a Greek proforma. */
  locale: Locale;
  lines: ProformaDraftLine[];
}

const TERMS: CreditTerms[] = ["prepay", "net30", "net60"];
/** Same ceiling the storefront steppers use. A quote for 10,000 boxes is a typo. */
const MAX_QTY = 999;

export class ProformaError extends Error {}

/** Narrows unknown JSON from the request body into a draft, or throws with a usable reason. */
export function parseProformaDraft(input: unknown): ProformaDraft {
  if (typeof input !== "object" || input === null) throw new ProformaError("Malformed request body.");
  const raw = input as Record<string, unknown>;

  const recipientRaw = (raw.recipient ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const businessName = str(recipientRaw.businessName);
  const contactName = str(recipientRaw.contactName);
  if (!businessName) throw new ProformaError("Business name is required — it is who the proforma is addressed to.");

  const terms = raw.terms;
  if (typeof terms !== "string" || !TERMS.includes(terms as CreditTerms)) {
    throw new ProformaError("Choose payment terms: prepay, net 30 or net 60.");
  }

  const locale = raw.locale;
  if (typeof locale !== "string" || !LOCALES.includes(locale as Locale)) {
    throw new ProformaError("Choose a document language.");
  }

  if (!Array.isArray(raw.lines) || raw.lines.length === 0) {
    throw new ProformaError("Add at least one product before generating a proforma.");
  }

  const lines: ProformaDraftLine[] = raw.lines.map((lineRaw, i) => {
    const line = (lineRaw ?? {}) as Record<string, unknown>;
    const qty = Number(line.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      throw new ProformaError(`Line ${i + 1}: quantity must be a whole number between 1 and ${MAX_QTY}.`);
    }
    const styleId = str(line.styleId);
    const colorwayId = str(line.colorwayId);
    const boxTypeId = str(line.boxTypeId);
    if (!styleId || !colorwayId || !boxTypeId) throw new ProformaError(`Line ${i + 1}: incomplete.`);
    return { styleId, colorwayId, boxTypeId: boxTypeId as BoxTypeId, qty };
  });

  return {
    recipient: {
      businessName,
      contactName,
      addressLine1: str(recipientRaw.addressLine1) || undefined,
      addressLine2: str(recipientRaw.addressLine2) || undefined,
      city: str(recipientRaw.city) || undefined,
      region: str(recipientRaw.region) || undefined,
      postalCode: str(recipientRaw.postalCode) || undefined,
    },
    terms: terms as CreditTerms,
    locale: locale as Locale,
    lines,
  };
}

export interface ResolvedProforma {
  reference: string;
  lines: OrderLine[];
  shipTo?: { label: string; line1: string; line2?: string; city: string; state: string; zip: string };
}

/**
 * Turns a validated draft into the shape `buildInvoicePdf` consumes.
 *
 * `inventoryByStyle` is read, never written: it only decides whether a line prints as
 * "in stock" or "in production", which on a quote is information the buyer wants and an
 * inventory movement they must not cause.
 */
export function resolveProforma(
  draft: ProformaDraft,
  styleById: Map<string, Style | undefined>,
  inventoryByStyle: Record<string, StyleInventory>,
  now: Date = new Date(),
): ResolvedProforma {
  const lines: OrderLine[] = draft.lines.map((line, i) => {
    const style = styleById.get(line.styleId);
    if (!style) throw new ProformaError(`Line ${i + 1}: that product no longer exists.`);

    const colorway = style.colorways.find((c) => c.id === line.colorwayId);
    if (!colorway) throw new ProformaError(`Line ${i + 1}: ${style.name} has no colourway matching that selection.`);

    // Not cosmetic: every style in this catalogue is sold in exactly one box format, and
    // quoting a format the shop does not pack is a promise it cannot keep.
    const allowed = getAvailableBoxTypes(style).map((b) => b.id);
    if (!allowed.includes(line.boxTypeId)) {
      throw new ProformaError(`Line ${i + 1}: ${style.name} is not sold in that box size.`);
    }

    // The same function checkout prices with. No per-account multiplier is applied — this
    // is a catalogue quote, and the builder warns when the picked account has negotiated
    // pricing that would differ.
    const unitPrice = getUnitPrice(style, draft.terms);

    const onHandBoxes = inventoryByStyle[line.styleId]?.[line.colorwayId]?.[line.boxTypeId] ?? 0;

    return {
      styleId: line.styleId,
      colorwayId: line.colorwayId,
      boxTypeId: line.boxTypeId,
      qty: line.qty,
      unitPrice,
      vatRate: style.vatRate,
      fulfillment: onHandBoxes >= line.qty ? "stock" : "production",
    };
  });

  const r = draft.recipient;
  const hasAddress = Boolean(r.addressLine1 || r.city || r.postalCode);

  return {
    reference: generateOrderId(now, "PF"),
    lines,
    // `shipTo` is the PDF's address block. Omitted entirely when nothing was typed, so a
    // quote for someone who only gave a name prints without a hollow address panel.
    shipTo: hasAddress
      ? {
          label: r.businessName,
          line1: r.addressLine1 ?? "",
          line2: r.addressLine2,
          city: r.city ?? "",
          state: r.region ?? "",
          zip: r.postalCode ?? "",
        }
      : undefined,
  };
}
