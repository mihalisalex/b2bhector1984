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

  const buffer = await renderToBuffer(
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

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${style.styleNumber}-spec-sheet.pdf"`,
    },
  });
}
