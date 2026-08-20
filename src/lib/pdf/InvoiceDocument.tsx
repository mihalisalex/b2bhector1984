import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { formatEUR } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { registerPdfFonts, PDF_FONT_FAMILY } from "@/lib/pdf/fonts";
import { t } from "@/i18n/format";
import enDict, { type Dictionary } from "@/i18n/dictionaries/en";

registerPdfFonts();


/**
 * Manrope, embedded — see src/lib/pdf/fonts.ts.
 *
 * This was Helvetica-only until the Greek site, and the note here said so deliberately:
 * "embedding custom TTFs into a server-rendered PDF is real fragility". That held until
 * these documents had to carry Greek. Helvetica is a base-14 font declared
 * `/Encoding /WinAnsiEncoding` — CP1252, which has no Greek glyphs — so Greek text drew as
 * Latin punctuation. That was already true of any Greek business name or address on an
 * invoice, before any localisation work.
 *
 * The two-weight "HECTOR" (bold) / "FOOTWEAR" (light, tracked) split still mirrors the
 * real wordmark (`Logo.tsx`); Manrope carries it at least as well as Helvetica did.
 *
 * Color palette matches the storefront's tokens (`globals.css`) by value, not by
 * reference — react-pdf styles are plain objects, not CSS, so there's nothing to
 * import: `#121212` is `--color-ink`, `#404040`/`#e5e5e5` is the `--color-court`
 * pair (in-production status, reused here for the same meaning), `#f7f7f5` is
 * roughly `--color-stone-100`.
 */
const styles = StyleSheet.create({
  // 9.5pt, not 10: Manrope sets a larger x-height than the Helvetica this replaced, and at
  // 10pt a typical 8-line order spilled onto a second page that Helvetica fit on one.
  // Measured against the previous build rather than guessed — see the comment on tableRow.
  page: { fontSize: 9.5, fontFamily: PDF_FONT_FAMILY, color: "#121212" },

  headerBand: {
    backgroundColor: "#121212",
    paddingHorizontal: 40,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordmarkRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  wordmark: { fontSize: 16, fontFamily: PDF_FONT_FAMILY, fontWeight: 700, color: "#ffffff", letterSpacing: 1.5 },
  wordmarkSub: { fontSize: 8, color: "#a3a3a3", letterSpacing: 2 },
  tagline: { fontSize: 7.5, color: "#a3a3a3", marginTop: 4, letterSpacing: 1 },
  docTitleBadge: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
    alignSelf: "flex-end",
  },
  docTitle: { fontSize: 10, fontFamily: PDF_FONT_FAMILY, fontWeight: 700, color: "#121212", textAlign: "right", letterSpacing: 0.75 },
  docMeta: { fontSize: 8.5, color: "#a3a3a3", textAlign: "right", marginTop: 6 },

  // paddingBottom is just breathing room before the footer now, not reserved space for a
  // `fixed` element repeating on every page (the footer isn't `fixed` — see its own
  // comment). It used to be 92pt for that purpose; left that large, it was dead space
  // pushing an 8-9-line order onto a mostly-blank second page for no reason.
  body: { paddingHorizontal: 40, paddingTop: 16, paddingBottom: 12 },

  infoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
    marginBottom: 14,
    padding: 14,
    backgroundColor: "#f7f7f5",
    borderRadius: 4,
  },
  infoBlock: { flexGrow: 1 },
  infoLabel: { fontSize: 7.5, fontFamily: PDF_FONT_FAMILY, fontWeight: 700, color: "#8a8a8a", letterSpacing: 1.25, marginBottom: 6 },
  infoValue: { fontSize: 10, lineHeight: 1.5 },

  sectionLabel: {
    fontSize: 8,
    fontFamily: PDF_FONT_FAMILY, fontWeight: 700,
    color: "#8a8a8a",
    letterSpacing: 1.25,
    marginBottom: 8,
  },

  table: { marginTop: 2 },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottom: "1.25pt solid #121212",
    paddingBottom: 7,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    // 6pt, down from 8. Manrope is a taller face than the Helvetica this document used, and
    // at the old spacing a typical 8-line wholesale order spilled onto a second page that
    // Helvetica fitted on one — measured against the previous build, not guessed. Trimming
    // 2pt a side gives the rows back without touching type size or the layout's proportions.
    paddingVertical: 6,
    borderBottom: "0.75pt solid #ececea",
  },
  th: { fontSize: 7.5, fontFamily: PDF_FONT_FAMILY, fontWeight: 700, color: "#6b6b6b", letterSpacing: 0.75 },

  colItem: { flexGrow: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 10 },
  thumb: { width: 34, height: 34, borderRadius: 4, objectFit: "cover" },
  thumbFallback: {
    width: 34,
    height: 34,
    borderRadius: 4,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbFallbackText: { fontSize: 13, fontFamily: PDF_FONT_FAMILY, fontWeight: 700, color: "#ffffff" },
  itemText: { flexShrink: 1 },
  itemName: { fontSize: 9.5, fontFamily: PDF_FONT_FAMILY, fontWeight: 700 },
  itemSub: { fontSize: 8.5, color: "#8a8a8a", marginTop: 2 },

  statusPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  statusPillText: { fontSize: 7.5, fontFamily: PDF_FONT_FAMILY, fontWeight: 700, letterSpacing: 0.4 },
  statusPillStock: { backgroundColor: "#eef4ee" },
  statusPillStockText: { color: "#2f6e43" },
  statusPillProduction: { backgroundColor: "#e5e5e5" },
  statusPillProductionText: { color: "#404040" },

  colQty: { width: 34, textAlign: "right", fontSize: 9.5 },
  colUnit: { width: 58, textAlign: "right", fontSize: 9, color: "#6b6b6b" },
  colTotal: { width: 68, textAlign: "right", fontSize: 9.5, fontFamily: PDF_FONT_FAMILY, fontWeight: 700 },

  summaryWrap: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 10 },
  summaryMeta: { fontSize: 9, color: "#6b6b6b" },
  summaryBox: { width: 230 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryLabel: { fontSize: 9, color: "#6b6b6b" },
  summaryValue: { fontSize: 9.5 },
  summaryValueBold: { fontSize: 9.5, fontFamily: PDF_FONT_FAMILY, fontWeight: 700 },
  grandTotalBand: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#121212",
    borderRadius: 3,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  grandTotalLabel: { fontSize: 8.5, color: "#ffffff", letterSpacing: 1 },
  grandTotalValue: { fontSize: 16, color: "#ffffff" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderTop: "0.75pt solid #e0e0e0",
  },
  footerText: { fontSize: 8, color: "#a3a3a3", lineHeight: 1.5, textAlign: "center" },
});

