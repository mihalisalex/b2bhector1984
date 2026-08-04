import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatEUR } from "@/lib/pricing";
import { formatDate } from "@/lib/format";

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
 */
const styles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "Helvetica", color: "#121212" },

  headerBand: {
    backgroundColor: "#121212",
    paddingHorizontal: 40,
    paddingVertical: 26,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordmarkRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  wordmark: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 1.5 },
  wordmarkSub: { fontSize: 8, color: "#a3a3a3", letterSpacing: 2 },
  tagline: { fontSize: 7.5, color: "#a3a3a3", marginTop: 4, letterSpacing: 1 },
  docTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff", textAlign: "right", letterSpacing: 0.75 },
  docMeta: { fontSize: 8.5, color: "#a3a3a3", textAlign: "right", marginTop: 4 },

  body: { paddingHorizontal: 40, paddingTop: 32, paddingBottom: 90 },

  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30, gap: 24 },
  infoBlock: { flexGrow: 1 },
  infoLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#a3a3a3", letterSpacing: 1.25, marginBottom: 6 },
  infoValue: { fontSize: 10, lineHeight: 1.5 },

  table: { marginTop: 4 },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottom: "1.25pt solid #121212",
    paddingHorizontal: 6,
    paddingBottom: 7,
    marginBottom: 2,
  },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 6 },
  tableRowAlt: { backgroundColor: "#fafafa" },
  th: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#6b6b6b", letterSpacing: 0.75 },
  td: { fontSize: 9.5 },
  tdMuted: { fontSize: 9, color: "#6b6b6b" },
  colStyle: { width: "32%" },
  colColorway: { width: "20%" },
  colBox: { width: "16%" },
  colQty: { width: "8%", textAlign: "right" },
  colUnit: { width: "12%", textAlign: "right" },
  colTotal: { width: "12%", textAlign: "right", fontFamily: "Helvetica-Bold" },

  summaryWrap: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 22 },
  summaryMeta: { fontSize: 9, color: "#6b6b6b" },
  summaryBox: { width: 230 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryLabel: { fontSize: 9, color: "#6b6b6b" },
  summaryValue: { fontSize: 9.5 },
  grandTotalBand: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#121212",
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  grandTotalLabel: { fontSize: 8.5, color: "#ffffff", letterSpacing: 1 },
  grandTotalValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff" },

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
            <Text style={styles.docTitle}>{(STATUS_LABEL[order.status] ?? "Invoice").toUpperCase()}</Text>
            <Text style={styles.docMeta}>{order.id}</Text>
            <Text style={styles.docMeta}>{formatDate(order.placedAt)}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.infoRow}>
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

          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, styles.colStyle]}>STYLE</Text>
              <Text style={[styles.th, styles.colColorway]}>COLORWAY</Text>
              <Text style={[styles.th, styles.colBox]}>BOX</Text>
              <Text style={[styles.th, styles.colQty]}>QTY</Text>
              <Text style={[styles.th, styles.colUnit]}>UNIT</Text>
              <Text style={[styles.th, styles.colTotal]}>TOTAL</Text>
            </View>
            {lines.map((line, i) => (
              <View key={i} style={i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                <Text style={[styles.td, styles.colStyle]}>{line.styleName}</Text>
                <Text style={[styles.tdMuted, styles.colColorway]}>{line.colorwayName}</Text>
                <Text style={[styles.tdMuted, styles.colBox]}>{line.boxLabel}</Text>
                <Text style={[styles.td, styles.colQty]}>{line.qty}</Text>
                <Text style={[styles.tdMuted, styles.colUnit]}>{formatEUR(line.unitPrice)}</Text>
                <Text style={[styles.td, styles.colTotal]}>{formatEUR(line.lineTotal)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryWrap}>
            <Text style={styles.summaryMeta}>{totalBoxes} boxes · {totalPairs} pairs</Text>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatEUR(total)}</Text>
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a proforma invoice, not a charge — it reflects stock and production check before your order is
            confirmed.
          </Text>
          <Text style={styles.footerText}>
            Hector Footwear Wholesale · info@hectorfootwear.gr · All pricing and inventory data on this document is
            illustrative.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
