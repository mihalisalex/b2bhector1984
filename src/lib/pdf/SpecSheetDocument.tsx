import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatEUR } from "@/lib/pricing";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { t } from "@/i18n/format";
import enDict, { type Dictionary } from "@/i18n/dictionaries/en";
import { registerPdfFonts, PDF_FONT_FAMILY } from "@/lib/pdf/fonts";

registerPdfFonts();

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: PDF_FONT_FAMILY, color: "#121212" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  wordmark: { fontSize: 20, fontFamily: PDF_FONT_FAMILY, fontWeight: 700, letterSpacing: 2 },
  tagline: { fontSize: 8, color: "#6b6b6b", marginTop: 2, letterSpacing: 1 },
  docTitle: { fontSize: 13, fontFamily: PDF_FONT_FAMILY, fontWeight: 700, textAlign: "right" },
  docMeta: { fontSize: 9, color: "#6b6b6b", textAlign: "right", marginTop: 2 },
  styleTitle: { fontSize: 16, fontFamily: PDF_FONT_FAMILY, fontWeight: 700, marginBottom: 2 },
  styleTagline: { fontSize: 10, color: "#6b6b6b", marginBottom: 16 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, gap: 20 },
  infoBlock: { flexGrow: 1 },
  infoLabel: { fontSize: 8, fontFamily: PDF_FONT_FAMILY, fontWeight: 700, color: "#6b6b6b", letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontSize: 10, lineHeight: 1.4 },
  sectionLabel: { fontSize: 8, fontFamily: PDF_FONT_FAMILY, fontWeight: 700, color: "#6b6b6b", letterSpacing: 0.5, marginTop: 16, marginBottom: 6 },
  table: { borderTop: "1pt solid #121212" },
  tableHeaderRow: { flexDirection: "row", borderBottom: "1pt solid #121212", paddingVertical: 5, backgroundColor: "#f0f0f0" },
  tableRow: { flexDirection: "row", borderBottom: "0.5pt solid #d4d4d4", paddingVertical: 5 },
  th: { fontSize: 8, fontFamily: PDF_FONT_FAMILY, fontWeight: 700, color: "#6b6b6b", letterSpacing: 0.5, paddingHorizontal: 4, flex: 1, textAlign: "right" },
  thFirst: { fontSize: 8, fontFamily: PDF_FONT_FAMILY, fontWeight: 700, color: "#6b6b6b", letterSpacing: 0.5, paddingHorizontal: 4, width: "22%" },
  td: { fontSize: 9, paddingHorizontal: 4, flex: 1, textAlign: "right" },
  tdFirst: { fontSize: 9, paddingHorizontal: 4, width: "22%" },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, fontSize: 8, color: "#6b6b6b", lineHeight: 1.5, borderTop: "0.5pt solid #d4d4d4", paddingTop: 10 },
});

export interface SpecSheetBoxRow {
  label: string;
  totalPairs: number;
  sizeBreakdown: Record<string, number>;
}

export interface SpecSheetDocumentProps {
  style: {
    name: string;
    styleNumber: string;
    category: string;
    gender: string;
    materials: string[];
    weightOz: number;
    msrp: number;
    tagline: string;
  };
  euSizes: string[];
  boxes: SpecSheetBoxRow[];
  /** The buyer's language. Defaults to English so existing callers keep working. */
  dict?: Dictionary["pdf"];
  /** Drives number and date conventions — Greek needs "24,90 €" and DD/MM/YYYY. */
  locale?: string;
}

export function SpecSheetDocument({ style, euSizes, boxes, dict = enDict.pdf, locale = "en" }: SpecSheetDocumentProps) {
  return (
    <Document title={`${style.styleNumber} — Spec Sheet`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.wordmark}>HECTOR FOOTWEAR</Text>
            <Text style={styles.tagline}>{dict.wholesaleEst}</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>{dict.specSheet}</Text>
            <Text style={styles.docMeta}>{style.styleNumber}</Text>
          </View>
        </View>

        <Text style={styles.styleTitle}>{style.name}</Text>
        <Text style={styles.styleTagline}>{style.tagline}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>{dict.category.toUpperCase()}</Text>
            <Text style={styles.infoValue}>{style.category}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>{dict.gender.toUpperCase()}</Text>
            <Text style={styles.infoValue}>{style.gender}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>{dict.weight.toUpperCase()}</Text>
            <Text style={styles.infoValue}>{style.weightOz} oz</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>{dict.msrp.toUpperCase()}</Text>
            <Text style={styles.infoValue}>{formatEUR(style.msrp, locale)}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{dict.materials.toUpperCase()}</Text>
        <Text style={styles.infoValue}>{style.materials.join(", ")}</Text>

        <Text style={styles.sectionLabel}>{dict.sizeBreakdown.toUpperCase()}</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.thFirst}>{dict.box.toUpperCase()}</Text>
            {euSizes.map((size) => (
              <Text key={size} style={styles.th}>EU {size}</Text>
            ))}
          </View>
          {boxes.map((box) => (
            <View key={box.label} style={styles.tableRow}>
              <Text style={styles.tdFirst}>{box.label}</Text>
              {euSizes.map((size) => (
                <Text key={size} style={styles.td}>{box.sizeBreakdown[size] ?? "—"}</Text>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.footer}>{t(dict.specSheetFooter, { email: SUPPORT_EMAIL })}</Text>
      </Page>
    </Document>
  );
}
