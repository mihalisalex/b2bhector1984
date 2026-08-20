import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatEUR } from "@/lib/pricing";
import { SUPPORT_EMAIL } from "@/lib/contact";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#121212" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  wordmark: { fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: 2 },
  tagline: { fontSize: 8, color: "#6b6b6b", marginTop: 2, letterSpacing: 1 },
  docTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "right" },
  docMeta: { fontSize: 9, color: "#6b6b6b", textAlign: "right", marginTop: 2 },
  styleTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  styleTagline: { fontSize: 10, color: "#6b6b6b", marginBottom: 16 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, gap: 20 },
  infoBlock: { flexGrow: 1 },
  infoLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b6b6b", letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontSize: 10, lineHeight: 1.4 },
  sectionLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b6b6b", letterSpacing: 0.5, marginTop: 16, marginBottom: 6 },
  table: { borderTop: "1pt solid #121212" },
  tableHeaderRow: { flexDirection: "row", borderBottom: "1pt solid #121212", paddingVertical: 5, backgroundColor: "#f0f0f0" },
  tableRow: { flexDirection: "row", borderBottom: "0.5pt solid #d4d4d4", paddingVertical: 5 },
  th: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b6b6b", letterSpacing: 0.5, paddingHorizontal: 4, flex: 1, textAlign: "right" },
  thFirst: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b6b6b", letterSpacing: 0.5, paddingHorizontal: 4, width: "22%" },
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
}

export function SpecSheetDocument({ style, euSizes, boxes }: SpecSheetDocumentProps) {
  return (
    <Document title={`${style.styleNumber} — Spec Sheet`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.wordmark}>HECTOR FOOTWEAR</Text>
            <Text style={styles.tagline}>WHOLESALE — EST. 1984</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Spec Sheet</Text>
            <Text style={styles.docMeta}>{style.styleNumber}</Text>
          </View>
        </View>

        <Text style={styles.styleTitle}>{style.name}</Text>
        <Text style={styles.styleTagline}>{style.tagline}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>CATEGORY</Text>
            <Text style={styles.infoValue}>{style.category}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>GENDER</Text>
            <Text style={styles.infoValue}>{style.gender}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>WEIGHT</Text>
            <Text style={styles.infoValue}>{style.weightOz} oz</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>MSRP</Text>
            <Text style={styles.infoValue}>{formatEUR(style.msrp)}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>MATERIALS</Text>
        <Text style={styles.infoValue}>{style.materials.join(", ")}</Text>

        <Text style={styles.sectionLabel}>SIZE BREAKDOWN (PAIRS PER BOX)</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.thFirst}>BOX</Text>
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

        <Text style={styles.footer}>
          Hector Footwear Wholesale · {SUPPORT_EMAIL}. Materials, weights, and box breakdowns are
          illustrative and subject to production tolerances.
        </Text>
      </Page>
    </Document>
  );
}
