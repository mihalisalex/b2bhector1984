import { getCurrentAccount } from "@/lib/session";
import { hasPermission } from "@/lib/data/permissions";
import { buildCataloguePdf } from "@/lib/pdf/buildCataloguePdf";
import type { Season } from "@/lib/types";

/** Thirty products' photos are downloaded and resized on each request. */
export const maxDuration = 60;

/**
 * The season catalogue as a PDF, for the owner to send to customers. Read-only.
 * Admin-only, with the same permission as proformas, because it carries trade prices.
 */
export async function GET(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return new Response("Unauthorized", { status: 401 });
  if (account.role !== "admin") return new Response("Forbidden", { status: 403 });
  if (!(await hasPermission(account.adminRole, "orders.manage"))) return new Response("Forbidden", { status: 403 });

  const params = new URL(request.url).searchParams;
  const seasonParam = params.get("season");
  if (seasonParam !== "winter" && seasonParam !== "summer") return new Response("Άγνωστη σεζόν.", { status: 400 });
  const season: Season = seasonParam;
  const withPrices = params.get("prices") === "1";

  let pdf: Buffer;
  try {
    pdf = await buildCataloguePdf(season, withPrices);
  } catch (err) {
    console.error(`[catalogue-pdf] ${season}:`, err);
    const reason = err instanceof Error && /[Α-Ωα-ω]/.test(err.message) ? err.message : "Δεν έγινε το PDF.";
    return new Response(`${reason} Δοκίμασε ξανά.`, { status: 500 });
  }

  const seasonName = season === "winter" ? "Xeimerina" : "Kalokairina";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Hector-${seasonName}-${withPrices ? "me-times" : "xoris-times"}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
