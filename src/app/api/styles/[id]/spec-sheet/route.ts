import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentAccount } from "@/lib/session";
import { getStyleById } from "@/lib/data/styles";
import { EU_SIZES, getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { SpecSheetDocument, type SpecSheetBoxRow } from "@/lib/pdf/SpecSheetDocument";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await getCurrentAccount();
  if (!account) return new Response("Unauthorized", { status: 401 });

  const style = await getStyleById(id);
  if (!style) return new Response("Not found", { status: 404 });

  const boxes: SpecSheetBoxRow[] = getAvailableBoxTypes(style).map((box) => ({
    label: box.label,
    totalPairs: box.totalPairs,
    sizeBreakdown: box.sizeBreakdown,
  }));

  // Same guard the invoice route already carries: an unhandled throw out of react-pdf
  // renders Next's raw 500 page to a buyer mid-download. This route has no <Image> so
  // it can't hit the photo-decode failure the invoice route was hardened against, but a
  // render failure here shouldn't be a worse experience than one there.
  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(
      SpecSheetDocument({
        style: {
          name: style.name,
          styleNumber: style.styleNumber,
          category: style.category,
          gender: style.gender,
          materials: style.materials,
          weightOz: style.weightOz,
          msrp: style.msrp,
          tagline: style.tagline,
        },
        euSizes: EU_SIZES,
        boxes,
      }),
    );
  } catch (err) {
    console.error(`[spec-sheet] Failed to render PDF for style ${style.id}:`, err);
    return new Response("Could not generate this spec sheet right now — please try again shortly.", { status: 500 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${style.styleNumber}-spec-sheet.pdf"`,
    },
  });
}
