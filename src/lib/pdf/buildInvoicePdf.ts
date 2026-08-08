import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { getBoxType } from "@/lib/data/boxTypes";
import { getStyleImageUrl } from "@/lib/data/styleLabels";
import { SITE_URL } from "@/lib/siteUrl";
import { summarizeOrder } from "@/lib/pricing";
import { InvoiceDocument, type InvoiceLineView } from "@/lib/pdf/InvoiceDocument";
import type { OrderLine, Style } from "@/lib/types";

export interface BuildInvoicePdfInput {
  order: {
    id: string;
    placedAt: string;
    status: string;
    terms: string;
    trackingNumber?: string;
    carrier?: string;
  };
  businessName: string;
  contactName: string;
  shipTo?: { label: string; line1: string; line2?: string; city: string; state: string; zip: string };
  lines: OrderLine[];
  /** styleId -> Style, for every style referenced in `lines`. A line whose style can't be
   * resolved (deleted/archived since the order was placed) still renders — just with its
   * raw id as the name and no photo, same fallback the on-demand invoice route always used. */
  styleById: Map<string, Style | undefined>;
}

/**
 * `getStyleImageUrl` returns either an absolute Supabase Storage URL (a real uploaded
 * photo) or a site-relative path to the local category placeholder
 * (`/images/products/loafers.jpg`) — meaningful in a browser, not to a plain `fetch()`,
 * which needs an absolute URL regardless of which case it is.
 */
function absoluteImageUrl(style: Style): string {
  const url = getStyleImageUrl(style);
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

/**
 * Downloads one product photo and inlines it as a `data:` URI, so react-pdf's `<Image>`
 * never does its own network fetch mid-render.
 *
 * This isn't an optimization — letting `<Image src="https://...">` fetch remotely during
 * `renderToBuffer` is what caused a real production bug: line rows rendered twice with
 * misaligned qty/price columns, the summary block overlapped the footer, and the PDF ran
 * to 24 mostly-blank pages for a 9-line order. react-pdf's layout engine does the fetch as
 * part of a multi-pass measure-then-paint cycle, and on this version (4.5.1) that cycle
 * doesn't reliably converge once the page has to wrap — content from an earlier pass leaks
 * into the final output instead of being replaced. Pre-fetching keeps every image byte
 * available synchronously before layout ever starts, which sidesteps that pass entirely.
 *
 * Also the only place format gets checked: react-pdf's `<Image>` only decodes JPEG/PNG,
 * but uploaded style photos are allowed to be webp/gif (see uploadValidation.ts) — passing
 * one through would fail the *entire* render, not just that thumbnail. Returns `undefined`
 * on any failure (network, non-2xx, wrong content-type) so the caller falls back to the
 * plain monogram square already built into InvoiceDocument for a missing image.
 */
async function fetchImageDataUri(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const contentType = res.headers.get("content-type") ?? "";
    if (!/^image\/(jpeg|png)/i.test(contentType)) return undefined;
    const bytes = Buffer.from(await res.arrayBuffer());
    return `data:${contentType.split(";")[0]};base64,${bytes.toString("base64")}`;
  } catch (err) {
    console.error(`[invoice] Failed to fetch product photo ${url}:`, err);
    return undefined;
  }
}

/**
 * Shared by the on-demand `/api/orders/[id]/invoice` download and the PDF attached to the
 * order-confirmation email — same document, two trigger points. Renders real product
 * photography per line, embedded as inline data (see fetchImageDataUri above) rather than
 * left as a live URL for react-pdf to fetch itself.
 */
export async function buildInvoicePdf(input: BuildInvoicePdfInput): Promise<Buffer> {
  // One fetch per unique style, not per line — an order commonly has several lines
  // (colorways/box sizes) against the same style, and they all show the same photo.
  const uniqueStyles = new Map<string, Style>();
  for (const line of input.lines) {
    const style = input.styleById.get(line.styleId);
    if (style && !uniqueStyles.has(style.id)) uniqueStyles.set(style.id, style);
  }
  const resolvedEntries = await Promise.all(
    Array.from(uniqueStyles.values()).map(
      async (style) => [style.id, await fetchImageDataUri(absoluteImageUrl(style))] as const,
    ),
  );
  const imageDataByStyleId = new Map(resolvedEntries);

  const lineViews: InvoiceLineView[] = input.lines.map((line) => {
    const style = input.styleById.get(line.styleId);
    const colorway = style?.colorways.find((c) => c.id === line.colorwayId);
    const box = getBoxType(line.boxTypeId);
    return {
      styleName: style?.name ?? line.styleId,
      colorwayName: colorway?.name ?? line.colorwayId,
      boxLabel: box.label,
      qty: line.qty,
      unitPrice: line.unitPrice,
      lineTotal: line.qty * box.totalPairs * line.unitPrice,
      fulfillment: line.fulfillment,
      productionEta: line.productionEta,
      imageUrl: style ? imageDataByStyleId.get(style.id) : undefined,
    };
  });

  const { total, vatTotal, grandTotal, totalBoxes, totalPairs } = summarizeOrder({ lines: input.lines });

  return renderToBuffer(
    InvoiceDocument({
      order: input.order,
      businessName: input.businessName,
      contactName: input.contactName,
      shipTo: input.shipTo,
      lines: lineViews,
      totalBoxes,
      totalPairs,
      total,
      vatTotal,
      grandTotal,
    }),
  );
}
