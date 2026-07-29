/**
 * Fixture data for `npm run seed`. Moved out of src/lib/data/* when those
 * modules became live Supabase reads — kept here so seeding a fresh project
 * stays a one-command, DB-independent operation.
 */
import type { Account, Order, SavedAssortment, Style } from "../src/lib/types";

/**
 * Seed fixtures don't set availableBoxTypes/primaryImageUrl (DB defaults to
 * all 3 boxes) or any of the Product Management module's columns (migrations
 * 0013-0015) — those all have DB-side defaults too, and scripts/seed.ts's
 * `styles` insert only ever sets the columns listed in this Omit.
 */
type SeedStyle = Omit<
  Style,
  | "availableBoxTypes"
  | "primaryImageUrl"
  | "createdAt"
  | "brandId"
  | "brandName"
  | "supplierId"
  | "productType"
  | "tags"
  | "collectionIds"
  | "status"
  | "featured"
  | "publishAt"
  | "costPrice"
  | "distributorPrice"
  | "salePrice"
  | "saleStartAt"
  | "saleEndAt"
  | "currency"
  | "taxClass"
  | "vatRate"
  | "customerGroupPrices"
  | "barcode"
  | "gtin"
  | "upc"
  | "mpn"
  | "lowStockThreshold"
  | "trackInventory"
  | "allowBackorder"
  | "incomingStock"
  | "seoTitle"
  | "metaDescription"
  | "seoKeywords"
  | "canonicalUrl"
  | "robots"
  | "ogTitle"
  | "ogDescription"
  | "ogImageUrl"
  | "twitterCard"
  | "structuredData"
  | "relations"
  | "documents"
  | "attributes"
  | "lengthCm"
  | "widthCm"
  | "heightCm"
  | "shippingClass"
  | "freightClass"
  | "hazardous"
  | "packageLengthCm"
  | "packageWidthCm"
  | "packageHeightCm"
>;

