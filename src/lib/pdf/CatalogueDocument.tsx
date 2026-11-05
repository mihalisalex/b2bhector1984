import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatEUR } from "@/lib/pricing";
import { SUPPORT_EMAIL, WHATSAPP_NUMBER } from "@/lib/contact";
import { registerPdfFonts, PDF_FONT_FAMILY } from "@/lib/pdf/fonts";

registerPdfFonts();

const INK = "#121212";
const SOFT = "#6b6b6b";
const LINE = "#e2e2e2";
/** The same light grey as the cleaned product photos, so a shoe without a photo keeps the grid. */
const PHOTO_GREY = "#f0f0f0";

const styles = StyleSheet.create({
  page: { fontFamily: PDF_FONT_FAMILY, color: INK, backgroundColor: "#ffffff", padding: 36, paddingBottom: 52 },
  cover: { fontFamily: PDF_FONT_FAMILY, color: INK, backgroundColor: "#ffffff", padding: 36, justifyContent: "space-between" },
  coverPhoto: { width: 523, height: 560, objectFit: "cover", backgroundColor: PHOTO_GREY },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `0.75pt solid ${INK}`, paddingBottom: 8, marginBottom: 14 },
  categoryTitle: { fontSize: 20 },
  categoryCount: { fontSize: 8, color: SOFT, letterSpacing: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { width: 254, marginBottom: 12 },
  cardLarge: { width: 523 },
  photo: { width: 254, height: 272, objectFit: "cover", backgroundColor: PHOTO_GREY },
  photoLarge: { width: 523, height: 590, objectFit: "cover", backgroundColor: PHOTO_GREY },
  details: { borderTop: `0.5pt solid ${LINE}`, marginTop: 6, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 11.5, fontWeight: 700 },
  type: { fontSize: 8.5, color: SOFT, marginTop: 2 },
  price: { fontSize: 11.5, fontWeight: 700, textAlign: "right" },
  priceUnit: { fontSize: 7, color: SOFT, marginTop: 2, textAlign: "right" },
  footer: { position: "absolute", left: 36, right: 36, bottom: 24, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: SOFT, letterSpacing: 0.5 },
  closingLabel: { fontSize: 8, fontWeight: 700, color: SOFT, letterSpacing: 1.2, marginBottom: 10 },
  closingRow: { flexDirection: "row", borderTop: `0.5pt solid ${LINE}`, paddingVertical: 9 },
  closingKey: { width: 150, fontSize: 9.5, fontWeight: 700 },
  closingValue: { flex: 1, fontSize: 9.5, lineHeight: 1.5, color: "#333333" },
  contactLine: { fontSize: 11, lineHeight: 1.8 },
});

export interface CatalogueItem {
  key: string;
  title: string;
  type: string;
  styleNumber: string;
  boxLabel: string;
  price: number;
  /** JPEG bytes; undefined when the product has no photo yet. */
  photo?: Buffer;
}

export interface CatalogueChapter {
  key: string;
  label: string;
  items: CatalogueItem[];
}

export interface CatalogueDocumentProps {
  seasonLabel: string;
  title: string;
  chapters: CatalogueChapter[];
  coverPhoto?: Buffer;
  withPrices: boolean;
  /** "8 ζευγάρια (νούμερα 40–44)" for each box size the listed products use. */
  boxTerms: string;
  minOrderPairs: number;
  deliveryNote: string;
  websiteHost: string;
}

function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
      <Text style={{ fontSize: size, fontWeight: 700, letterSpacing: size * 0.18 }}>HECTOR</Text>
      <Text style={{ fontSize: size * 0.42, letterSpacing: size * 0.12, color: SOFT, marginLeft: 6 }}>FOOTWEAR</Text>
    </View>
  );
}

function Footer({ seasonLabel }: { seasonLabel: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{`HECTOR FOOTWEAR  ·  ${seasonLabel}`}</Text>
      <Text render={({ pageNumber }) => String(pageNumber)} />
    </View>
  );
}

function Photo({ src, style }: { src?: Buffer; style: typeof styles.photo }) {
  if (!src) return <View style={style} />;
  // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt attribute.
  return <Image src={{ data: src, format: "jpg" }} style={style} />;
}

