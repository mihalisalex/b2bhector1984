import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAllStyles, getStyleById, searchStyleIds } from "@/lib/data/styles";
import { getAllBrands } from "@/lib/data/brands";
import { getAllSuppliers } from "@/lib/data/suppliers";
import { getCollectionIdsForStyles, setStyleCollections } from "@/lib/data/collections";
import { getInventoryTotalsForStyles } from "@/lib/data/inventory";
import { listDocumentsForStyle } from "@/lib/data/styleDocuments";
import { getBoxType } from "@/lib/data/boxTypes";
import { toDbId } from "@/lib/data/dbIds";
import type { ProductStatus, Style } from "@/lib/types";

/**
 * Full detail load for the admin product editor — resolves every join the
 * lightweight public `Style` mapper leaves empty (brand name, collections,
 * customer-group prices, relations, documents, attributes). Not used by any
 * public-facing page, so the extra round-trips here don't cost the storefront
 * anything.
 */
export async function getStyleDetailForAdmin(styleId: string): Promise<Style | undefined> {
  const style = await getStyleById(styleId);
  if (!style) return undefined;

  const [brands, collectionIds, customerGroupPrices, relations, documents, attributes] = await Promise.all([
    getAllBrands(),
    getCollectionIdsForStyles([styleId]),
    getCustomerGroupPrices(styleId),
    getStyleRelations(styleId),
    listDocumentsForStyle(styleId),
    getStyleAttributes(styleId),
  ]);

  return {
    ...style,
    brandName: brands.find((b) => b.id === style.brandId)?.name ?? style.brandId,
    collectionIds: collectionIds[styleId] ?? [],
    customerGroupPrices,
    relations: relations.map((r) => ({ id: r.id, relatedStyleId: r.relatedStyleId, relationType: r.relationType as Style["relations"][number]["relationType"], sortOrder: r.sortOrder })),
    documents,
    attributes,
  };
}

export interface ProductRow extends Style {
  brandName: string;
  supplierName?: string;
  onHand: number;
  reserved: number;
  pairsSold: number;
  derivedStatus: ProductStatus | "out_of_stock";
  marginPct: number;
}

export interface ProductListParams {
  q?: string;
  status?: ProductStatus | "out_of_stock" | "all";
  category?: string;
  brandId?: string;
  supplierId?: string;
  inventory?: "in_stock" | "low_stock" | "out_of_stock" | "all";
  sort?: "newest" | "oldest" | "best_selling" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc" | "alphabetical";
  page?: number;
  pageSize?: number;
}

