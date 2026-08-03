import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentAccount } from "@/lib/session";
import { getOrderById, getOrderByIdAdmin } from "@/lib/runtimeOrders";
import { getAccountById } from "@/lib/data/accounts";
import { getStyleById } from "@/lib/data/styles";
import { getBoxType } from "@/lib/data/boxTypes";
import { summarizeOrder } from "@/lib/pricing";
import { InvoiceDocument, type InvoiceLineView } from "@/lib/pdf/InvoiceDocument";
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

  const lines: InvoiceLineView[] = order.lines.map((line) => {
    const style = styleById.get(line.styleId);
    const colorway = style?.colorways.find((c) => c.id === line.colorwayId);
    const box = getBoxType(line.boxTypeId);
    return {
      styleName: style?.name ?? line.styleId,
      colorwayName: colorway?.name ?? line.colorwayId,
      boxLabel: box.label,
      qty: line.qty,
      unitPrice: line.unitPrice,
      lineTotal: line.qty * box.totalPairs * line.unitPrice,
    };
  });

  const { total, vatTotal, grandTotal, totalBoxes, totalPairs } = summarizeOrder(order);

  const buffer = await renderToBuffer(
    InvoiceDocument({
      order: {
        id: order.id,
        poNumber: order.poNumber,
        placedAt: order.placedAt,
        status: order.status,
        terms: order.terms,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
      },
      businessName,
      contactName,
      shipTo,
      lines,
      totalBoxes,
      totalPairs,
      total,
      vatTotal,
      grandTotal,
    }),
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${order.id}-invoice.pdf"`,
    },
  });
}
