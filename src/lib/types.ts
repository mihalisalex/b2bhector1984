export type Category =
  | "loafers"
  | "wedding"
  | "sneakers"
  | "sandals"
  | "boots"
  | "formal"
  | "anatomic";

/** The two real merchandising seasons — used for `season_settings` (admin enable/disable,
 * labels, homepage teaser photos) and anywhere a value has to be one specific season. Kept
 * deliberately narrower than `StyleSeason` below: a season *setting* only ever means one of
 * these two, even though an individual *style* can belong to both. */
export type Season = "summer" | "winter";

/** A style's own season assignment — either one specific season, or `"both"` for a style
 * that should appear in the Summer and Winter spotlights/filters simultaneously. Every
 * place that matches a style against a specific `Season` needs to treat `"both"` as a match
 * regardless of which season is asked for (see `filterStyles` in `catalogFilters.ts` and
 * the homepage/collections season filtering for the two live examples). */
export type StyleSeason = Season | "both";

export type Gender = "mens" | "womens" | "unisex";

export type Availability = "available" | "prebook";

export type AccountStatus = "pending" | "approved" | "active" | "declined";

export type CreditTerms = "prepay" | "net30" | "net60";

export type AccountRole = "buyer" | "admin";

export interface Colorway {
  id: string;
  name: string;
  /** 1-2 swatch hex values used to render the colorway chip/silhouette. */
  swatch: [string, string?];
  skuSuffix: string;
  /** This domain's variant grain is colorway x box-type — SKU/barcode live here. */
  sku?: string;
  barcode?: string;
  /** Null means "inherit the parent product's value" for each of these. */
  priceOverride?: number;
  costOverride?: number;
  salePriceOverride?: number;
  weightOz?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  status?: "active" | "draft" | "archived";
}

export type ProductStatus = "active" | "draft" | "archived" | "private";

export interface Brand {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  leadTimeDays?: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export type RelationType = "related" | "cross_sell" | "upsell" | "frequently_bought" | "accessory";

export interface StyleRelation {
  id: string;
  relatedStyleId: string;
  relationType: RelationType;
  sortOrder: number;
}

export type DocumentKind =
  | "manual"
  | "datasheet"
  | "certificate"
  | "installation_guide"
  | "warranty"
  | "video"
  | "image_360"
  | "other";

export interface StyleDocument {
  id: string;
  kind: DocumentKind;
  storagePath: string;
  publicUrl: string;
  label: string;
  sortOrder: number;
  createdAt: string;
}

export interface StyleAttribute {
  id: string;
  key: string;
  value: string;
  sortOrder: number;
}

export interface CustomerGroupPrice {
  id: string;
  groupName: string;
  price: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
  isDefault: boolean;
}

export interface InventoryMovement {
  id: string;
  colorwayId: string;
  boxTypeId: BoxTypeId;
  warehouseId: string;
  qtyDelta: number;
  reason: string;
  actorAccountId: string | null;
  createdAt: string;
}

export type AdminRole =
  | "super_admin"
  | "admin"
  | "inventory_manager"
  | "sales_manager"
  | "marketing"
  | "content_editor";

export type ProductPermissionKey =
  | "products.view"
  | "products.create"
  | "products.edit"
  | "products.delete"
  | "products.pricing"
  | "products.inventory"
  | "products.seo"
  | "products.bulk"
  | "products.import_export"
  | "products.permissions";

/**
 * Footwear is sold wholesale only in fixed pre-pack box configurations, never
 * as single pairs. Every style ships the same three box sizes (EU 40-45).
 */
export type BoxTypeId = "box8" | "box10" | "box12";

export interface BoxType {
  id: BoxTypeId;
  label: string;
  totalPairs: number;
  /** EU size -> pair count within one box of this type. */
  sizeBreakdown: Record<string, number>;
}

export interface Style {
  id: string;
  slug: string;
  styleNumber: string;
  name: string;
  category: Category;
  season: StyleSeason;
  gender: Gender;
  availability: Availability;
  shipWindow?: string;
  tagline: string;
  description: string;
  materials: string[];
  colorways: Colorway[];
  basePrice: number;
  msrp: number;
  weightOz: number;
  lastNote: string;
  /** Public URL of the admin-uploaded primary product photo, if any. */
  primaryImageUrl?: string;
  /** Which of the 3 fixed box sizes this style is sold in — not every style offers all three. */
  availableBoxTypes: BoxTypeId[];
  createdAt: string;

  // --- General / merchandising ---
  brandId: string;
  brandName: string;
  supplierId?: string;
  productType: string;
  tags: string[];
  collectionIds: string[];
  status: ProductStatus;
  featured: boolean;
  publishAt?: string;

  // --- Pricing ---
  costPrice: number;
  distributorPrice?: number;
  salePrice?: number;
  saleStartAt?: string;
  saleEndAt?: string;
  currency: string;
  taxClass: string;
  vatRate: number;
  customerGroupPrices: CustomerGroupPrice[];

  // --- Inventory / identifiers ---
  barcode?: string;
  gtin?: string;
  upc?: string;
  mpn?: string;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  /** Only meaningful when `allowBackorder` is true — how the shortfall-goes-to-production
   * case is messaged to buyers. 'made_to_order' surfaces the site-wide ~40-day ETA;
   * 'pre_order' drops the fixed ETA in favor of "ships when ready, we'll confirm timing".
   * Added by migration 0031. */
  backorderMode: "made_to_order" | "pre_order";
  incomingStock: number;