export interface ProductListResult {
  items: ProductRow[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Enriches every style with brand/supplier names, on-hand/reserved totals, and
 * lifetime pairs sold, then filters/sorts/paginates in application code. The
 * catalog is ~16 styles today, so this is correct and fast; the {params in,
 * {items,total} out} shape is what would carry over to real SQL-side
 * filtering/pagination if the catalog ever grows past what fits in memory.
 */
export async function listProductsForAdmin(params: ProductListParams): Promise<ProductListResult> {
  const [styles, brands, suppliers, { data: orderLines }] = await Promise.all([
    getAllStyles(),
    getAllBrands(),
    getAllSuppliers(),
    supabaseAdmin.from("order_lines").select("style_id, box_type_id, qty"),
  ]);

  const styleIds = styles.map((s) => s.id);
  const [inventoryTotals, realCollectionIds] = await Promise.all([
    getInventoryTotalsForStyles(styleIds),
    getCollectionIdsForStyles(styleIds),
  ]);

  const brandNameById = new Map(brands.map((b) => [b.id, b.name]));
  const supplierNameById = new Map(suppliers.map((s) => [s.id, s.name]));

  const pairsSoldByStyle = new Map<string, number>();
  for (const row of orderLines ?? []) {
    const pairs = row.qty * getBoxType(row.box_type_id).totalPairs;
    pairsSoldByStyle.set(row.style_id, (pairsSoldByStyle.get(row.style_id) ?? 0) + pairs);
  }

  let matchedIds: Set<string> | undefined;
  if (params.q?.trim()) {
    matchedIds = await searchStyleIds(params.q.trim());
    const lowerQ = params.q.trim().toLowerCase();
    for (const s of styles) {
      if (s.name.toLowerCase().includes(lowerQ) || s.styleNumber.toLowerCase().includes(lowerQ)) matchedIds.add(s.id);
    }
  }

  let rows: ProductRow[] = styles.map((s) => {
    const inv = inventoryTotals[s.id] ?? { onHand: 0, reserved: 0 };
    const derivedStatus: ProductStatus | "out_of_stock" = s.trackInventory && inv.onHand <= 0 ? "out_of_stock" : s.status;
    const effectivePrice = s.basePrice;
    const marginPct = effectivePrice > 0 ? Math.round(((effectivePrice - s.costPrice) / effectivePrice) * 1000) / 10 : 0;
    return {
      ...s,
      brandName: brandNameById.get(s.brandId) ?? s.brandId,
      supplierName: s.supplierId ? supplierNameById.get(s.supplierId) : undefined,
      collectionIds: realCollectionIds[s.id] ?? [],
      onHand: inv.onHand,
      reserved: inv.reserved,
      pairsSold: pairsSoldByStyle.get(s.id) ?? 0,
      derivedStatus,
      marginPct,
    };
  });

  if (matchedIds) rows = rows.filter((r) => matchedIds!.has(r.id));
  if (params.status && params.status !== "all") rows = rows.filter((r) => r.derivedStatus === params.status);
  if (params.category) rows = rows.filter((r) => r.category === params.category);
  if (params.brandId) rows = rows.filter((r) => r.brandId === params.brandId);
  if (params.supplierId) rows = rows.filter((r) => r.supplierId === params.supplierId);
  if (params.inventory && params.inventory !== "all") {
    rows = rows.filter((r) => {
      if (params.inventory === "out_of_stock") return r.onHand <= 0;
      if (params.inventory === "low_stock") return r.onHand > 0 && r.onHand <= r.lowStockThreshold;
      return r.onHand > r.lowStockThreshold;
    });
  }

  const sort = params.sort ?? "newest";
  rows.sort((a, b) => {
    switch (sort) {
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "best_selling":
        return b.pairsSold - a.pairsSold;
      case "price_asc":
        return a.basePrice - b.basePrice;
      case "price_desc":
        return b.basePrice - a.basePrice;
      case "stock_asc":
        return a.onHand - b.onHand;
      case "stock_desc":
        return b.onHand - a.onHand;
      case "alphabetical":
        return a.name.localeCompare(b.name);
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const total = rows.length;
  const pageSize = params.pageSize ?? 25;
  const page = Math.max(1, params.page ?? 1);
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);

  return { items, total, page, pageSize };
}

// ---------------------------------------------------------------------------
// General tab
// ---------------------------------------------------------------------------

export interface GeneralInput {
  name: string;
  styleNumber: string;
  tagline: string;
  description: string;
  productType: string;
  brandId: string;
  supplierId?: string;
  category: Style["category"];
  season: Style["season"];
  gender: Style["gender"];
  materials: string[];
  tags: string[];
  collectionIds: string[];
  /**
   * ISO timestamp. Drives the catalogue's default "Newest" order, so editing it is how an
   * admin decides which products lead the grid — a later date sorts earlier. Only ever
   * feeds sorting and the admin "Created" column; nothing financial, referential or
   * audit-related reads it. Omitted leaves the stored value untouched.
   */
  createdAt?: string;
}

export async function updateStyleGeneral(styleId: string, input: GeneralInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from("styles")
    .update({
      name: input.name,
      style_number: input.styleNumber,
      tagline: input.tagline,
      description: input.description,
      product_type: input.productType,
      brand_id: input.brandId,
      supplier_id: input.supplierId ?? null,
      category: input.category,
      season: input.season,
      gender: input.gender,
      materials: input.materials,
      tags: input.tags,
      // Spread so an absent value doesn't overwrite the stored timestamp with null.
      ...(input.createdAt ? { created_at: input.createdAt } : {}),
    })
    .eq("id", styleId);
  if (error) throw new Error(`styles: ${error.message}`);
  await setStyleCollections(styleId, input.collectionIds);
}

// ---------------------------------------------------------------------------
// Pricing tab
// ---------------------------------------------------------------------------

export interface PricingInput {
  costPrice: number;
  basePrice: number;
  msrp: number;
  distributorPrice?: number;
  salePrice?: number;
  saleStartAt?: string;
  saleEndAt?: string;
  currency: string;
  taxClass: string;
  vatRate: number;
}

export async function updateStylePricing(styleId: string, input: PricingInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from("styles")
    .update({
      cost_price: input.costPrice,
      base_price: input.basePrice,
      msrp: input.msrp,
      distributor_price: input.distributorPrice ?? null,
      sale_price: input.salePrice ?? null,
      sale_start_at: input.saleStartAt ?? null,
      sale_end_at: input.saleEndAt ?? null,
      currency: input.currency,
      tax_class: input.taxClass,
      vat_rate: input.vatRate,
    })
    .eq("id", styleId);
  if (error) throw new Error(`styles: ${error.message}`);
}

export async function getCustomerGroupPrices(styleId: string): Promise<{ id: string; groupName: string; price: number }[]> {
  const { data, error } = await supabaseAdmin.from("customer_group_prices").select("*").eq("style_id", styleId);
  if (error) {
    console.warn(`customer_group_prices query failed (has migration 0015 been run?): ${error.message}`);
    return [];
  }
  return (data ?? []).map((r) => ({ id: r.id, groupName: r.group_name, price: r.price }));
}

export async function setCustomerGroupPrice(styleId: string, groupName: string, price: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from("customer_group_prices")
    .upsert({ style_id: styleId, group_name: groupName, price }, { onConflict: "style_id,group_name" });
  if (error) throw new Error(`customer_group_prices: ${error.message}`);
}

export async function deleteCustomerGroupPrice(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("customer_group_prices").delete().eq("id", id);
  if (error) throw new Error(`customer_group_prices: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Shipping tab
// ---------------------------------------------------------------------------

export interface ShippingInput {
  weightOz: number;
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

export async function updateStyleShipping(styleId: string, input: ShippingInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from("styles")
    .update({
      weight_oz: input.weightOz,
      length_cm: input.lengthCm ?? null,
      width_cm: input.widthCm ?? null,
      height_cm: input.heightCm ?? null,
      shipping_class: input.shippingClass,
      freight_class: input.freightClass ?? null,
      hazardous: input.hazardous,
      package_length_cm: input.packageLengthCm ?? null,
      package_width_cm: input.packageWidthCm ?? null,
      package_height_cm: input.packageHeightCm ?? null,
    })
    .eq("id", styleId);
  if (error) throw new Error(`styles: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Inventory-meta tab (identifiers + thresholds; on-hand levels live in inventory.ts)
// ---------------------------------------------------------------------------

export interface InventoryMetaInput {
  barcode?: string;
  gtin?: string;
  upc?: string;
  mpn?: string;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  backorderMode: "made_to_order" | "pre_order";
  incomingStock: number;
}

export async function updateStyleInventoryMeta(styleId: string, input: InventoryMetaInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from("styles")
    .update({
      barcode: input.barcode ?? null,
      gtin: input.gtin ?? null,
      upc: input.upc ?? null,
      mpn: input.mpn ?? null,
      low_stock_threshold: input.lowStockThreshold,
      track_inventory: input.trackInventory,
      allow_backorder: input.allowBackorder,
      backorder_mode: input.backorderMode,
      incoming_stock: input.incomingStock,
    })
    .eq("id", styleId);
  if (error) throw new Error(`styles: ${error.message}`);
}

// ---------------------------------------------------------------------------
// SEO tab
// ---------------------------------------------------------------------------

export interface SeoInput {
  seoTitle?: string;
  metaDescription?: string;
  seoKeywords: string[];
  focusKeyword?: string;
  secondaryKeywords: string[];
  canonicalUrl?: string;
  robots: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImageUrl?: string;
  twitterCard: string;
}

export async function updateStyleSeo(styleId: string, input: SeoInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from("styles")
    .update({
      seo_title: input.seoTitle ?? null,
      meta_description: input.metaDescription ?? null,
      seo_keywords: input.seoKeywords,
      focus_keyword: input.focusKeyword ?? null,
      secondary_keywords: input.secondaryKeywords,
      canonical_url: input.canonicalUrl ?? null,
      robots: input.robots,
      og_title: input.ogTitle ?? null,
      og_description: input.ogDescription ?? null,
      og_image_url: input.ogImageUrl ?? null,
      twitter_title: input.twitterTitle ?? null,
      twitter_description: input.twitterDescription ?? null,
      twitter_image_url: input.twitterImageUrl ?? null,
      twitter_card: input.twitterCard,
    })
    .eq("id", styleId);
  if (error) throw new Error(`styles: ${error.message}`);
}

/**
 * Renames a product's URL slug.
 *
 * Returns the previous slug so the caller can record the change and install a
 * redirect. Fails loudly on a collision rather than silently suffixing, which
 * is how this codebase ended up with `hector-boat-loafer-copy-copy` in the
 * first place.
 */
export async function updateStyleSlug(styleId: string, slug: string): Promise<string> {
  const { data: current, error: readError } = await supabaseAdmin
    .from("styles")
    .select("slug")
    .eq("id", styleId)
    .single();
  if (readError) throw new Error(`styles: ${readError.message}`);

  const previous = (current as { slug: string }).slug;
  if (previous === slug) return previous;

  const { error } = await supabaseAdmin.from("styles").update({ slug }).eq("id", styleId);
  if (error) {
    // 23505 = unique_violation on styles.slug.
    if (error.code === "23505") throw new Error(`The slug "${slug}" is already used by another product.`);
    throw new Error(`styles: ${error.message}`);
  }
  return previous;
}

// ---------------------------------------------------------------------------
// Visibility tab
// ---------------------------------------------------------------------------

export async function updateStyleVisibility(
  styleId: string,
  status: ProductStatus,
  featured: boolean,
  publishAt?: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("styles")
    .update({ status, featured, publish_at: publishAt ?? null })
    .eq("id", styleId);
  if (error) throw new Error(`styles: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Attributes tab
// ---------------------------------------------------------------------------

export async function getStyleAttributes(styleId: string): Promise<{ id: string; key: string; value: string; sortOrder: number }[]> {
  const { data, error } = await supabaseAdmin.from("style_attributes").select("*").eq("style_id", styleId).order("sort_order");
  if (error) {
    console.warn(`style_attributes query failed (has migration 0013 been run?): ${error.message}`);
    return [];
  }
  return (data ?? []).map((r) => ({ id: r.id, key: r.key, value: r.value, sortOrder: r.sort_order }));
}

export async function addStyleAttribute(styleId: string, key: string, value: string): Promise<void> {
  const { count } = await supabaseAdmin.from("style_attributes").select("id", { count: "exact", head: true }).eq("style_id", styleId);
  const { error } = await supabaseAdmin.from("style_attributes").insert({ style_id: styleId, key, value, sort_order: count ?? 0 });
  if (error) throw new Error(`style_attributes: ${error.message}`);
}

export async function deleteStyleAttribute(attributeId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("style_attributes").delete().eq("id", attributeId);
  if (error) throw new Error(`style_attributes: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Related products tab
// ---------------------------------------------------------------------------

export async function getStyleRelations(styleId: string): Promise<{ id: string; relatedStyleId: string; relationType: string; sortOrder: number }[]> {
  const { data, error } = await supabaseAdmin.from("style_relations").select("*").eq("style_id", styleId).order("sort_order");
  if (error) {
    console.warn(`style_relations query failed (has migration 0013 been run?): ${error.message}`);
    return [];
  }
  return (data ?? []).map((r) => ({ id: r.id, relatedStyleId: r.related_style_id, relationType: r.relation_type, sortOrder: r.sort_order }));
}

export async function addStyleRelation(styleId: string, relatedStyleId: string, relationType: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("style_relations")
    .upsert({ style_id: styleId, related_style_id: relatedStyleId, relation_type: relationType }, { onConflict: "style_id,related_style_id,relation_type" });
  if (error) throw new Error(`style_relations: ${error.message}`);
}

export async function deleteStyleRelation(relationId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("style_relations").delete().eq("id", relationId);
  if (error) throw new Error(`style_relations: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Variants (colorway) CRUD
// ---------------------------------------------------------------------------

export interface ColorwayInput {
  name: string;
  skuSuffix: string;
  swatch1: string;
  swatch2?: string;
  sku?: string;
  barcode?: string;
  priceOverride?: number;
  costOverride?: number;
  salePriceOverride?: number;
  weightOz?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  status?: "active" | "draft" | "archived";
}

function colorwayFields(input: ColorwayInput) {
  return {
    name: input.name,
    sku_suffix: input.skuSuffix,
    swatch_1: input.swatch1,
    swatch_2: input.swatch2 ?? null,
    sku: input.sku ?? null,
    barcode: input.barcode ?? null,
    price_override: input.priceOverride ?? null,
    cost_override: input.costOverride ?? null,
    sale_price_override: input.salePriceOverride ?? null,
    weight_oz: input.weightOz ?? null,
    length_cm: input.lengthCm ?? null,
    width_cm: input.widthCm ?? null,
    height_cm: input.heightCm ?? null,
    status: input.status ?? "active",
  };
}

export async function addColorway(styleId: string, localId: string, input: ColorwayInput): Promise<void> {
  const { count } = await supabaseAdmin.from("colorways").select("id", { count: "exact", head: true }).eq("style_id", styleId);
  const { error } = await supabaseAdmin.from("colorways").insert({
    id: toDbId(styleId, localId),
    style_id: styleId,
    sort_order: count ?? 0,
    ...colorwayFields(input),
  });
  if (error) throw new Error(`colorways: ${error.message}`);
}

export async function updateColorway(styleId: string, localId: string, input: ColorwayInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from("colorways")
    .update(colorwayFields(input))
    .eq("id", toDbId(styleId, localId));
  if (error) throw new Error(`colorways: ${error.message}`);
}

export async function deleteColorway(styleId: string, localId: string): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from("colorways").delete().eq("id", toDbId(styleId, localId));
  if (error) {
    if (error.message.includes("violates foreign key constraint")) {
      return { error: "This variant has order history and can't be deleted — it's part of a permanent order record." };
    }
    return { error: error.message };
  }
  return {};
}

// ---------------------------------------------------------------------------
// Create / archive / delete product
// ---------------------------------------------------------------------------

export interface CreateStyleInput {
  id: string;
  slug: string;
  styleNumber: string;
  name: string;
  category: Style["category"];
  season: Style["season"];
  gender: Style["gender"];
  availability: Style["availability"];
  tagline: string;
  description: string;
  basePrice: number;
  msrp: number;
  costPrice: number;
}

export async function createStyle(input: CreateStyleInput): Promise<void> {
  const { error } = await supabaseAdmin.from("styles").insert({
    id: input.id,
    slug: input.slug,
    style_number: input.styleNumber,
    name: input.name,
    category: input.category,
    season: input.season,
    gender: input.gender,
    availability: input.availability,
    tagline: input.tagline,
    description: input.description,
    materials: [],
    base_price: input.basePrice,
    msrp: input.msrp,
    cost_price: input.costPrice,
    status: "draft",
  });
  if (error) throw new Error(`styles: ${error.message}`);
}

/** Clones a product's core fields and colorways into a new draft product — a common PIM
 * expectation this module was missing. The clone always lands as `status: "draft"` /
 * unfeatured so it never appears live until the admin reviews and publishes it. */
export async function duplicateStyle(styleId: string): Promise<{ id: string } | { error: string }> {
  const { data: original, error: fetchError } = await supabaseAdmin.from("styles").select("*").eq("id", styleId).single();
  if (fetchError || !original) return { error: "Product not found." };

  const { data: colorwayRows, error: colorwayError } = await supabaseAdmin
    .from("colorways")
    .select("*")
    .eq("style_id", styleId);
  if (colorwayError) return { error: `colorways: ${colorwayError.message}` };

  const newId = `st-${crypto.randomUUID().slice(0, 8)}`;
  let slug = `${original.slug}-copy`;
  let styleNumber = `${original.style_number}-COPY`;
  for (let attempt = 2; attempt <= 20; attempt++) {
    const { count } = await supabaseAdmin
      .from("styles")
      .select("id", { count: "exact", head: true })
      .or(`slug.eq.${slug},style_number.eq.${styleNumber}`);
    if (!count) break;
    slug = `${original.slug}-copy-${attempt}`;
    styleNumber = `${original.style_number}-COPY-${attempt}`;
  }

  const { id: _id, slug: _slug, style_number: _styleNumber, created_at: _createdAt, ...rest } = original;
  void _id;
  void _slug;
  void _styleNumber;
  void _createdAt;

  const { error: insertError } = await supabaseAdmin.from("styles").insert({
    ...rest,
    id: newId,
    slug,
    style_number: styleNumber,
    name: `${original.name} (Copy)`,
    status: "draft",
    featured: false,
    publish_at: null,
  });
  if (insertError) return { error: `styles: ${insertError.message}` };

  if (colorwayRows && colorwayRows.length > 0) {
    const newColorways = colorwayRows.map((c, i) => {
      const { id: _cid, style_id: _sid, ...colorwayRest } = c;
      void _cid;
      void _sid;
      return { ...colorwayRest, id: toDbId(newId, `c${i + 1}`), style_id: newId };
    });
    const { error: colorwayInsertError } = await supabaseAdmin.from("colorways").insert(newColorways);
    if (colorwayInsertError) return { error: `colorways: ${colorwayInsertError.message}` };
  }

  return { id: newId };
}

export async function archiveStyle(styleId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("styles").update({ status: "archived" }).eq("id", styleId);
  if (error) throw new Error(`styles: ${error.message}`);
}

/** Real hard delete — the DB itself blocks this (FK restrict) if the style has order history. */
export async function deleteStyle(styleId: string): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from("styles").delete().eq("id", styleId);
  if (error) {
    if (error.message.includes("violates foreign key constraint")) {
      return { error: "This product has order history and can't be permanently deleted — archive it instead." };
    }
    return { error: error.message };
  }
  return {};
}

/**
 * How many styles still have no Greek tagline or description.
 *
 * The go/no-go figure for the Greek launch, so it is deliberately catalogue-wide and
 * unaffected by whatever filter the admin currently has applied — a number that changes
 * meaning depending on the page you are looking at is not a number you can gate a launch on.
 *
 * Returns 0 rather than throwing if migration 0037 hasn't run: the same graceful-degradation
 * rule every post-0001 read in this app follows. A missing column here must not take down
 * the product list.
 */
export async function countStylesMissingGreekCopy(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("styles")
    .select("id", { count: "exact", head: true })
    .or("tagline_el.is.null,description_el.is.null");
  if (error) return 0;
  return count ?? 0;
}
