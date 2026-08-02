"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { logAudit } from "@/lib/data/auditLog";
import { hasPermission } from "@/lib/data/permissions";
import { sanitizeProductDescription } from "@/lib/sanitizeHtml";
import {
  updateStyleGeneral,
  updateStylePricing,
  updateStyleInventoryMeta,
  updateStyleSeo,
  updateStyleShipping,
  updateStyleVisibility,
  setCustomerGroupPrice,
  deleteCustomerGroupPrice,
  addStyleAttribute,
  deleteStyleAttribute,
  addStyleRelation,
  deleteStyleRelation,
  addColorway,
  updateColorway,
  deleteColorway,
  createStyle,
  duplicateStyle,
  archiveStyle,
  deleteStyle,
  listProductsForAdmin,
  updateStyleSlug,
  type GeneralInput,
  type PricingInput,
  type InventoryMetaInput,
  type SeoInput,
  type ShippingInput,
} from "@/lib/data/productAdmin";
import { recordSlugChange } from "@/lib/data/seoRedirects";
import { revalidateSeoSurfaces } from "@/lib/seoRevalidate";
import { slugifyForSeo } from "@/lib/seoAutogen";
import { setInventoryLevel, setReservedStock } from "@/lib/data/inventory";
import {
  createStyleImageUploadTarget,
  finalizeStyleImageUpload,
  setPrimaryImage,
  deleteStyleImage,
  updateImageAltText,
  updateImageColorway,
  reorderStyleImages,
} from "@/lib/data/styleImages";
import {
  createStyleDocumentUploadTarget,
  finalizeStyleDocumentUpload,
  deleteStyleDocument,
} from "@/lib/data/styleDocuments";
import { createBrand } from "@/lib/data/brands";
import { createSupplier, updateSupplier, deleteSupplier, type SupplierInput } from "@/lib/data/suppliers";
import { createCollection } from "@/lib/data/collections";
import { createWarehouse } from "@/lib/data/warehouses";
import { setPermission } from "@/lib/data/permissions";
import { importProductRows, validateImportRows, type ImportRow, type ImportRowPreview, type ImportRowResult } from "@/lib/data/productImport";
import type { FormState } from "@/lib/actions";
import type { AdminRole, BoxTypeId, DocumentKind, ProductPermissionKey, ProductStatus, RelationType } from "@/lib/types";

async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") redirect("/login");
  return account;
}

async function requirePermission(key: ProductPermissionKey) {
  const admin = await requireAdmin();
  const allowed = await hasPermission(admin.adminRole, key);
  if (!allowed) throw new Error(`Your role (${admin.adminRole ?? "admin"}) doesn't have the "${key}" permission.`);
  return admin;
}

