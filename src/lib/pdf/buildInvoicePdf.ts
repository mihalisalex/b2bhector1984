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
 * (`/images/products/loafers.jpg`) — meaningful in a browser, not to react-pdf's `<Image>`,
 * which fetches over the network regardless of which case it is. Prefixing with `SITE_URL`
 * makes both cases the same kind of request.
 */
function absoluteImageUrl(style: Style | undefined): string | undefined {
  if (!style) return undefined;
  const url = getStyleImageUrl(style);
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

/**
 * Shared by the on-demand `/api/orders/[id]/invoice` download and the PDF attached to the
 * order-confirmation email — same document, two trigger points. Renders real product
 * photography per line via `<Image>`'s network-URL support; a photo that 404s or is in a
 * format react-pdf can't decode (its `<Image>` only handles JPEG/PNG, and uploaded style
 * photos are validated against a wider extension list — see uploadValidation.ts) fails the
 * whole render, not just that image, so **every caller of this function must treat it as
 * fallible** and decide what "no PDF" means for that caller rather than let it throw
 * uncaught.
 */
export async function buildInvoicePdf(input: BuildInvoicePdfInput): Promise<Buffer> {
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
      imageUrl: absoluteImageUrl(style),
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