export const STYLES: SeedStyle[] = [
  // ---------------------------------------------------------------------
  // Summer collection — Loafers, Wedding, Sneakers, Sandals
  // ---------------------------------------------------------------------
  {
    id: "st-01",
    slug: "riviera-loafer",
    styleNumber: "HL-1001",
    name: "Riviera Loafer",
    category: "loafers",
    season: "summer",
    gender: "unisex",
    availability: "available",
    tagline: "The penny loafer, unchanged since the original last.",
    description:
      "A full-grain leather penny loafer built on a hand-lasted last with a leather sole and a stacked heel. The shoe retailers reorder without being asked.",
    materials: ["Full-grain leather", "Leather sole", "Stacked leather heel"],
    colorways: [
      { id: "c1", name: "Bone / Cinder", swatch: ["#e9e4d8", "#6b6560"], skuSuffix: "BON" },
      { id: "c2", name: "Ink", swatch: ["#1a1d22", "#6b6560"], skuSuffix: "INK" },
      { id: "c3", name: "Merlot", swatch: ["#5c2030", "#e9e4d8"], skuSuffix: "MER" },
    ],
    basePrice: 46,
    msrp: 120,
    weightOz: 9.6,
    lastNote: "Best reorder rate of any style in the line. Keep Ink deep on standing orders.",
  },
  {
    id: "st-02",
    slug: "tassel-classic",
    styleNumber: "HL-1010",
    name: "Tassel Classic",
    category: "loafers",
    season: "summer",
    gender: "mens",
    availability: "available",
    tagline: "A dressier tassel build for accounts that skew formal.",
    description:
      "Same construction as the Riviera with a tasseled vamp and a slightly narrower toe — built for accounts whose floor leans business casual.",
    materials: ["Full-grain leather", "Leather sole"],
    colorways: [
      { id: "c1", name: "Cinder", swatch: ["#6b6560", "#e4e1d9"], skuSuffix: "CIN" },
      { id: "c2", name: "Bone", swatch: ["#e9e4d8", "#a9a39a"], skuSuffix: "BON" },
    ],
    basePrice: 49,
    msrp: 128,
    weightOz: 10.1,
    lastNote: "Pairs well with Riviera on the same wall — sell as a two-up opener.",
  },
  {
    id: "st-03",
    slug: "ivory-aisle",
    styleNumber: "HW-1001",
    name: "Ivory Aisle",
    category: "wedding",
    season: "summer",
    gender: "womens",
    availability: "prebook",
    shipWindow: "Ships March 2027",
    tagline: "Satin wedding flat with a cushioned hidden footbed.",
    description:
      "A satin-upper wedding flat with a hidden foam footbed for all-day wear, built for bridal and special-occasion accounts. Pre-book only — allocation is confirmed against mill minimums.",
    materials: ["Silk-blend satin", "Foam-cushioned footbed", "Leather sole"],
    colorways: [
      { id: "c1", name: "Ivory", swatch: ["#f4f1ea", "#e4e1d9"], skuSuffix: "IVY" },
      { id: "c2", name: "Chalk", swatch: ["#e4e1d9", "#f4f1ea"], skuSuffix: "CHK" },
    ],
    basePrice: 58,
    msrp: 150,
    weightOz: 8.2,
    lastNote: "Pre-book cutoff is tight — confirm quantities before the mill locks in December.",
  },
  {
    id: "st-04",
    slug: "grosgrain-oxford",
    styleNumber: "HW-1010",
    name: "Grosgrain Oxford",
    category: "wedding",
    season: "summer",
    gender: "mens",
    availability: "available",
    tagline: "A formal oxford with a grosgrain-ribbon trim.",
    description:
      "A patent-toe oxford with a grosgrain trim at the collar — built for wedding-party and formal-rental accounts that need a shoe that photographs well and holds up through a full day on its feet.",
    materials: ["Patent leather toe", "Full-grain leather upper", "Leather sole"],
    colorways: [
      { id: "c1", name: "Ink", swatch: ["#1a1d22", "#e9e4d8"], skuSuffix: "INK" },
      { id: "c2", name: "Bone", swatch: ["#e9e4d8", "#1a1d22"], skuSuffix: "BON" },
    ],
    basePrice: 55,
    msrp: 145,
    weightOz: 10.8,
    lastNote: "Strong sell-through with formalwear rental accounts ahead of spring wedding season.",
  },
  {
    id: "st-05",
    slug: "canvas-low-84",
    styleNumber: "HS-1001",
    name: "Canvas Low '84",
    category: "sneakers",
    season: "summer",
    gender: "unisex",
    availability: "available",
    tagline: "The archive canvas low, reissued.",
    description:
      "A vulcanized canvas low-top from the archive, reissued with the original gum outsole. Reads as lifestyle, priced as an easy opener for a new account's first PO.",
    materials: ["Canvas upper", "Vulcanized rubber construction", "Gum rubber outsole"],
    colorways: [
      { id: "c1", name: "Chalk", swatch: ["#e4e1d9", "#a9a39a"], skuSuffix: "CHK" },
      { id: "c2", name: "Signal", swatch: ["#1e48b8", "#e4e1d9"], skuSuffix: "SIG" },
      { id: "c3", name: "Ink", swatch: ["#1a1d22", "#6b6560"], skuSuffix: "INK" },
    ],
    basePrice: 34,
    msrp: 88,
    weightOz: 9.4,
    lastNote: "Lowest price point in the summer range — good opener for a new account's first PO.",
  },
  {
    id: "st-06",
    slug: "court-retro",
    styleNumber: "HS-1010",
    name: "Court Retro",
    category: "sneakers",
    season: "summer",
    gender: "unisex",
    availability: "available",
    tagline: "Leather court silhouette lifted from the 1984 mold.",
    description:
      "Leather court sneaker with a herringbone outsole pattern lifted from the original 1984 mold. Reads as a lifestyle shoe, performs as a court shoe.",
    materials: ["Full-grain leather", "Herringbone rubber outsole", "EVA sockliner"],
    colorways: [
      { id: "c1", name: "Bone / Ink", swatch: ["#e9e4d8", "#1a1d22"], skuSuffix: "BON" },
      { id: "c2", name: "Court Yellow", swatch: ["#e8b400", "#1a1d22"], skuSuffix: "CYL" },
    ],
    basePrice: 39,
    msrp: 100,
    weightOz: 10.5,
    lastNote: "Best sell-through of any sneaker style. Reorder cadence is roughly 8 weeks.",
  },
  {
    id: "st-07",
    slug: "coastal-slide",
    styleNumber: "HD-1001",
    name: "Coastal Slide",
    category: "sandals",
    season: "summer",
    gender: "unisex",
    availability: "available",
    tagline: "A leather slide built for warm-weather retailers.",
    description:
      "A single-strap leather slide on a molded EVA footbed — the lowest price point in the line, built for accounts testing sell-through before committing to a deeper buy.",
    materials: ["Full-grain leather strap", "Molded EVA footbed", "Rubber outsole"],
    colorways: [
      { id: "c1", name: "Olive", swatch: ["#5c5c3f", "#1a1d22"], skuSuffix: "OLV" },
      { id: "c2", name: "Cinder", swatch: ["#6b6560", "#e4e1d9"], skuSuffix: "CIN" },
    ],
    basePrice: 22,
    msrp: 58,
    weightOz: 6.1,
    lastNote: "Lowest price point in the line — good opener for a new account's first PO.",
  },
  {
    id: "st-08",
    slug: "woven-strap",
    styleNumber: "HD-1010",
    name: "Woven Strap",
    category: "sandals",
    season: "summer",
    gender: "womens",
    availability: "available",
    tagline: "Hand-woven leather straps on a cushioned wedge.",
    description:
      "Hand-woven leather straps over a low cork wedge — carries well as a warm-climate year-round style, not just a summer close-out item.",
    materials: ["Hand-woven leather", "Cork wedge midsole", "Rubber outsole"],
    colorways: [
      { id: "c1", name: "Bone", swatch: ["#e9e4d8", "#c9a06a"], skuSuffix: "BON" },
      { id: "c2", name: "Merlot", swatch: ["#5c2030", "#e9e4d8"], skuSuffix: "MER" },
    ],
    basePrice: 26,
    msrp: 68,
    weightOz: 6.8,
    lastNote: "Carries well as a year-round style in warm-climate markets, not just a summer close-out.",
  },

  // ---------------------------------------------------------------------
  // Winter collection — Boots, Sneakers, Formal, Anatomic
  // ---------------------------------------------------------------------
  {
    id: "st-09",
    slug: "highland-chelsea",
    styleNumber: "HB-2001",
    name: "Highland Chelsea",
    category: "boots",
    season: "winter",
    gender: "unisex",
    availability: "available",
    tagline: "The archive Chelsea boot, rebuilt for four-season wear.",
    description:
      "A full-grain leather Chelsea boot with elastic side gores and a lugged outsole for cold-weather markets. The technical anchor of the winter range.",
    materials: ["Full-grain leather", "Elastic side gores", "Lugged rubber outsole"],
    colorways: [
      { id: "c1", name: "Cinder", swatch: ["#6b6560", "#1a1d22"], skuSuffix: "CIN" },
      { id: "c2", name: "Ink", swatch: ["#1a1d22", "#6b6560"], skuSuffix: "INK" },
    ],
    basePrice: 62,
    msrp: 165,
    weightOz: 18.4,
    lastNote: "Reorders fastest in Ink. Keep 12+ deep on standing orders through Q1.",
  },
  {
    id: "st-10",
    slug: "fieldwork-lace",
    styleNumber: "HB-2010",
    name: "Fieldwork Lace",
    category: "boots",
    season: "winter",
    gender: "mens",
    availability: "prebook",
    shipWindow: "Ships November 2027",
    tagline: "A lace-up work boot for cold-weather specialty accounts.",
    description:
      "A water-resistant lace-up boot with a reinforced toe and a lugged outsole. Pre-book only — limited tannery allocation confirmed for winter.",
    materials: ["Water-resistant full-grain leather", "Reinforced toe cap", "Lugged rubber outsole"],
    colorways: [
      { id: "c1", name: "Olive", swatch: ["#5c5c3f", "#1a1d22"], skuSuffix: "OLV" },
      { id: "c2", name: "Ink / Ember", swatch: ["#1a1d22", "#c1451e"], skuSuffix: "EMB" },
    ],
    basePrice: 68,
    msrp: 175,
    weightOz: 20.2,
    lastNote: "Pre-book cutoff is tight — confirm quantities before the mill locks in September.",
  },
  {
    id: "st-11",
    slug: "insulated-hi",
    styleNumber: "HS-2001",
    name: "Insulated Hi",
    category: "sneakers",
    season: "winter",
    gender: "unisex",
    availability: "available",
    tagline: "A high-top sneaker with a thermal-lined collar.",
    description:
      "A leather high-top with a thermal-lined collar and a water-resistant finish for cold-weather specialty and streetwear accounts.",
    materials: ["Full-grain leather", "Thermal-lined collar", "EVA midsole"],
    colorways: [
      { id: "c1", name: "Ink", swatch: ["#1a1d22", "#6b6560"], skuSuffix: "INK" },
      { id: "c2", name: "Signal Navy", swatch: ["#1e2a4a", "#e9e4d8"], skuSuffix: "NVY" },
    ],
    basePrice: 44,
    msrp: 115,
    weightOz: 12.6,
    lastNote: "Ink is the account favorite for window display through the winter months.",
  },
  {
    id: "st-12",
    slug: "thermal-low",
    styleNumber: "HS-2010",
    name: "Thermal Low",
    category: "sneakers",
    season: "winter",
    gender: "unisex",
    availability: "available",
    tagline: "A low-top companion to the Insulated Hi.",
    description:
      "Same thermal-lined construction as the Insulated Hi in a low-top silhouette, for accounts whose customers want the warmth without the collar height.",
    materials: ["Full-grain leather", "Thermal-lined collar", "EVA midsole"],
    colorways: [
      { id: "c1", name: "Cinder", swatch: ["#6b6560", "#e4e1d9"], skuSuffix: "CIN" },
      { id: "c2", name: "Bone", swatch: ["#e9e4d8", "#6b6560"], skuSuffix: "BON" },
    ],
    basePrice: 41,
    msrp: 108,
    weightOz: 11.8,
    lastNote: "New for this winter range — sell as a companion to Insulated Hi.",
  },
  {
    id: "st-13",
    slug: "cap-toe-derby",
    styleNumber: "HF-2001",
    name: "Cap-Toe Derby",
    category: "formal",
    season: "winter",
    gender: "mens",
    availability: "available",
    tagline: "The formal-wall anchor — full-grain cap-toe derby.",
    description:
      "A full-grain leather cap-toe derby on a leather sole, built for accounts serving formalwear and business-professional customers through the winter season.",
    materials: ["Full-grain leather", "Leather sole", "Leather sockliner"],
    colorways: [
      { id: "c1", name: "Ink", swatch: ["#1a1d22", "#6b6560"], skuSuffix: "INK" },
      { id: "c2", name: "Cinder", swatch: ["#6b6560", "#1a1d22"], skuSuffix: "CIN" },
    ],
    basePrice: 57,
    msrp: 148,
    weightOz: 11.4,
    lastNote: "Best sell-through of any formal style. Reorder cadence is roughly 8 weeks.",
  },
  {
    id: "st-14",
    slug: "plain-oxford",
    styleNumber: "HF-2010",
    name: "Plain Oxford",
    category: "formal",
    season: "winter",
    gender: "mens",
    availability: "available",
    tagline: "A cleaner, minimal read on Cap-Toe Derby.",
    description:
      "Strips the Cap-Toe Derby down to a single-material plain-toe upper with a closed lacing system for a cleaner silhouette at a lower price point.",
    materials: ["Full-grain leather", "Leather sole"],
    colorways: [
      { id: "c1", name: "Ink", swatch: ["#1a1d22", "#e9e4d8"], skuSuffix: "INK" },
      { id: "c2", name: "Merlot", swatch: ["#5c2030", "#1a1d22"], skuSuffix: "MER" },
    ],
    basePrice: 54,
    msrp: 140,
    weightOz: 11.0,
    lastNote: "Carries well as a value-tier opener alongside Cap-Toe Derby.",
  },
  {
    id: "st-15",
    slug: "comfort-step",
    styleNumber: "HA-2001",
    name: "Comfort Step",
    category: "anatomic",
    season: "winter",
    gender: "womens",
    availability: "available",
    tagline: "Anatomic footbed construction for all-day retail staff.",
    description:
      "A contoured, anatomically-shaped footbed under a full-grain leather upper — built for accounts whose customers are on their feet all day, not just walking a lookbook.",
    materials: ["Full-grain leather", "Anatomic cork-latex footbed", "Rubber outsole"],
    colorways: [
      { id: "c1", name: "Bone", swatch: ["#e9e4d8", "#a9a39a"], skuSuffix: "BON" },
      { id: "c2", name: "Chalk", swatch: ["#e4e1d9", "#e9e4d8"], skuSuffix: "CHK" },
    ],
    basePrice: 45,
    msrp: 118,
    weightOz: 10.2,
    lastNote: "Skews comfort-specialty — carries well outside of core footwear accounts.",
  },
  {
    id: "st-16",
    slug: "orthotic-walk",
    styleNumber: "HA-2010",
    name: "Orthotic Walk",
    category: "anatomic",
    season: "winter",
    gender: "unisex",
    availability: "available",
    tagline: "Removable orthotic footbed, built for daily wear.",
    description:
      "Same anatomic platform as Comfort Step with a removable orthotic footbed for accounts serving customers who need custom insert compatibility.",
    materials: ["Full-grain leather", "Removable orthotic footbed", "Rubber outsole"],
    colorways: [
      { id: "c1", name: "Ink", swatch: ["#1a1d22", "#6b6560"], skuSuffix: "INK" },
      { id: "c2", name: "Olive", swatch: ["#5c5c3f", "#1a1d22"], skuSuffix: "OLV" },
    ],
    basePrice: 48,
    msrp: 125,
    weightOz: 10.9,
    lastNote: "New for this winter range — pairs well with Comfort Step on the same wall.",
  },
];

