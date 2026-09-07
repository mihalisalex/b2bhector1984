import { getCurrentAccount } from "@/lib/session";
import { getStyleById } from "@/lib/data/styles";
import { getInventoryForStyles } from "@/lib/data/inventory";
import { buildInvoicePdf } from "@/lib/pdf/buildInvoicePdf";
import { parseProformaDraft, resolveProforma, ProformaError } from "@/lib/proformaDraft";
import type { Style } from "@/lib/types";

/**
 * Renders a custom proforma for the admin's on-the-spot quote builder.
 *
 * READ-ONLY. It reads styles and inventory and returns a PDF. Nothing is inserted, nothing
 * is decremented — see the note at the top of `proformaDraft.ts` for why that matters here.
 *
 * Guarded the same way `/api/orders/[id]/invoice` is: a session, and the admin role. This
 * endpoint prices the whole catalogue at every terms level, so it must never be reachable
 * by a buyer — wholesale prices are withheld from logged-out visitors on the storefront,
 * and an open quote endpoint would hand them over in a document instead.
 */
export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return new Response("Unauthorized", { status: 401 });
  if (account.role !== "admin") return new Response("Forbidden", { status: 403 });

  let draft;
  try {
    draft = parseProformaDraft(await request.json());
  } catch (err) {
    if (err instanceof ProformaError) return new Response(err.message, { status: 400 });
    return new Response("Malformed request body.", { status: 400 });
  }

  const uniqueStyleIds = Array.from(new Set(draft.lines.map((l) => l.styleId)));
  const [styleEntries, inventoryByStyle] = await Promise.all([
    Promise.all(uniqueStyleIds.map(async (id) => [id, await getStyleById(id)] as const)),
    getInventoryForStyles(uniqueStyleIds),
  ]);
  const styleById = new Map<string, Style | undefined>(styleEntries);

  let resolved;
  try {
    resolved = resolveProforma(draft, styleById, inventoryByStyle);
  } catch (err) {
    if (err instanceof ProformaError) return new Response(err.message, { status: 400 });
    throw err;
  }

  let buffer: Buffer;
  try {
    buffer = await buildInvoicePdf({
      order: {
        id: resolved.reference,
        placedAt: new Date().toISOString(),
        // Renders as "PROFORMA INVOICE" on the document — the same header a real
        // pre-confirmation order gets, which is exactly what this is.
        status: "submitted",
        terms: draft.terms,
      },
      businessName: draft.recipient.businessName,
      contactName: draft.recipient.contactName,
      shipTo: resolved.shipTo,
      lines: resolved.lines,
      styleById,
      locale: draft.locale,
    });
  } catch (err) {
    // Same failure mode the order invoice guards: one product photo that 404s or is in a
    // format react-pdf can't decode fails the whole render.
    console.error("[proforma] Failed to render custom proforma:", err);
    return new Response("Could not generate this proforma right now — please try again shortly.", { status: 500 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${resolved.reference}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