  // --- SEO ---
  seoTitle?: string;
  metaDescription?: string;
  seoKeywords: string[];
  canonicalUrl?: string;
  robots: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  twitterCard: string;
  structuredData?: Record<string, unknown>;
  /** The single term this product is optimised for; drives the audit's keyword checks.
   * Added by migration 0025 — `undefined` on every row until it runs. */
  focusKeyword?: string;
  secondaryKeywords: string[];
  /** Twitter card copy, when it should differ from the Open Graph values. */
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImageUrl?: string;

  // --- Relations & docs ---
  relations: StyleRelation[];
  documents: StyleDocument[];
  attributes: StyleAttribute[];

  // --- Shipping ---
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  shippingClass: string;
  freightClass?: string;
  hazardous: boolean;
  packageLengthCm?: number;
  packageWidthCm?: number;
  packageHeightCm?: number;
}

export interface ShipToAddress {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  isDefault?: boolean;
}

export interface SalesRep {
  name: string;
  title: string;
  email: string;
  phone: string;
  initials: string;
  territory: string;
}

export interface Account {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  /** Not captured for every account — only populated automatically for accounts
   * activated from an application (see activateAccount()) since this migration
   * landed; older/seeded accounts need it added by hand in /admin/accounts. */
  phone?: string;
  password: string;
  status: AccountStatus;
  creditTerms: CreditTerms;
  creditLimit: number;
  /** Negotiated-pricing lever: multiplies the terms-discounted unit price. 1 = no adjustment. */
  priceMultiplier: number;
  resaleCertId: string;
  businessType: string;
  storeLocation: string;
  expectedVolume: string;
  appliedAt: string;
  approvedAt?: string;
  shipTo: ShipToAddress[];
  rep: SalesRep;
  /** The rep row's real id, if assigned — `rep` above stays the display-friendly embed (no id). */
  repId?: string;
  role: AccountRole;
  /** Staff sub-role for the admin Products module's permission matrix — only meaningful when role === "admin". */
  adminRole?: AdminRole;
}

export interface OrderLine {
  /** DB row id — only populated when a line is read back from storage (not on cart lines). */
  id?: string;
  styleId: string;
  colorwayId: string;
  boxTypeId: BoxTypeId;
  /** Number of boxes of this type/colorway. */
  qty: number;
  /** Per-pair wholesale price at the time of order. */
  unitPrice: number;
  /** The style's VAT rate (e.g. 0.24) captured at order time, same principle as
   * unitPrice — a later change to the product's rate must not rewrite the tax
   * on an already-placed order. 0 for every order placed before this field
   * existed (order_lines.vat_rate defaults to 0), so old orders show €0 VAT
   * rather than guessing at a rate that didn't apply when they were placed. */
  vatRate: number;
  /** Resolved once, at order placement, by the atomic stock check in
   * `decrementInventoryForOrder()`. `"stock"` — the full quantity was on hand and has been
   * decremented. `"production"` — it wasn't (including zero on hand); `on_hand` was left
   * untouched (those units aren't coming from this line, so they stay available for a
   * buyer who can be fulfilled from stock) and this line is on order instead, with
   * `productionEta` set. Orders placed before this field existed default to `"stock"`
   * (order_lines.fulfillment defaults to 'stock'), same principle as `vatRate` defaulting
   * to 0 for pre-existing orders. */
  fulfillment: "stock" | "production";
  /** Only set when `fulfillment` is `"production"` — placedAt + the site-wide production
   * lead time at the moment the order was placed, so it doesn't silently shift if that
   * setting changes later. */
  productionEta?: string;
}

export type OrderStatus =
  | "submitted"
  | "confirmed"
  | "in_production"
  | "shipped"
  | "delivered";

export interface Order {
  id: string;
  placedAt: string;
  status: OrderStatus;
  terms: CreditTerms;
  shipToId: string;
  notes?: string;
  lines: OrderLine[];
  invoiceUrl?: string;
  trackingNumber?: string;
  carrier?: string;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  changedAt: string;
}

export type ApplicationStatus = "pending" | "approved" | "active" | "declined";

export interface Application {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  resaleCertId: string;
  businessType: string;
  storeLocation: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  expectedVolume: string;
  website?: string;
  status: ApplicationStatus;
  submittedAt: string;
}

export interface SavedAssortmentLine {
  styleId: string;
  colorwayId?: string;
  boxTypeId?: BoxTypeId;
  qty: number;
}

export interface SavedAssortment {
  id: string;
  name: string;
  createdAt: string;
  /** Unique style ids across `lines` — kept for gallery display call sites. */
  styleIds: string[];
  /** Empty colorway/box on a line means it was saved before line-item storage (migration 0021) — not directly loadable into the cart. */
  lines: SavedAssortmentLine[];
}

export type JournalStatus = "draft" | "published" | "scheduled" | "archived";

export const JOURNAL_CATEGORIES = [
  "Industry Insights",
  "Market Trends",
  "Buyer Guides",
  "Supplier Guides",
  "Procurement Insights",
  "Case Studies",
  "Marketplace Updates",
] as const;

export type JournalCategory = (typeof JOURNAL_CATEGORIES)[number];

export interface JournalPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  featuredImagePath?: string;
  featuredImageUrl?: string;
  authorName: string;
  category: JournalCategory;
  tags: string[];
  featured: boolean;
  status: JournalStatus;
  /** Optional future schedule — stored for reference only, same manual-flip caveat as Style.publishAt. */
  publishAt?: string;
  /** When the post first went live; the public-facing "Publish date". */
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  robots: string;
}
