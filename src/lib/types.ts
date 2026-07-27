export type Category = "running" | "court" | "trail";

export type Gender = "mens" | "womens" | "unisex";

export type Availability = "available" | "prebook";

export type PricingTierId = "standard" | "preferred" | "vip";

export type AccountStatus = "pending" | "approved" | "active" | "declined";

export type CreditTerms = "prepay" | "net30" | "net60";

export type AccountRole = "buyer" | "admin";

export interface PriceBreak {
  minUnits: number;
  /** Multiplier applied to the style's base (standard-tier) unit price. */
  multiplier: number;
}

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
  gender: Gender;
  availability: Availability;
  shipWindow?: string;
  tagline: string;
  description: string;
  materials: string[];
  colorways: Colorway[];
  basePrice: number;
  msrp: number;
  priceBreaks: PriceBreak[];
  /** Minimum order quantity for this style, in boxes (any mix of box types). */
  moqBoxes: number;
  tierEligibility: PricingTierId[];
  weightOz: number;
  lastNote: string;
  /** Public URL of the admin-uploaded primary product photo, if any. */
  primaryImageUrl?: string;
  /** Which of the 3 fixed box sizes this style is sold in — not every style offers all three. */
  availableBoxTypes: BoxTypeId[];
}

export interface PricingTier {
  id: PricingTierId;
  label: string;
  description: string;
  priceMultiplier: number;
  moqMultiplier: number;
  discountBadge: string;
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
  tier: PricingTierId;
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