export const ACCOUNTS: Account[] = [
  {
    id: "acct-001",
    businessName: "Union Supply Co.",
    contactName: "Dana Ferris",
    email: "buyer@unionsupply.com",
    password: "wholesale84",
    status: "active",
    creditTerms: "net30",
    creditLimit: 45000,
    priceMultiplier: 1,
    resaleCertId: "OR-RS-88214",
    businessType: "Multi-brand footwear specialty (2 doors)",
    storeLocation: "Portland, OR",
    expectedVolume: "€40,000–€75,000 / year",
    appliedAt: "2025-11-03",
    approvedAt: "2025-11-06",
    role: "buyer",
    shipTo: [
      {
        id: "ship-1",
        label: "Union Supply — Hawthorne",
        line1: "4110 SE Hawthorne Blvd",
        city: "Portland",
        state: "OR",
        zip: "97214",
        isDefault: true,
      },
      {
        id: "ship-2",
        label: "Union Supply — Distribution Annex",
        line1: "8800 NE Alderwood Rd, Suite C",
        city: "Portland",
        state: "OR",
        zip: "97220",
      },
    ],
    rep: {
      name: "Marcus Iyer",
      title: "Territory Sales Manager, Pacific NW",
      email: "marcus.iyer@hector1984.com",
      phone: "(503) 555-0148",
      initials: "MI",
      territory: "WA / OR / ID",
    },
  },
  {
    id: "acct-002",
    businessName: "Fieldhouse Footwear",
    contactName: "Priya Nandakumar",
    email: "buyer@fieldhouseath.com",
    password: "wholesale84",
    status: "active",
    creditTerms: "net60",
    creditLimit: 120000,
    priceMultiplier: 1,
    resaleCertId: "IL-RS-40217",
    businessType: "Regional chain (6 doors)",
    storeLocation: "Chicago, IL",
    expectedVolume: "€150,000+ / year",
    appliedAt: "2024-02-11",
    approvedAt: "2024-02-14",
    role: "buyer",
    shipTo: [
      {
        id: "ship-1",
        label: "Fieldhouse — DC Chicago",
        line1: "2200 S Ashland Ave",
        city: "Chicago",
        state: "IL",
        zip: "60608",
        isDefault: true,
      },
    ],
    rep: {
      name: "Renata Souza",
      title: "Key Account Director",
      email: "renata.souza@hector1984.com",
      phone: "(312) 555-0193",
      initials: "RS",
      territory: "National Accounts",
    },
  },
  {
    id: "acct-003",
    businessName: "Trailhead Mercantile",
    contactName: "Owen Bright",
    email: "buyer@trailheadmerc.com",
    password: "wholesale84",
    status: "active",
    creditTerms: "prepay",
    creditLimit: 8000,
    priceMultiplier: 1,
    resaleCertId: "CO-RS-11209",
    businessType: "Independent footwear specialty (1 door)",
    storeLocation: "Bend, OR",
    expectedVolume: "€10,000–€25,000 / year",
    appliedAt: "2026-05-19",
    approvedAt: "2026-05-24",
    role: "buyer",
    shipTo: [
      {
        id: "ship-1",
        label: "Trailhead Mercantile",
        line1: "119 NW Newport Ave",
        city: "Bend",
        state: "OR",
        zip: "97703",
        isDefault: true,
      },
    ],
    rep: {
      name: "Marcus Iyer",
      title: "Territory Sales Manager, Pacific NW",
      email: "marcus.iyer@hector1984.com",
      phone: "(503) 555-0148",
      initials: "MI",
      territory: "WA / OR / ID",
    },
  },
];

