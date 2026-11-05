import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import sharp from "sharp";
import { groupByCategory } from "@/lib/catalogGroups";
import { getBoxType } from "@/lib/data/boxTypes";
import { getHomepageHero } from "@/lib/data/siteContent";
import { getSeasonSettings } from "@/lib/data/seasonSettings";
import { getAllStylesForAdmin } from "@/lib/data/styles";
import { styleTitle } from "@/lib/modelColours";
import { getEffectiveBasePrice, MIN_ORDER_PAIRS } from "@/lib/pricing";
import { CatalogueDocument, type CatalogueItem } from "@/lib/pdf/CatalogueDocument";
import { urlForLocale } from "@/i18n/domains";
import type { Category, Season, Style } from "@/lib/types";

const CATEGORY_TITLE: Record<Category, string> = {
  boots: "Μποτάκια",
  formal: "Επίσημα",
  wedding: "Γαμήλια",
  loafers: "Loafers",
  sneakers: "Sneakers",
  anatomic: "Ανατομικά",
  sandals: "Σανδάλια",
};

const SEASON_TITLE: Record<Season, string> = {
  winter: "Χειμερινή συλλογή",
  summer: "Καλοκαιρινή συλλογή",
};

/** 1000px is sharp at the size a photo prints in the catalogue and keeps the file small enough for WhatsApp. */
const PHOTO_WIDTH = 1000;
const PHOTO_CONCURRENCY = 6;

/** What kind of shoe it is, read from the product's English name. Colour names stay in English (owner's rule). */
function shoeTypeInGreek(style: Style): string {
  const name = style.name.toLowerCase();
  const suede = name.includes("suede");
  if (name.includes("groom")) return "Δερμάτινο παπούτσι γαμπρού";
  if (name.includes("sandal")) return suede ? "Σανδάλι από καστόρι" : "Δερμάτινο σανδάλι";
  if (name.includes("sneaker")) return suede ? "Sneaker από καστόρι" : "Δερμάτινο sneaker";
  if (name.includes("boat")) return suede ? "Boat από καστόρι" : "Δερμάτινο boat";
  if (name.includes("espadrille")) return suede ? "Εσπαντρίγια από καστόρι" : "Δερμάτινη εσπαντρίγια";
  if (name.includes("formal loafer")) return "Δερμάτινο επίσημο loafer";
  if (name.includes("loafer")) return suede ? "Loafer από καστόρι" : "Δερμάτινο loafer";
  if (name.includes("boot")) return "Δερμάτινο μποτάκι";
  if (name.includes("formal")) return "Δερμάτινο επίσημο παπούτσι";
  return CATEGORY_TITLE[style.category];
}

function boxLabel(style: Style): string {
  return style.availableBoxTypes.map((id) => `${getBoxType(id).totalPairs} ζευγ.`).join(" / ");
}

/** "8 ζευγάρια (νούμερα 40–44) ή 10 ζευγάρια (νούμερα 40–45)", only for the sizes these products use. */
function boxTerms(products: Style[]): string {
  const ids = [...new Set(products.flatMap((s) => s.availableBoxTypes))];
  const parts = ids
    .map((id) => getBoxType(id))
    .sort((a, b) => a.totalPairs - b.totalPairs)
    .map((box) => {
      const sizes = Object.keys(box.sizeBreakdown).map(Number).sort((a, b) => a - b);
      return `${box.totalPairs} ζευγάρια (νούμερα ${sizes[0]}–${sizes[sizes.length - 1]})`;
    });
  return `${parts.join(" ή ")}, όπως αναγράφεται σε κάθε μοντέλο.`;
}

async function downloadPhoto(url: string): Promise<Buffer> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const source = Buffer.from(await response.arrayBuffer());
      return await sharp(source).resize({ width: PHOTO_WIDTH, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/** A photo that won't load fails the whole catalogue: this goes to customers, so an error beats a gap. */
async function downloadPhotos(products: Style[]): Promise<Map<string, Buffer>> {
  const photos = new Map<string, Buffer>();
  const queue = products.filter((s) => s.primaryImageUrl);
  const worker = async () => {
    for (let style = queue.shift(); style; style = queue.shift()) {
      try {
        photos.set(style.id, await downloadPhoto(style.primaryImageUrl!));
      } catch (err) {
        throw new Error(`Δεν φορτώθηκε η φωτογραφία του ${styleTitle(style)}.`, { cause: err });
      }
    }
  };
  await Promise.all(Array.from({ length: PHOTO_CONCURRENCY }, worker));
  return photos;
}

export async function buildCataloguePdf(season: Season, withPrices: boolean): Promise<Buffer> {
  const [allStyles, settings, hero] = await Promise.all([getAllStylesForAdmin(), getSeasonSettings(), getHomepageHero()]);
  // Closed seasons are included on purpose: the owner sends these when a customer asks.
  const products = allStyles
    .filter((s) => (s.status ?? "active") === "active" && s.colorways.length > 0 && (s.season === season || s.season === "both"))
    .sort((a, b) => styleTitle(a).localeCompare(styleTitle(b), "en", { numeric: true }));
  if (products.length === 0) throw new Error("Δεν υπάρχουν προϊόντα σε αυτή τη σεζόν.");

  const photos = await downloadPhotos(products);
  const chapters = groupByCategory(products).map(({ category, styles }) => ({
    key: category,
    label: CATEGORY_TITLE[category],
    items: styles.map(
      (style): CatalogueItem => ({
        key: style.id,
        title: styleTitle(style),
        type: shoeTypeInGreek(style),
        styleNumber: style.styleNumber,
        boxLabel: boxLabel(style),
        price: getEffectiveBasePrice(style),
        photo: photos.get(style.id),
      }),
    ),
  }));

  return renderToBuffer(
    CatalogueDocument({
      seasonLabel: settings[season].label,
      title: SEASON_TITLE[season],
      chapters,
      coverPhoto: chapters[0].items.find((item) => item.photo)?.photo,
      withPrices,
      boxTerms: boxTerms(products),
      minOrderPairs: MIN_ORDER_PAIRS,
      // A closed season can't promise a date; an open one uses the owner's outer limit.
      deliveryNote: settings[season].enabled
        ? `Έτοιμο το πολύ σε ${hero.productionLeadTimeDays} ημέρες, συνήθως νωρίτερα.`
        : "Για διαθεσιμότητα και χρόνο παράδοσης, επικοινωνήστε μαζί μας.",
      websiteHost: new URL(urlForLocale("el", "/")).host.replace(/^www\./, ""),
    }),
  );
}
