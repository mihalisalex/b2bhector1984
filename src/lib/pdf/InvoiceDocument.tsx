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

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#121212" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  wordmark: { fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: 2 },
  tagline: { fontSize: 8, color: "#6b6b6b", marginTop: 2, letterSpacing: 1 },
  docTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "right" },
  docMeta: { fontSize: 9, color: "#6b6b6b", textAlign: "right", marginTop: 2 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, gap: 20 },
  infoBlock: { flexGrow: 1 },
  infoLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b6b6b", letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontSize: 10, lineHeight: 1.4 },
  table: { marginTop: 8, borderTop: "1pt solid #121212" },
  tableHeaderRow: { flexDirection: "row", borderBottom: "1pt solid #121212", paddingVertical: 5, backgroundColor: "#f0f0f0" },
  tableRow: { flexDirection: "row", borderBottom: "0.5pt solid #d4d4d4", paddingVertical: 5 },
  th: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b6b6b", letterSpacing: 0.5, paddingHorizontal: 4 },
  td: { fontSize: 9, paddingHorizontal: 4 },
  colStyle: { width: "30%" },
  colColorway: { width: "22%" },
  colBox: { width: "16%" },
  colQty: { width: "10%", textAlign: "right" },
  colUnit: { width: "11%", textAlign: "right" },
  colTotal: { width: "11%", textAlign: "right" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14, paddingTop: 10, borderTop: "1.5pt solid #121212" },
  totalsLabel: { fontSize: 9, color: "#6b6b6b" },
  totalsValue: { fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "right" },
  vatRow: { flexDirection: "row", justifyContent: "space-between", gap: 16, marginBottom: 2 },
  vatLabel: { fontSize: 8, color: "#6b6b6b" },
  vatValue: { fontSize: 9, textAlign: "right" },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, fontSize: 8, color: "#6b6b6b", lineHeight: 1.5, borderTop: "0.5pt solid #d4d4d4", paddingTop: 10 },
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
    poNumber: string;
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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.wordmark}>HECTOR FOOTWEAR</Text>
            <Text style={styles.tagline}>WHOLESALE — EST. 1984</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>{STATUS_LABEL[order.status] ?? "Invoice"}</Text>
            <Text style={styles.docMeta}>{order.id}</Text>
            <Text style={styles.docMeta}>{formatDate(order.placedAt)}</Text>
          </View>
        </View>

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
            <Text style={styles.infoLabel}>PO NUMBER</Text>
            <Text style={styles.infoValue}>{order.poNumber}</Text>
            <Text style={[styles.infoLabel, { marginTop: 8 }]}>TERMS</Text>
            <Text style={styles.infoValue}>{TERMS_LABEL[order.terms] ?? order.terms}</Text>
            {order.trackingNumber && (
              <>
                <Text style={[styles.infoLabel, { marginTop: 8 }]}>TRACKING</Text>
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
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.td, styles.colStyle]}>{line.styleName}</Text>
              <Text style={[styles.td, styles.colColorway]}>{line.colorwayName}</Text>
              <Text style={[styles.td, styles.colBox]}>{line.boxLabel}</Text>
              <Text style={[styles.td, styles.colQty]}>{line.qty}</Text>
              <Text style={[styles.td, styles.colUnit]}>{formatEUR(line.unitPrice)}</Text>
              <Text style={[styles.td, styles.colTotal]}>{formatEUR(line.lineTotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>{totalBoxes} boxes · {totalPairs} pairs</Text>
          <View>
            <View style={styles.vatRow}>
              <Text style={styles.vatLabel}>Subtotal</Text>
              <Text style={styles.vatValue}>{formatEUR(total)}</Text>
            </View>
            {vatTotal > 0 && (
              <View style={styles.vatRow}>
                <Text style={styles.vatLabel}>VAT</Text>
                <Text style={styles.vatValue}>{formatEUR(vatTotal)}</Text>
              </View>
            )}
            <Text style={styles.totalsValue}>{formatEUR(grandTotal)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          This is a proforma invoice, not a charge — it reflects stock and production check before your order is
          confirmed. Hector Footwear Wholesale · wholesale@hectorfootwear.gr. All pricing and inventory data on this
          document is illustrative.
        </Text>
      </Page>
    </Document>
  );
}
