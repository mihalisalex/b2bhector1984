import { getCurrentAccount } from "@/lib/session";
import { resolveLocale } from "@/lib/localeHeuristic";
import { getOrderById, getOrderByIdAdmin } from "@/lib/runtimeOrders";
import { getAccountById } from "@/lib/data/accounts";
import { getStyleById } from "@/lib/data/styles";
import { buildInvoicePdf } from "@/lib/pdf/buildInvoicePdf";
import type { Order } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await getCurrentAccount();
  if (!account) return new Response("Unauthorized", { status: 401 });

  let order: Order | undefined;
  let businessName: string;
  let contactName: string;
  let shipToAccountId: string;

  if (account.role === "admin") {
    const adminOrder = await getOrderByIdAdmin(id);
    if (!adminOrder) return new Response("Not found", { status: 404 });
    order = adminOrder;
    businessName = adminOrder.businessName;
    contactName = adminOrder.contactName;
    shipToAccountId = adminOrder.accountId;
  } else {
    const buyerOrder = await getOrderById(account.id, id);
    if (!buyerOrder) return new Response("Not found", { status: 404 });
    order = buyerOrder;
    businessName = account.businessName;
    contactName = account.contactName;
    shipToAccountId = account.id;
  }

  const shipToAccount = account.role === "admin" ? await getAccountById(shipToAccountId) : account;
  const shipTo = shipToAccount?.shipTo.find((s) => s.id === order!.shipToId);

  const uniqueStyleIds = Array.from(new Set(order.lines.map((l) => l.styleId)));
  const styleEntries = await Promise.all(uniqueStyleIds.map(async (sid) => [sid, await getStyleById(sid)] as const));
  const styleById = new Map(styleEntries);

  let buffer: Buffer;
  try {
    buffer = await buildInvoicePdf({
      order: {
        id: order.id,
        placedAt: order.placedAt,
        status: order.status,
        terms: order.terms,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
      },
      businessName,
      contactName,
      shipTo,
      lines: order.lines,
      styleById,
      // The BUYER's language, not the downloader's. An admin pulling a copy of someone's
      // invoice should get the document that buyer received, not one in the admin's own
      // language — it is the same legal document, and the two must not differ.
      locale: resolveLocale(shipToAccount?.locale, shipToAccount?.storeLocation),
    });
  } catch (err) {
    // New failure mode since product photography was added to this document: a photo
    // that 404s, or is in a format react-pdf's <Image> can't decode (it only handles
    // JPEG/PNG; uploaded style photos are validated against a wider extension list, see
    // uploadValidation.ts), fails the whole render. A clear 500 beats an unhandled crash.
    console.error(`[invoice] Failed to render PDF for order ${order.id}:`, err);
    return new Response("Could not generate this invoice right now — please try again shortly.", { status: 500 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${order.id}-invoice.pdf"`,
    },
  });
}