/** Order history — unitPrice reflects each order's `terms` (prepay -10%, net30 -5%, net60 flat). */
export const ORDERS: Record<string, Order[]> = {
  "acct-001": [
    {
      id: "ORD-59090",
      poNumber: "US-0522",
      placedAt: "2026-07-25",
      status: "submitted",
      terms: "net30",
      shipToId: "ship-1",
      notes: "Please hold for combined ship with any Grosgrain Oxford backorder.",
      lines: [
        { styleId: "st-01", colorwayId: "c1", boxTypeId: "box10", qty: 2, unitPrice: 43.7 },
      ],
    },
    {
      id: "ORD-59012",
      poNumber: "US-0514",
      placedAt: "2026-07-20",
      status: "in_production",
      terms: "net30",
      shipToId: "ship-1",
      lines: [
        { styleId: "st-05", colorwayId: "c1", boxTypeId: "box8", qty: 2, unitPrice: 32.3 },
      ],
      invoiceUrl: "#",
    },
    {
      id: "ORD-58877",
      poNumber: "US-0501",
      placedAt: "2026-07-10",
      status: "shipped",
      terms: "net30",
      shipToId: "ship-2",
      lines: [
        { styleId: "st-13", colorwayId: "c1", boxTypeId: "box8", qty: 1, unitPrice: 54.15 },
        { styleId: "st-13", colorwayId: "c1", boxTypeId: "box10", qty: 1, unitPrice: 54.15 },
        { styleId: "st-13", colorwayId: "c2", boxTypeId: "box12", qty: 1, unitPrice: 54.15 },
      ],
      invoiceUrl: "#",
    },
    {
      id: "ORD-58210",
      poNumber: "US-0472",
      placedAt: "2026-06-02",
      status: "delivered",
      terms: "net30",
      shipToId: "ship-1",
      lines: [
        { styleId: "st-01", colorwayId: "c1", boxTypeId: "box10", qty: 1, unitPrice: 43.7 },
        { styleId: "st-01", colorwayId: "c1", boxTypeId: "box12", qty: 1, unitPrice: 43.7 },
        { styleId: "st-01", colorwayId: "c2", boxTypeId: "box10", qty: 1, unitPrice: 43.7 },
        { styleId: "st-02", colorwayId: "c2", boxTypeId: "box8", qty: 1, unitPrice: 46.55 },
        { styleId: "st-02", colorwayId: "c2", boxTypeId: "box10", qty: 1, unitPrice: 46.55 },
      ],
    },
  ],
  "acct-002": [
    {
      id: "ORD-57110",
      poNumber: "FH-2291",
      placedAt: "2026-07-15",
      status: "shipped",
      terms: "net60",
      shipToId: "ship-1",
      lines: [
        { styleId: "st-11", colorwayId: "c1", boxTypeId: "box12", qty: 3, unitPrice: 44 },
      ],
      invoiceUrl: "#",
    },
  ],
  "acct-003": [
    {
      id: "ORD-59201",
      poNumber: "TM-0031",
      placedAt: "2026-07-24",
      status: "submitted",
      terms: "prepay",
      shipToId: "ship-1",
      lines: [
        { styleId: "st-16", colorwayId: "c1", boxTypeId: "box8", qty: 1, unitPrice: 43.2 },
      ],
    },
  ],
};

export const ASSORTMENTS: Record<string, SavedAssortment[]> = {
  "acct-001": [
    {
      id: "asrt-1",
      name: "Fall Reorder Wall",
      createdAt: "2026-06-15",
      styleIds: ["st-01", "st-13", "st-05"],
      lines: [],
    },
    {
      id: "asrt-2",
      name: "New Door Opener Kit",
      createdAt: "2026-07-01",
      styleIds: ["st-07", "st-08", "st-04"],
      lines: [],
    },
  ],
  "acct-002": [
    {
      id: "asrt-1",
      name: "Flagship Store Reset",
      createdAt: "2026-05-20",
      styleIds: ["st-11", "st-13", "st-09", "st-01"],
      lines: [],
    },
  ],
  "acct-003": [],
};