function ProductCard({ item, large, withPrices }: { item: CatalogueItem; large: boolean; withPrices: boolean }) {
  return (
    <View style={large ? styles.cardLarge : styles.card}>
      <Photo src={item.photo} style={large ? styles.photoLarge : styles.photo} />
      <View style={styles.details}>
        <View>
          <Text style={styles.name}>{item.title}</Text>
          <Text style={styles.type}>{item.type}</Text>
          <Text style={styles.type}>{`Κωδ. ${item.styleNumber}  ·  Κιβώτιο ${item.boxLabel}`}</Text>
        </View>
        {withPrices && (
          <View>
            <Text style={styles.price}>{formatEUR(item.price, "el")}</Text>
            <Text style={styles.priceUnit}>το ζευγάρι</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ClosingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.closingRow}>
      <Text style={styles.closingKey}>{label}</Text>
      <Text style={styles.closingValue}>{value}</Text>
    </View>
  );
}

/** Four shoes a page; a chapter's lone last shoe gets the whole page rather than a gap. */
function pagesOf(items: CatalogueItem[]): CatalogueItem[][] {
  const pages: CatalogueItem[][] = [];
  for (let i = 0; i < items.length; i += 4) pages.push(items.slice(i, i + 4));
  return pages;
}

export function CatalogueDocument(props: CatalogueDocumentProps) {
  const { seasonLabel, title, chapters, coverPhoto, withPrices, boxTerms, minOrderPairs, deliveryNote, websiteHost } = props;
  return (
    <Document title={`Hector Footwear - ${title}`} author="Hector Footwear">
      <Page size="A4" style={styles.cover}>
        <Wordmark size={26} />
        <Photo src={coverPhoto} style={styles.coverPhoto} />
        <View>
          <Text style={{ fontSize: 9, letterSpacing: 2, color: SOFT }}>{seasonLabel}</Text>
          <Text style={{ fontSize: 32, marginTop: 6 }}>{title}</Text>
          <Text style={{ fontSize: 10, color: SOFT, marginTop: 8 }}>Κατασκευή και χονδρική δερμάτινων ανδρικών υποδημάτων από το 1984</Text>
        </View>
      </Page>

      {chapters.flatMap((chapter) =>
        pagesOf(chapter.items).map((items, index) => (
          <Page size="A4" style={styles.page} key={`${chapter.key}-${index}`}>
            <View style={styles.head}>
              <Text style={styles.categoryTitle}>{chapter.label}</Text>
              <Text style={styles.categoryCount}>{`${chapter.items.length} ${chapter.items.length === 1 ? "ΜΟΝΤΕΛΟ" : "ΜΟΝΤΕΛΑ"}`}</Text>
            </View>
            <View style={styles.grid}>
              {items.map((item) => (
                <ProductCard key={item.key} item={item} large={items.length === 1} withPrices={withPrices} />
              ))}
            </View>
            <Footer seasonLabel={seasonLabel} />
          </Page>
        )),
      )}

      <Page size="A4" style={styles.page}>
        <View style={{ marginBottom: 30 }}>
          <Wordmark />
        </View>
        <Text style={{ fontSize: 26, marginBottom: 10 }}>Πώς δουλεύουμε</Text>
        <Text style={{ fontSize: 10.5, lineHeight: 1.6, color: "#333333", marginBottom: 26, maxWidth: 440 }}>
          Από το 1984 κατασκευάζουμε και διαθέτουμε χονδρικά δερμάτινα ανδρικά υποδήματα σε περισσότερα από 80 καταστήματα. Κάθε παραγγελία μπαίνει στην παραγωγή ειδικά για εσάς.
        </Text>
        <Text style={styles.closingLabel}>ΟΡΟΙ ΠΑΡΑΓΓΕΛΙΑΣ</Text>
        <ClosingRow label="Κιβώτια" value={boxTerms} />
        <ClosingRow label="Ελάχιστη παραγγελία" value={`${minOrderPairs} ζευγάρια.`} />
        <ClosingRow label="Παραστατικά" value="Πρώτα προτιμολόγιο και στη συνέχεια το τιμολόγιο." />
        {withPrices && <ClosingRow label="Τιμές" value="Τιμές χονδρικής ανά ζευγάρι, χωρίς ΦΠΑ. ΦΠΑ προστίθεται μόνο για πελάτες στην Ελλάδα." />}
        <ClosingRow label="Μεταφορά" value="Επιλέγετε τον μεταφορέα της προτίμησής σας και τον χρεώνεστε απευθείας." />
        <ClosingRow label="Παράδοση" value={deliveryNote} />
        <View style={{ borderTop: `0.75pt solid ${INK}`, marginTop: 26, paddingTop: 14 }}>
          <Text style={styles.closingLabel}>ΕΠΙΚΟΙΝΩΝΙΑ</Text>
          <Text style={styles.contactLine}>{SUPPORT_EMAIL}</Text>
          <Text style={styles.contactLine}>{`WhatsApp ${WHATSAPP_NUMBER}`}</Text>
          <Text style={styles.contactLine}>{websiteHost}</Text>
        </View>
        <Footer seasonLabel={seasonLabel} />
      </Page>
    </Document>
  );
}
