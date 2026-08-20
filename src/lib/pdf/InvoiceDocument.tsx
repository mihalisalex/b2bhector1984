import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { formatEUR } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { SUPPORT_EMAIL } from "@/lib/contact";

const TERMS_LABEL: Record<string, string> = {
  prepay: "Prepay — 10% off",
  net30: "Net 30 — 5% off",
  net60: "Net 60 — list price",
};

const STATUS_LABEL: Record<string, string> = {
  submitted: "Proforma Invoice",
  confirmed: "Confirmed",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
};

/**
 * Deliberately Helvetica-only (react-pdf's built-in fonts), not the site's Bodoni
 * Moda/Geist pairing — embedding custom TTFs into a server-rendered PDF is real
 * fragility for a look the layout/color treatment below already carries on its own.
 * The two-weight "HECTOR" (bold) / "FOOTWEAR" (light, tracked) split mirrors the
 * real wordmark (`Logo.tsx`) as closely as Helvetica allows.
 *
 * Color palette matches the storefront's tokens (`globals.css`) by value, not by
 * reference — react-pdf styles are plain objects, not CSS, so there's nothing to
 * import: `#121212` is `--color-ink`, `#404040`/`#e5e5e5` is the `--color-court`
 * pair (in-production status, reused here for the same meaning), `#f7f7f5` is
 * roughly `--color-stone-100`.
 */
const styles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "Helvetica", color: "#121212" },

  headerBand: {
    backgroundColor: "#121212",
    paddingHorizontal: 40,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordmarkRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  wordmark: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 1.5 },
  wordmarkSub: { fontSize: 8, color: "#a3a3a3", letterSpacing: 2 },
  tagline: { fontSize: 7.5, color: "#a3a3a3", marginTop: 4, letterSpacing: 1 },
  docTitleBadge: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
    alignSelf: "flex-end",
  },
  docTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#121212", textAlign: "right", letterSpacing: 0.75 },
  docMeta: { fontSize: 8.5, color: "#a3a3a3", textAlign: "right", marginTop: 6 },

  // paddingBottom is just breathing room before the footer now, not reserved space for a
  // `fixed` element repeating on every page (the footer isn't `fixed` — see its own
  // comment). It used to be 92pt for that purpose; left that large, it was dead space
  // pushing an 8-9-line order onto a mostly-blank second page for no reason.
  body: { paddingHorizontal: 40, paddingTop: 20, paddingBottom: 16 },

  infoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
    marginBottom: 18,
    padding: 14,
    backgroundColor: "#f7f7f5",
    borderRadius: 4,
  },
  infoBlock: { flexGrow: 1 },
  infoLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#8a8a8a", letterSpacing: 1.25, marginBottom: 6 },
  infoValue: { fontSize: 10, lineHeight: 1.5 },

  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
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
    paddingVertical: 8,
    borderBottom: "0.75pt solid #ececea",
  },
  th: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#6b6b6b", letterSpacing: 0.75 },

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
  thumbFallbackText: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  itemText: { flexShrink: 1 },
  itemName: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  itemSub: { fontSize: 8.5, color: "#8a8a8a", marginTop: 2 },

  statusPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  statusPillText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", letterSpacing: 0.4 },
  statusPillStock: { backgroundColor: "#eef4ee" },
  statusPillStockText: { color: "#2f6e43" },
  statusPillProduction: { backgroundColor: "#e5e5e5" },
  statusPillProductionText: { color: "#404040" },

  colQty: { width: 34, textAlign: "right", fontSize: 9.5 },
  colUnit: { width: 58, textAlign: "right", fontSize: 9, color: "#6b6b6b" },
  colTotal: { width: 68, textAlign: "right", fontSize: 9.5, fontFamily: "Helvetica-Bold" },

  summaryWrap: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14 },
  summaryMeta: { fontSize: 9, color: "#6b6b6b" },
  summaryBox: { width: 230 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryLabel: { fontSize: 9, color: "#6b6b6b" },
  summaryValue: { fontSize: 9.5 },
  summaryValueBold: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
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
}: InvoiceDocumentProps) {
  return (
    <Document title={`${order.id} — Hector Footwear`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand}>
          <View>
            <View style={styles.wordmarkRow}>
              <Text style={styles.wordmark}>HECTOR</Text>
              <Text style={styles.wordmarkSub}>FOOTWEAR</Text>
            </View>
            <Text style={styles.tagline}>WHOLESALE — EST. 1984</Text>
          </View>
          <View>
            <View style={styles.docTitleBadge}>
              <Text style={styles.docTitle}>{(STATUS_LABEL[order.status] ?? "Invoice").toUpperCase()}</Text>
            </View>
            <Text style={styles.docMeta}>{order.id}</Text>
            <Text style={styles.docMeta}>{formatDate(order.placedAt)}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.infoCard}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>BILL TO</Text>
              <Text style={styles.infoValue}>{businessName}</Text>
              <Text style={styles.infoValue}>{contactName}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>SHIP TO</Text>
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
              <Text style={styles.infoLabel}>TERMS</Text>
              <Text style={styles.infoValue}>{TERMS_LABEL[order.terms] ?? order.terms}</Text>
              {order.trackingNumber && (
                <>
                  <Text style={[styles.infoLabel, { marginTop: 10 }]}>TRACKING</Text>
                  <Text style={styles.infoValue}>{order.carrier} {order.trackingNumber}</Text>
                </>
              )}
            </View>
          </View>

          <Text style={styles.sectionLabel}>ORDER DETAIL</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, styles.colItem]}>ITEM</Text>
              <Text style={[styles.th, styles.colQty]}>QTY</Text>
              <Text style={[styles.th, styles.colUnit]}>UNIT</Text>
              <Text style={[styles.th, styles.colTotal]}>TOTAL</Text>
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
                          ? `PRODUCTION${line.productionEta ? ` · ETA ${formatDate(line.productionEta)}` : ""}`
                          : "IN STOCK"}
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
            <Text style={styles.summaryMeta}>{totalBoxes} boxes · {totalPairs} pairs</Text>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValueBold}>{formatEUR(total)}</Text>
              </View>
              {vatTotal > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>VAT</Text>
                  <Text style={styles.summaryValue}>{formatEUR(vatTotal)}</Text>
                </View>
              )}
              <View style={styles.grandTotalBand}>
                <Text style={styles.grandTotalLabel}>TOTAL</Text>
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
          <Text style={styles.footerText}>
            This is a proforma invoice, not a charge — it reflects stock and production check before your order is
            confirmed.
          </Text>
          <Text style={styles.footerText}>
            Hector Footwear Wholesale · {SUPPORT_EMAIL} · All pricing and inventory data on this document is
            illustrative.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
