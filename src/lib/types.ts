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
}

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
  resaleCertId: string;
  businessType: string;
  storeLocation: string;
  expectedVolume: string;
  appliedAt: string;
  approvedAt?: string;
  shipTo: ShipToAddress[];
  rep: SalesRep;
  role: AccountRole;
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

export interface SavedAssortment {
  id: string;
  name: string;
  createdAt: string;
  styleIds: string[];
}