function revalidateProduct(styleId: string) {
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${styleId}`);
  revalidatePath("/catalogue");
  revalidatePath("/quick-order");
  revalidatePath("/product/[slug]", "page");
}

/**
 * Every mutation in this file writes to columns/tables added by migrations
 * 0013-0017. Until an admin runs them in the Supabase SQL Editor, Postgres/
 * PostgREST reports a missing-column/table error — turned into one clear,
 * consistent message here instead of an uncaught 500, matching this app's
 * existing pattern of degrading gracefully pre-migration (see auditLog.ts,
 * styles.ts's fetchStyles fallbacks).
 */
function isMissingSchemaError(message: string): boolean {
  return message.includes("schema cache") || message.includes("does not exist") || message.includes("Could not find");
}

function friendlyDbError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (isMissingSchemaError(message)) {
    return "Can't save this yet — the Product Management schema migrations (supabase/migrations/0013-0017) haven't been run against this database. Run them in the Supabase SQL Editor, then try again.";
  }
  if (message.includes("duplicate key value") && message.includes("style_number")) {
    return "That style number is already used by another product — style numbers must be unique.";
  }
  if (message.includes("duplicate key value") && message.includes("slug")) {
    return "That URL slug is already used by another product — try a more specific one.";
  }
  return message;
}

/** For FormState-returning actions: runs `fn`, converting any thrown error into a friendly FormState error. */
async function runOrError(fn: () => Promise<void>): Promise<FormState | undefined> {
  try {
    await fn();
    return undefined;
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
}

/** For void actions (no useActionState wiring) — best-effort, logs and swallows so a bad click can't crash the page. */
async function runBestEffort(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error(`${label} failed: ${friendlyDbError(err)}`);
  }
}

// ---------------------------------------------------------------------------
// General
// ---------------------------------------------------------------------------

/**
 * `<input type="datetime-local">` posts "YYYY-MM-DDTHH:mm" with no timezone. This reads
 * it as UTC (hence the appended "Z") to match how `GeneralTab` fills the field — it
 * slices the stored ISO string, which is already UTC. Interpreting it as server-local
 * instead would shift the value by the host's offset on every save, and formatting it
 * back as local would differ between the server render and the browser, which is a
 * hydration mismatch on a field measured in minutes.
 *
 * Returns undefined for blank or unparseable input so the stored timestamp is left
 * alone rather than clobbered with an Invalid Date.
 */
function parseCreatedAt(raw: FormDataEntryValue | null): string | undefined {
  const value = String(raw ?? "").trim();
  if (!value) return undefined;
  const parsed = new Date(/[Zz]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export async function updateGeneralAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.edit");
  const input: GeneralInput = {
    name: String(formData.get("name") ?? "").trim(),
    styleNumber: String(formData.get("styleNumber") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    description: sanitizeProductDescription(String(formData.get("description") ?? "")),
    productType: String(formData.get("productType") ?? "Footwear").trim(),
    brandId: String(formData.get("brandId") ?? "hector-1984"),
    supplierId: String(formData.get("supplierId") ?? "").trim() || undefined,
    category: String(formData.get("category") ?? "") as GeneralInput["category"],
    season: String(formData.get("season") ?? "") as GeneralInput["season"],
    gender: String(formData.get("gender") ?? "") as GeneralInput["gender"],
    materials: String(formData.get("materials") ?? "").split(",").map((m) => m.trim()).filter(Boolean),
    tags: String(formData.get("tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean),
    collectionIds: formData.getAll("collectionIds").map(String),
    createdAt: parseCreatedAt(formData.get("createdAt")),
  };
  if (!input.name) return { error: "Product name is required." };
  if (!input.styleNumber) return { error: "Style number is required." };
  if (formData.get("createdAt") && !input.createdAt) {
    return { error: "Catalogue date isn't a valid date and time." };
  }
  const failure = await runOrError(() => updateStyleGeneral(styleId, input));
  if (failure) return failure;
  await logAudit(admin.id, "product.updated", "style", styleId, "general");
  revalidateProduct(styleId);
  return { success: "General details saved." };
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export async function updatePricingAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.pricing");
  const num = (key: string, fallback = 0) => {
    const v = Number(formData.get(key));
    return Number.isFinite(v) ? v : fallback;
  };
  const input: PricingInput = {
    costPrice: num("costPrice"),
    basePrice: num("basePrice"),
    msrp: num("msrp"),
    distributorPrice: formData.get("distributorPrice") ? num("distributorPrice") : undefined,
    salePrice: formData.get("salePrice") ? num("salePrice") : undefined,
    saleStartAt: String(formData.get("saleStartAt") ?? "").trim() || undefined,
    saleEndAt: String(formData.get("saleEndAt") ?? "").trim() || undefined,
    currency: String(formData.get("currency") ?? "EUR"),
    taxClass: String(formData.get("taxClass") ?? "standard"),
    vatRate: num("vatRate", 0.24),
  };
  if (input.basePrice <= 0) return { error: "Wholesale price must be greater than zero." };
  const failure = await runOrError(() => updateStylePricing(styleId, input));
  if (failure) return failure;
  await logAudit(admin.id, "product.price_changed", "style", styleId, `base=${input.basePrice} cost=${input.costPrice} sale=${input.salePrice ?? "none"}`);
  revalidateProduct(styleId);
  return { success: "Pricing saved." };
}

export async function addCustomerGroupPriceAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.pricing");
  const groupName = String(formData.get("groupName") ?? "").trim();
  const price = Number(formData.get("price"));
  if (!groupName || !Number.isFinite(price)) return { error: "Group name and a valid price are required." };
  const failure = await runOrError(() => setCustomerGroupPrice(styleId, groupName, price));
  if (failure) return failure;
  await logAudit(admin.id, "product.price_changed", "style", styleId, `group ${groupName} -> ${price}`);
  revalidateProduct(styleId);
  return { success: "Group price added." };
}

export async function deleteCustomerGroupPriceAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.pricing");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing group price." };
  const failure = await runOrError(() => deleteCustomerGroupPrice(id));
  if (failure) return failure;
  await logAudit(admin.id, "product.price_changed", "style", styleId, "removed group price");
  revalidateProduct(styleId);
  return { success: "Group price removed." };
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export async function updateInventoryMetaAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.inventory");
  const input: InventoryMetaInput = {
    barcode: String(formData.get("barcode") ?? "").trim() || undefined,
    gtin: String(formData.get("gtin") ?? "").trim() || undefined,
    upc: String(formData.get("upc") ?? "").trim() || undefined,
    mpn: String(formData.get("mpn") ?? "").trim() || undefined,
    lowStockThreshold: Number(formData.get("lowStockThreshold")) || 0,
    trackInventory: formData.get("trackInventory") === "on",
    allowBackorder: formData.get("allowBackorder") === "on",
    incomingStock: Number(formData.get("incomingStock")) || 0,
  };
  const failure = await runOrError(() => updateStyleInventoryMeta(styleId, input));
  if (failure) return failure;
  await logAudit(admin.id, "product.inventory_changed", "style", styleId, "identifiers/thresholds");
  revalidateProduct(styleId);
  return { success: "Inventory settings saved." };
}

/** Bound to `.bind(null, styleId)` — per colorway/box-type/warehouse stock cell. */
export async function updateProductInventoryLevelAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.inventory");
  const colorwayId = String(formData.get("colorwayId") ?? "");
  const boxTypeId = String(formData.get("boxTypeId") ?? "") as BoxTypeId;
  const warehouseId = String(formData.get("warehouseId") ?? "main");
  const onHand = Number(formData.get("onHand") ?? 0);
  if (!colorwayId || !boxTypeId || !Number.isFinite(onHand)) return { error: "Invalid stock value." };
  const failure = await runOrError(() => setInventoryLevel(styleId, colorwayId, boxTypeId, Math.round(onHand), warehouseId, admin.id));
  if (failure) return failure;
  await logAudit(admin.id, "product.inventory_changed", "style", styleId, `${colorwayId}/${boxTypeId}@${warehouseId} -> ${Math.round(onHand)}`);
  revalidateProduct(styleId);
  return { success: "Stock updated." };
}

export async function updateReservedStockAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.inventory");
  const colorwayId = String(formData.get("colorwayId") ?? "");
  const boxTypeId = String(formData.get("boxTypeId") ?? "") as BoxTypeId;
  const warehouseId = String(formData.get("warehouseId") ?? "main");
  const reserved = Number(formData.get("reserved") ?? 0);
  if (!colorwayId || !boxTypeId || !Number.isFinite(reserved)) return { error: "Invalid reserved value." };
  const failure = await runOrError(() => setReservedStock(styleId, colorwayId, boxTypeId, Math.round(reserved), warehouseId));
  if (failure) return failure;
  await logAudit(admin.id, "product.inventory_changed", "style", styleId, `reserved ${colorwayId}/${boxTypeId} -> ${Math.round(reserved)}`);
  revalidateProduct(styleId);
  return { success: "Reserved stock updated." };
}

export async function createWarehouseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("products.inventory");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Warehouse name is required." };
  const failure = await runOrError(() => createWarehouse(name, String(formData.get("location") ?? "").trim() || undefined).then(() => undefined));
  if (failure) return failure;
  revalidatePath("/admin/products");
  return { success: "Warehouse added." };
}

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

export async function updateSeoAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.seo");
  const csv = (key: string) =>
    String(formData.get(key) ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

  const input: SeoInput = {
    seoTitle: String(formData.get("seoTitle") ?? "").trim() || undefined,
    metaDescription: String(formData.get("metaDescription") ?? "").trim() || undefined,
    seoKeywords: csv("seoKeywords"),
    focusKeyword: String(formData.get("focusKeyword") ?? "").trim() || undefined,
    secondaryKeywords: csv("secondaryKeywords"),
    canonicalUrl: String(formData.get("canonicalUrl") ?? "").trim() || undefined,
    robots: String(formData.get("robots") ?? "index,follow"),
    ogTitle: String(formData.get("ogTitle") ?? "").trim() || undefined,
    ogDescription: String(formData.get("ogDescription") ?? "").trim() || undefined,
    ogImageUrl: String(formData.get("ogImageUrl") ?? "").trim() || undefined,
    twitterTitle: String(formData.get("twitterTitle") ?? "").trim() || undefined,
    twitterDescription: String(formData.get("twitterDescription") ?? "").trim() || undefined,
    twitterImageUrl: String(formData.get("twitterImageUrl") ?? "").trim() || undefined,
    twitterCard: String(formData.get("twitterCard") ?? "summary_large_image"),
  };

  const failure = await runOrError(() => updateStyleSeo(styleId, input));
  if (failure) return failure;

  // The slug is saved on the same form but through a separate path, because a
  // rename has side effects (history + an automatic 301) that the plain field
  // write does not. Done after the SEO write so a slug collision can't discard
  // the rest of the admin's edits.
  const requestedSlug = slugifyForSeo(String(formData.get("slug") ?? ""));
  let slugNote = "";
  if (requestedSlug) {
    try {
      const previous = await updateStyleSlug(styleId, requestedSlug);
      if (previous !== requestedSlug) {
        await recordSlugChange(styleId, previous, requestedSlug);
        await logAudit(admin.id, "product.slug_changed", "style", styleId, `${previous} → ${requestedSlug}`);
        slugNote = ` URL changed to /product/${requestedSlug} — a 301 from the old URL was created automatically.`;
        revalidateSeoSurfaces();
      }
    } catch (err) {
      return { error: friendlyDbError(err) };
    }
  }

  await logAudit(admin.id, "product.seo_changed", "style", styleId);
  revalidateProduct(styleId);
  return { success: `SEO saved.${slugNote}` };
}

// ---------------------------------------------------------------------------
// Shipping
// ---------------------------------------------------------------------------

export async function updateShippingAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.edit");
  const num = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim();
    if (!raw) return undefined;
    const v = Number(raw);
    return Number.isFinite(v) ? v : undefined;
  };
  const input: ShippingInput = {
    weightOz: num("weightOz") ?? 0,
    lengthCm: num("lengthCm"),
    widthCm: num("widthCm"),
    heightCm: num("heightCm"),
    shippingClass: String(formData.get("shippingClass") ?? "standard"),
    freightClass: String(formData.get("freightClass") ?? "").trim() || undefined,
    hazardous: formData.get("hazardous") === "on",
    packageLengthCm: num("packageLengthCm"),
    packageWidthCm: num("packageWidthCm"),
    packageHeightCm: num("packageHeightCm"),
  };
  const failure = await runOrError(() => updateStyleShipping(styleId, input));
  if (failure) return failure;
  await logAudit(admin.id, "product.updated", "style", styleId, "shipping");
  revalidateProduct(styleId);
  return { success: "Shipping details saved." };
}

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------

export async function updateVisibilityAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.edit");
  const status = String(formData.get("status") ?? "active") as ProductStatus;
  const featured = formData.get("featured") === "on";
  const publishAt = String(formData.get("publishAt") ?? "").trim() || undefined;
  const failure = await runOrError(() => updateStyleVisibility(styleId, status, featured, publishAt));
  if (failure) return failure;
  await logAudit(admin.id, "product.updated", "style", styleId, `status -> ${status}${featured ? " (featured)" : ""}`);
  revalidateProduct(styleId);
  return { success: "Visibility saved." };
}

// ---------------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------------

export async function addStyleAttributeAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.edit");
  const key = String(formData.get("key") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  if (!key || !value) return { error: "Both attribute and value are required." };
  const failure = await runOrError(() => addStyleAttribute(styleId, key, value));
  if (failure) return failure;
  await logAudit(admin.id, "product.updated", "style", styleId, `attribute ${key}`);
  revalidateProduct(styleId);
  return { success: "Attribute added." };
}

export async function deleteStyleAttributeAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.edit");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing attribute." };
  const failure = await runOrError(() => deleteStyleAttribute(id));
  if (failure) return failure;
  await logAudit(admin.id, "product.updated", "style", styleId, "removed attribute");
  revalidateProduct(styleId);
  return { success: "Attribute removed." };
}

// ---------------------------------------------------------------------------
// Related products
// ---------------------------------------------------------------------------

export async function addStyleRelationAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.edit");
  const relatedStyleId = String(formData.get("relatedStyleId") ?? "");
  const relationType = String(formData.get("relationType") ?? "related") as RelationType;
  if (!relatedStyleId || relatedStyleId === styleId) return { error: "Choose a different product to relate." };
  const failure = await runOrError(() => addStyleRelation(styleId, relatedStyleId, relationType));
  if (failure) return failure;
  await logAudit(admin.id, "product.updated", "style", styleId, `related -> ${relatedStyleId} (${relationType})`);
  revalidateProduct(styleId);
  return { success: "Related product added." };
}

export async function deleteStyleRelationAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.edit");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing relation." };
  const failure = await runOrError(() => deleteStyleRelation(id));
  if (failure) return failure;
  await logAudit(admin.id, "product.updated", "style", styleId, "removed relation");
  revalidateProduct(styleId);
  return { success: "Relation removed." };
}

// ---------------------------------------------------------------------------
// Variants (colorways)
// ---------------------------------------------------------------------------

function colorwayInputFromForm(formData: FormData): Parameters<typeof addColorway>[2] {
  const num = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim();
    if (!raw) return undefined;
    const v = Number(raw);
    return Number.isFinite(v) ? v : undefined;
  };
  return {
    name: String(formData.get("name") ?? "").trim(),
    skuSuffix: String(formData.get("skuSuffix") ?? "").trim(),
    swatch1: String(formData.get("swatch1") ?? "#121212"),
    swatch2: String(formData.get("swatch2") ?? "").trim() || undefined,
    sku: String(formData.get("sku") ?? "").trim() || undefined,
    barcode: String(formData.get("barcode") ?? "").trim() || undefined,
    priceOverride: num("priceOverride"),
    costOverride: num("costOverride"),
    salePriceOverride: num("salePriceOverride"),
    weightOz: num("weightOz"),
    lengthCm: num("lengthCm"),
    widthCm: num("widthCm"),
    heightCm: num("heightCm"),
    status: (String(formData.get("status") ?? "active") as "active" | "draft" | "archived"),
  };
}

export async function addColorwayAction(styleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.edit");
  const input = colorwayInputFromForm(formData);
  const localId = `c${Date.now().toString(36)}`;
  if (!input.name) return { error: "Colorway name is required." };
  const localIdSnapshot = localId;
  const failure = await runOrError(() => addColorway(styleId, localIdSnapshot, input));
  if (failure) return failure;
  await logAudit(admin.id, "product.variant_modified", "style", styleId, `added variant ${input.name}`);
  revalidateProduct(styleId);
  return { success: "Variant added." };
}

export async function updateColorwayAction(styleId: string, colorwayLocalId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.edit");
  const failure = await runOrError(() => updateColorway(styleId, colorwayLocalId, colorwayInputFromForm(formData)));
  if (failure) return failure;
  await logAudit(admin.id, "product.variant_modified", "style", styleId, `edited variant ${colorwayLocalId}`);
  revalidateProduct(styleId);
  return { success: "Variant saved." };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by useActionState
export async function deleteColorwayAction(styleId: string, colorwayLocalId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.edit");
  let result: { error?: string };
  try {
    result = await deleteColorway(styleId, colorwayLocalId);
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  if (result.error) return { error: result.error };
  await logAudit(admin.id, "product.variant_modified", "style", styleId, `removed variant ${colorwayLocalId}`);
  revalidateProduct(styleId);
  return { success: "Variant removed." };
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export type UploadTarget = { bucket: string; path: string; token: string } | { error: string };
export interface UploadState { error?: string }

export async function createProductImageUploadUrlAction(styleId: string, fileName: string): Promise<UploadTarget> {
  await requirePermission("products.edit");
  try {
    return await createStyleImageUploadTarget(styleId, fileName);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not start upload." };
  }
}

export async function finalizeProductImageUploadAction(styleId: string, path: string): Promise<UploadState> {
  const admin = await requirePermission("products.edit");
  try {
    await finalizeStyleImageUpload(styleId, path);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }
  await logAudit(admin.id, "product.images_added", "style", styleId);
  revalidateProduct(styleId);
  return {};
}

export async function setPrimaryProductImageAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("products.edit");
  const styleId = String(formData.get("styleId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  if (!styleId || !imageId) return { error: "Missing image." };
  const failure = await runOrError(() => setPrimaryImage(styleId, imageId));
  if (failure) return failure;
  revalidateProduct(styleId);
  return { success: "Featured photo updated." };
}

export async function updateImageAltTextAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("products.edit");
  const styleId = String(formData.get("styleId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  const altText = String(formData.get("altText") ?? "");
  if (!imageId) return { error: "Missing image." };
  const failure = await runOrError(() => updateImageAltText(imageId, altText));
  if (failure) return failure;
  revalidateProduct(styleId);
  return { success: "Alt text saved." };
}

export async function updateImageColorwayAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("products.edit");
  const styleId = String(formData.get("styleId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  const colorwayId = String(formData.get("colorwayId") ?? "").trim();
  if (!imageId) return { error: "Missing image." };
  const failure = await runOrError(() => updateImageColorway(styleId, imageId, colorwayId || null));
  if (failure) return failure;
  revalidateProduct(styleId);
  return { success: "Colorway saved." };
}

export async function reorderProductImagesAction(styleId: string, orderedImageIds: string[]) {
  await requirePermission("products.edit");
  await runBestEffort("reorderProductImagesAction", () => reorderStyleImages(styleId, orderedImageIds));
  revalidateProduct(styleId);
}

export async function deleteProductImageAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.edit");
  const styleId = String(formData.get("styleId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  if (!imageId) return { error: "Missing image." };
  const failure = await runOrError(() => deleteStyleImage(imageId));
  if (failure) return failure;
  await logAudit(admin.id, "product.updated", "style", styleId, "removed image");
  revalidateProduct(styleId);
  return { success: "Photo removed." };
}

// ---------------------------------------------------------------------------
// Documents (manuals, datasheets, certificates, video, 360°, ...)
// ---------------------------------------------------------------------------

export async function createDocumentUploadUrlAction(styleId: string, fileName: string): Promise<UploadTarget> {
  await requirePermission("products.edit");
  try {
    return await createStyleDocumentUploadTarget(styleId, fileName);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not start upload." };
  }
}

export async function finalizeDocumentUploadAction(
  styleId: string,
  path: string,
  kind: DocumentKind,
  label: string,
): Promise<UploadState> {
  const admin = await requirePermission("products.edit");
  try {
    await finalizeStyleDocumentUpload(styleId, path, kind, label);
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  await logAudit(admin.id, "product.updated", "style", styleId, `document added (${kind})`);
  revalidateProduct(styleId);
  return {};
}

export async function deleteDocumentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.edit");
  const styleId = String(formData.get("styleId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  if (!documentId) return { error: "Missing document." };
  const failure = await runOrError(() => deleteStyleDocument(documentId));
  if (failure) return failure;
  await logAudit(admin.id, "product.updated", "style", styleId, "removed document");
  revalidateProduct(styleId);
  return { success: "Document removed." };
}

// ---------------------------------------------------------------------------
// Create / archive / delete
// ---------------------------------------------------------------------------

export async function createProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("products.create");
  const name = String(formData.get("name") ?? "").trim();
  const styleNumber = String(formData.get("styleNumber") ?? "").trim();
  const basePrice = Number(formData.get("basePrice"));
  if (!name || !styleNumber) return { error: "Name and style number are required." };
  if (!Number.isFinite(basePrice) || basePrice <= 0) return { error: "Wholesale price must be greater than zero." };

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const id = `st-${crypto.randomUUID().slice(0, 8)}`;
  try {
    await createStyle({
      id,
      slug,
      styleNumber,
      name,
      category: String(formData.get("category") ?? "loafers") as GeneralInput["category"],
      season: String(formData.get("season") ?? "summer") as GeneralInput["season"],
      gender: String(formData.get("gender") ?? "unisex") as GeneralInput["gender"],
      availability: "available",
      tagline: String(formData.get("tagline") ?? "").trim(),
      // Sanitized here, exactly as in `updateGeneralAction` — the product page renders
      // this field with `dangerouslySetInnerHTML`, and a Server Action accepts arbitrary
      // FormData regardless of what the form UI renders, so the write path is the only
      // place the tag allowlist can actually be enforced.
      description: sanitizeProductDescription(String(formData.get("description") ?? "").trim()),
      basePrice,
      msrp: Number(formData.get("msrp")) || basePrice * 2,
      costPrice: Number(formData.get("costPrice")) || 0,
    });
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  await logAudit(admin.id, "product.created", "style", id, name);
  revalidatePath("/admin/products");
  redirect(`/admin/products/${id}`);
}

export async function duplicateProductAction(styleId: string): Promise<{ id?: string; error?: string }> {
  const admin = await requirePermission("products.create");
  let result: { id: string } | { error: string };
  try {
    result = await duplicateStyle(styleId);
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  if ("error" in result) return { error: result.error };
  await logAudit(admin.id, "product.created", "style", result.id, `duplicated from ${styleId}`);
  revalidatePath("/admin/products");
  return { id: result.id };
}

export async function archiveProductAction(styleId: string) {
  const admin = await requirePermission("products.delete");
  await runBestEffort("archiveProductAction", () => archiveStyle(styleId));
  await logAudit(admin.id, "product.updated", "style", styleId, "archived");
  revalidateProduct(styleId);
}

export async function deleteProductAction(styleId: string): Promise<FormState> {
  const admin = await requirePermission("products.delete");
  let result: { error?: string };
  try {
    result = await deleteStyle(styleId);
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  if (result.error) return { error: result.error };
  await logAudit(admin.id, "product.deleted", "style", styleId);
  revalidatePath("/admin/products");
  return { success: "Product deleted." };
}

// ---------------------------------------------------------------------------
// Bulk actions
// ---------------------------------------------------------------------------

export async function bulkUpdateStatusAction(styleIds: string[], status: ProductStatus): Promise<FormState> {
  const admin = await requirePermission("products.bulk");
  try {
    for (const styleId of styleIds) {
      await updateStyleVisibility(styleId, status, false);
      await logAudit(admin.id, "product.updated", "style", styleId, `bulk status -> ${status}`);
    }
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  revalidatePath("/admin/products");
  return { success: `Updated ${styleIds.length} products to ${status}.` };
}

export async function bulkArchiveAction(styleIds: string[]): Promise<FormState> {
  const admin = await requirePermission("products.bulk");
  try {
    for (const styleId of styleIds) {
      await archiveStyle(styleId);
      await logAudit(admin.id, "product.updated", "style", styleId, "bulk archived");
    }
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  revalidatePath("/admin/products");
  return { success: `Archived ${styleIds.length} products.` };
}

/**
 * `deleteStyle` returns a per-item `{ error }` (e.g. "has order history") rather than
 * throwing, so a bulk delete has to keep going and report a partial result instead of
 * aborting the whole batch on the first failure.
 */
export async function bulkDeleteAction(styleIds: string[]): Promise<FormState> {
  const admin = await requirePermission("products.bulk");
  let deleted = 0;
  let firstError: string | undefined;
  for (const styleId of styleIds) {
    try {
      const result = await deleteStyle(styleId);
      if (result.error) {
        firstError ??= result.error;
        continue;
      }
      await logAudit(admin.id, "product.deleted", "style", styleId);
      deleted++;
    } catch (err) {
      firstError ??= friendlyDbError(err);
    }
  }
  revalidatePath("/admin/products");
  if (deleted === 0) return { error: firstError ?? "Nothing was deleted." };
  if (firstError) return { error: `Deleted ${deleted} of ${styleIds.length} — ${firstError}` };
  return { success: `Deleted ${deleted} product${deleted === 1 ? "" : "s"}.` };
}

export async function bulkAdjustPriceAction(styleIds: string[], mode: "set" | "increase_pct" | "decrease_pct", value: number): Promise<FormState> {
  const admin = await requirePermission("products.bulk");
  const rows = (await listProductsForAdmin({ pageSize: 100000 })).items.filter((r) => styleIds.includes(r.id));
  try {
    for (const row of rows) {
      const nextPrice = mode === "set" ? value : mode === "increase_pct" ? row.basePrice * (1 + value / 100) : row.basePrice * (1 - value / 100);
      await updateStylePricing(row.id, {
        costPrice: row.costPrice,
        basePrice: Math.max(0.01, Math.round(nextPrice * 100) / 100),
        msrp: row.msrp,
        distributorPrice: row.distributorPrice,
        salePrice: row.salePrice,
        saleStartAt: row.saleStartAt,
        saleEndAt: row.saleEndAt,
        currency: row.currency,
        taxClass: row.taxClass,
        vatRate: row.vatRate,
      });
      await logAudit(admin.id, "product.price_changed", "style", row.id, `bulk ${mode} ${value}`);
    }
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  revalidatePath("/admin/products");
  return { success: `Updated pricing for ${rows.length} products.` };
}

export async function bulkSetBrandAction(styleIds: string[], brandId: string): Promise<FormState> {
  const admin = await requirePermission("products.bulk");
  const rows = (await listProductsForAdmin({ pageSize: 100000 })).items.filter((r) => styleIds.includes(r.id));
  try {
    for (const row of rows) {
      await updateStyleGeneral(row.id, {
        name: row.name,
        styleNumber: row.styleNumber,
        tagline: row.tagline,
        description: row.description,
        productType: row.productType,
        brandId,
        supplierId: row.supplierId,
        category: row.category,
        season: row.season,
        gender: row.gender,
        materials: row.materials,
        tags: row.tags,
        collectionIds: row.collectionIds,
      });
      await logAudit(admin.id, "product.updated", "style", row.id, `bulk brand -> ${brandId}`);
    }
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  revalidatePath("/admin/products");
  return { success: `Updated brand for ${rows.length} products.` };
}

export async function bulkSetSupplierAction(styleIds: string[], supplierId: string): Promise<FormState> {
  const admin = await requirePermission("products.bulk");
  const rows = (await listProductsForAdmin({ pageSize: 100000 })).items.filter((r) => styleIds.includes(r.id));
  try {
    for (const row of rows) {
      await updateStyleGeneral(row.id, {
        name: row.name,
        styleNumber: row.styleNumber,
        tagline: row.tagline,
        description: row.description,
        productType: row.productType,
        brandId: row.brandId,
        supplierId: supplierId || undefined,
        category: row.category,
        season: row.season,
        gender: row.gender,
        materials: row.materials,
        tags: row.tags,
        collectionIds: row.collectionIds,
      });
      await logAudit(admin.id, "product.updated", "style", row.id, `bulk supplier -> ${supplierId}`);
    }
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  revalidatePath("/admin/products");
  return { success: `Updated supplier for ${rows.length} products.` };
}

export async function bulkAddTagAction(styleIds: string[], tag: string): Promise<FormState> {
  const admin = await requirePermission("products.bulk");
  const trimmed = tag.trim();
  if (!trimmed) return { error: "Tag can't be empty." };
  const rows = (await listProductsForAdmin({ pageSize: 100000 })).items.filter((r) => styleIds.includes(r.id));
  try {
    for (const row of rows) {
      const tags = Array.from(new Set([...row.tags, trimmed]));
      await updateStyleGeneral(row.id, {
        name: row.name,
        styleNumber: row.styleNumber,
        tagline: row.tagline,
        description: row.description,
        productType: row.productType,
        brandId: row.brandId,
        supplierId: row.supplierId,
        category: row.category,
        season: row.season,
        gender: row.gender,
        materials: row.materials,
        tags,
        collectionIds: row.collectionIds,
      });
      await logAudit(admin.id, "product.updated", "style", row.id, `bulk tag +${trimmed}`);
    }
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  revalidatePath("/admin/products");
  return { success: `Added tag to ${rows.length} products.` };
}

// ---------------------------------------------------------------------------
// Reference data (brand/supplier/collection quick-create)
// ---------------------------------------------------------------------------

export async function createBrandAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("products.edit");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Brand name is required." };
  try {
    await createBrand(name);
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  revalidatePath("/admin/products");
  return { success: "Brand added." };
}

export async function createSupplierAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("products.edit");
  const input: SupplierInput = {
    name: String(formData.get("name") ?? "").trim(),
    contactName: String(formData.get("contactName") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    leadTimeDays: formData.get("leadTimeDays") ? Number(formData.get("leadTimeDays")) : undefined,
  };
  if (!input.name) return { error: "Supplier name is required." };
  try {
    await createSupplier(input);
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  revalidatePath("/admin/products");
  revalidatePath("/admin/suppliers");
  return { success: "Supplier added." };
}

export async function updateSupplierAction(supplierId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("products.edit");
  const input: SupplierInput = {
    name: String(formData.get("name") ?? "").trim(),
    contactName: String(formData.get("contactName") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    leadTimeDays: formData.get("leadTimeDays") ? Number(formData.get("leadTimeDays")) : undefined,
  };
  if (!input.name) return { error: "Supplier name is required." };
  try {
    await updateSupplier(supplierId, input);
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  revalidatePath("/admin/suppliers");
  return { success: "Supplier saved." };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by useActionState
export async function deleteSupplierAction(supplierId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  await requirePermission("products.edit");
  let result: { error?: string };
  try {
    result = await deleteSupplier(supplierId);
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  if (result.error) return { error: result.error };
  revalidatePath("/admin/suppliers");
  return { success: "Supplier removed." };
}

export async function createCollectionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("products.edit");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Collection name is required." };
  try {
    await createCollection(name);
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  revalidatePath("/admin/products");
  return { success: "Collection added." };
}

// ---------------------------------------------------------------------------
// Import / export
// ---------------------------------------------------------------------------

export async function validateImportRowsAction(rows: ImportRow[]): Promise<ImportRowPreview[]> {
  await requirePermission("products.import_export");
  return validateImportRows(rows);
}

export async function importProductRowsAction(rows: ImportRow[]): Promise<ImportRowResult[]> {
  const admin = await requirePermission("products.import_export");
  const results = await importProductRows(rows);
  const created = results.filter((r) => r.action === "created").length;
  const updated = results.filter((r) => r.action === "updated").length;
  await logAudit(admin.id, "product.created", "style", "bulk-import", `imported ${created} created, ${updated} updated, ${rows.length - created - updated} failed`);
  revalidatePath("/admin/products");
  return results;
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export async function setPermissionAction(role: AdminRole, permissionKey: ProductPermissionKey, formData: FormData) {
  const admin = await requirePermission("products.permissions");
  const allowed = formData.get("allowed") === "true";
  // Refuse to let a non-super_admin revoke products.permissions from their
  // own role — that would lock out every account in that role, including
  // themselves, on their very next admin action.
  if (!allowed && permissionKey === "products.permissions" && role === admin.adminRole) return;
  await runBestEffort("setPermissionAction", () => setPermission(role, permissionKey, allowed));
  await logAudit(admin.id, "permissions.updated", "role", role, `${permissionKey} -> ${allowed}`);
  revalidatePath("/admin/permissions");
}
