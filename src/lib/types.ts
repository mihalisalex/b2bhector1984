export type Category =
  | "loafers"
  | "wedding"
  | "sneakers"
  | "sandals"
  | "boots"
  | "formal"
  | "anatomic";

export type Season = "summer" | "winter";

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
  season: Season;
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
}

export type OrderStatus =
  | "submitted"
  | "confirmed"
  | "in_production"
  | "shipped"
  | "delivered";

export interface Order {
  id: string;
  poNumber: string;
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