export interface InvoiceLineView {
  styleName: string;
  colorwayName: string;
  boxLabel: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  fulfillment: "stock" | "production";
  productionEta?: string;
  /** Absolute URL — react-pdf's `<Image>` fetches over the network, so a site-relative
   * path (the local category placeholder) has to be resolved to one before it gets here;
   * see buildInvoicePdf.ts. Omitted entirely (not just a broken link) when the line's
   * style couldn't be resolved at all, in which case the thumbnail falls back to a plain
   * monogram square instead of attempting a request that was never going to succeed. */
  imageUrl?: string;
}

export interface InvoiceDocumentProps {
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
  lines: InvoiceLineView[];
  totalBoxes: number;
  totalPairs: number;
  /** Net (pre-VAT) subtotal. */
  total: number;
  vatTotal: number;
  /** What the buyer actually owes — total + vatTotal. */
  grandTotal: number;
  /** The buyer's language. Defaults to English so existing callers keep working. */
  dict?: Dictionary["pdf"];
}

export function InvoiceDocument({
  order,
  businessName,
  contactName,
  shipTo,
  lines,
  totalBoxes,
  totalPairs,
  total,
  vatTotal,
  grandTotal,
  dict = enDict.pdf,
}: InvoiceDocumentProps) {
  const TERMS: Record<string, string> = {
    prepay: dict.termsPrepay,
    net30: dict.termsNet30,
    net60: dict.termsNet60,
  };
  const STATUS: Record<string, string> = {
    submitted: dict.proformaInvoice,
    confirmed: dict.statusConfirmed,
    in_production: dict.statusInProduction,
    shipped: dict.statusShipped,
    delivered: dict.statusDelivered,
  };
  return (
    <Document title={`${order.id} — Hector Footwear`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand}>
          <View>
            <View style={styles.wordmarkRow}>
              <Text style={styles.wordmark}>HECTOR</Text>
              <Text style={styles.wordmarkSub}>FOOTWEAR</Text>
            </View>
            <Text style={styles.tagline}>{dict.wholesaleEst}</Text>
          </View>
          <View>
            <View style={styles.docTitleBadge}>
              <Text style={styles.docTitle}>{(STATUS[order.status] ?? dict.invoice).toUpperCase()}</Text>
            </View>
            <Text style={styles.docMeta}>{order.id}</Text>
            <Text style={styles.docMeta}>{formatDate(order.placedAt)}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.infoCard}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>{dict.billTo.toUpperCase()}</Text>
              <Text style={styles.infoValue}>{businessName}</Text>
              <Text style={styles.infoValue}>{contactName}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>{dict.shipTo.toUpperCase()}</Text>
              {shipTo ? (
                <>
                  <Text style={styles.infoValue}>{shipTo.label}</Text>
                  <Text style={styles.infoValue}>{shipTo.line1}{shipTo.line2 ? `, ${shipTo.line2}` : ""}</Text>
                  <Text style={styles.infoValue}>{shipTo.city}, {shipTo.state} {shipTo.zip}</Text>
                </>
              ) : (
                <Text style={styles.infoValue}>—</Text>
              )}
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>{dict.terms.toUpperCase()}</Text>
              <Text style={styles.infoValue}>{TERMS[order.terms] ?? order.terms}</Text>
              {order.trackingNumber && (
                <>
                  <Text style={[styles.infoLabel, { marginTop: 10 }]}>{dict.tracking.toUpperCase()}</Text>
                  <Text style={styles.infoValue}>{order.carrier} {order.trackingNumber}</Text>
                </>
              )}
            </View>
          </View>

          <Text style={styles.sectionLabel}>{dict.orderDetail.toUpperCase()}</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, styles.colItem]}>{dict.item.toUpperCase()}</Text>
              <Text style={[styles.th, styles.colQty]}>{dict.qty.toUpperCase()}</Text>
              <Text style={[styles.th, styles.colUnit]}>{dict.unit.toUpperCase()}</Text>
              <Text style={[styles.th, styles.colTotal]}>{dict.total.toUpperCase()}</Text>
            </View>
            {lines.map((line, i) => (
              <View key={i} style={styles.tableRow} wrap={false}>
                <View style={styles.colItem}>
                  {line.imageUrl ? (
                    // This is react-pdf's <Image> (a PDF drawing primitive), not an HTML <img> —
                    // it has no alt prop to give. The disable has to sit on the line directly
                    // above the JSX it targets; a comment block above *that* doesn't reach it.
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image src={line.imageUrl} style={styles.thumb} />
                  ) : (
                    <View style={styles.thumbFallback}>
                      <Text style={styles.thumbFallbackText}>H</Text>
                    </View>
                  )}
                  <View style={styles.itemText}>
                    <Text style={styles.itemName}>{line.styleName}</Text>
                    <Text style={styles.itemSub}>{line.colorwayName} · {line.boxLabel}</Text>
                    <View
                      style={[styles.statusPill, line.fulfillment === "production" ? styles.statusPillProduction : styles.statusPillStock]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          line.fulfillment === "production" ? styles.statusPillProductionText : styles.statusPillStockText,
                        ]}
                      >
                        {line.fulfillment === "production"
                          ? `${dict.production.toUpperCase()}${
                              line.productionEta ? ` · ${dict.eta.toUpperCase()} ${formatDate(line.productionEta)}` : ""
                            }`
                          : dict.inStock.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.colQty}>{line.qty}</Text>
                <Text style={styles.colUnit}>{formatEUR(line.unitPrice)}</Text>
                <Text style={styles.colTotal}>{formatEUR(line.lineTotal)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryWrap}>
            <Text style={styles.summaryMeta}>{t(dict.boxesAndPairs, { boxes: totalBoxes, pairs: totalPairs })}</Text>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{dict.subtotal}</Text>
                <Text style={styles.summaryValueBold}>{formatEUR(total)}</Text>
              </View>
              {vatTotal > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{dict.vat}</Text>
                  <Text style={styles.summaryValue}>{formatEUR(vatTotal)}</Text>
                </View>
              )}
              <View style={styles.grandTotalBand}>
                <Text style={styles.grandTotalLabel}>{dict.grandTotal.toUpperCase()}</Text>
                <Text style={styles.grandTotalValue}>{formatEUR(grandTotal)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Deliberately NOT `fixed` (tried once, reverted): pairing a fixed footer with
            the per-line product photos above caused a real bug — page-break math went
            wrong under load and the footer ended up overlapping the summary block, plus
            dozens of extra blank pages on a real order. Absolutely positioned but page-
            local, same as this document behaved before photos were added: it lands at
            the bottom of whichever page the content naturally ends on. Fine for the
            realistic case (a wholesale order's line count fits one page); an order long
            enough to spill past page 1 just doesn't get a footer repeated on page 1,
            which is a far smaller cost than the bug this replaced. */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{dict.proformaNotice}</Text>
          <Text style={styles.footerText}>{t(dict.invoiceFooter, { email: SUPPORT_EMAIL })}</Text>
        </View>
      </Page>
    </Document>
  );
}
