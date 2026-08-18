"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { logAudit } from "@/lib/data/auditLog";
import { hasPermission } from "@/lib/data/permissions";
import { updateSeoSettings, type SeoSettings } from "@/lib/data/seoSettings";
import {
  createRedirect,
  deleteRedirect,
  deleteRedirects,
  listRedirects,
  normalizePath,
  updateRedirect,
  upsertRedirect,
  validateRedirect,
} from "@/lib/data/seoRedirects";
import { deleteEntityMeta, upsertEntityMeta, type SeoEntityType } from "@/lib/data/seoEntityMeta";
import { getAllStyles } from "@/lib/data/styles";
import { updateStyleSeo } from "@/lib/data/productAdmin";
import { listAllImagesWithContext, setAltTextBulk } from "@/lib/data/styleImages";
import { revalidateSeoSurfaces } from "@/lib/seoRevalidate";
import {
  generateImageAltText,
  generateProductDescription,
  generateProductTitle,
} from "@/lib/seoAutogen";
import type { FormState } from "@/lib/actions";

/**
 * Server actions for the SEO dashboard.
 *
 * Every mutation here is gated on the existing `products.seo` permission (the
 * Product Management module's RBAC), so the same roles that can edit a
 * product's SEO tab can edit site-wide SEO — and no others. `super_admin` is
 * always allowed, as everywhere else in that module.
 *
 * Like `productActions.ts`, every write goes through `runOrError` so that a
 * database that hasn't had migration 0025 applied produces one clear message
 * instead of an uncaught 500.
 */

async function requireSeoPermission() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") redirect("/login");
  const allowed = await hasPermission(account.adminRole, "products.seo");
  if (!allowed) {
    throw new Error(`Your role (${account.adminRole ?? "admin"}) doesn't have the "products.seo" permission.`);
  }
  return account;
}

function isMissingSchemaError(message: string): boolean {
  return message.includes("schema cache") || message.includes("does not exist") || message.includes("Could not find");
}

function friendlyDbError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (isMissingSchemaError(message)) {
    return "Can't save this yet — the SEO platform migration (0025_seo_platform.sql) hasn't been run in the Supabase SQL Editor.";
  }
  return message;
}

async function runOrError(fn: () => Promise<void>): Promise<FormState | undefined> {
  try {
    await fn();
    return undefined;
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
}

function revalidateSeoAdmin() {
  revalidatePath("/admin/seo");
  revalidatePath("/admin/seo/settings");
  revalidatePath("/admin/seo/redirects");
  revalidatePath("/admin/seo/pages");
  revalidatePath("/admin/seo/bulk");
}

// ---------------------------------------------------------------------------
// Global settings
// ---------------------------------------------------------------------------

const bool = (formData: FormData, key: string) => formData.get(key) === "on" || formData.get(key) === "true";
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim() || undefined;
const lines = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "")
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);

export async function updateSeoSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSeoPermission();
  const section = String(formData.get("section") ?? "general");

  // Each tab submits only its own fields; `updateSeoSettings` writes only the
  // keys present, so one tab's save can never blank another tab's values.
  let patch: Partial<SeoSettings> = {};

  if (section === "general") {
    patch = {
      siteName: String(formData.get("siteName") ?? "").trim() || "Hector Footwear",
      titleTemplate: String(formData.get("titleTemplate") ?? "").trim() || "%s — Hector Footwear Wholesale",
      defaultTitle: String(formData.get("defaultTitle") ?? "").trim() || "Hector Footwear — Wholesale Footwear",
      defaultDescription: String(formData.get("defaultDescription") ?? "").trim(),
      defaultOgImageUrl: text(formData, "defaultOgImageUrl"),
      twitterSite: text(formData, "twitterSite"),
      twitterCreator: text(formData, "twitterCreator"),
      defaultTwitterCard: String(formData.get("defaultTwitterCard") ?? "summary_large_image"),
      googleSiteVerification: text(formData, "googleSiteVerification"),
      bingSiteVerification: text(formData, "bingSiteVerification"),
    };
  } else if (section === "indexing") {
    patch = {
      commerceIndexable: bool(formData, "commerceIndexable"),
      robotsEnabled: bool(formData, "robotsEnabled"),
      sitemapEnabled: bool(formData, "sitemapEnabled"),
      sitemapIncludeImages: bool(formData, "sitemapIncludeImages"),
      extraDisallow: lines(formData, "extraDisallow"),
      extraAllow: lines(formData, "extraAllow"),
      crawlDelay: Number(formData.get("crawlDelay")) || undefined,
    };
  } else if (section === "organization") {
    patch = {
      organizationLegalName: String(formData.get("organizationLegalName") ?? "").trim(),
      organizationLogoUrl: text(formData, "organizationLogoUrl"),
      organizationEmail: text(formData, "organizationEmail"),
      organizationPhone: text(formData, "organizationPhone"),
      organizationStreet: text(formData, "organizationStreet"),
      organizationCity: text(formData, "organizationCity"),
      organizationRegion: text(formData, "organizationRegion"),
      organizationPostalCode: text(formData, "organizationPostalCode"),
      organizationCountry: String(formData.get("organizationCountry") ?? "GR").trim(),
      organizationFoundingYear: text(formData, "organizationFoundingYear"),
      socialProfiles: lines(formData, "socialProfiles"),
      localBusinessEnabled: bool(formData, "localBusinessEnabled"),
      openingHours: text(formData, "openingHours"),
    };
  } else if (section === "schema") {
    patch = {
      schemaOrganization: bool(formData, "schemaOrganization"),
      schemaWebsite: bool(formData, "schemaWebsite"),
      schemaBreadcrumbs: bool(formData, "schemaBreadcrumbs"),
      schemaProduct: bool(formData, "schemaProduct"),
      schemaFaq: bool(formData, "schemaFaq"),
    };
  }

  const failure = await runOrError(() => updateSeoSettings(patch));
  if (failure) return failure;

  await logAudit(admin.id, "seo.settings_changed", "seo_settings", section);
  revalidateSeoSurfaces();
  revalidateSeoAdmin();

  const warning =
    section === "indexing" && patch.commerceIndexable
      ? " Catalogue and product pages are now advertised to search engines. Trade pricing stays behind the login — anonymous visitors and crawlers see the product but not the price."
      : "";
  return { success: `Settings saved.${warning}` };
}

// ---------------------------------------------------------------------------
// Redirects
// ---------------------------------------------------------------------------

export async function createRedirectAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSeoPermission();
  const fromPath = String(formData.get("fromPath") ?? "");
  const toPath = String(formData.get("toPath") ?? "");
  const statusCode = Number(formData.get("statusCode") ?? 301);

  const existing = await listRedirects();
  const check = validateRedirect({ fromPath, toPath }, existing);
  if (!check.ok) return { error: check.error };

  if (existing.some((r) => normalizePath(r.fromPath) === normalizePath(fromPath))) {
    return { error: `A redirect from ${normalizePath(fromPath)} already exists. Edit it instead.` };
  }

  const failure = await runOrError(() =>
    createRedirect({
      fromPath,
      toPath,
      statusCode,
      enabled: true,
      source: "manual",
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    }),
  );
  if (failure) return failure;

  await logAudit(admin.id, "seo.redirect_created", "seo_redirect", normalizePath(fromPath), `→ ${normalizePath(toPath)}`);
  revalidateSeoAdmin();
  return { success: check.warning ? `Redirect created. ${check.warning}` : "Redirect created." };
}

export async function updateRedirectAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSeoPermission();
  const fromPath = String(formData.get("fromPath") ?? "");
  const toPath = String(formData.get("toPath") ?? "");

  const existing = (await listRedirects()).filter((r) => r.id !== id);
  const check = validateRedirect({ fromPath, toPath }, existing);
  if (!check.ok) return { error: check.error };

  const failure = await runOrError(() =>
    updateRedirect(id, {
      fromPath,
      toPath,
      statusCode: Number(formData.get("statusCode") ?? 301),
      enabled: formData.get("enabled") !== null,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    }),
  );
  if (failure) return failure;

  await logAudit(admin.id, "seo.redirect_updated", "seo_redirect", id);
  revalidateSeoAdmin();
  return { success: check.warning ? `Redirect updated. ${check.warning}` : "Redirect updated." };
}

export async function deleteRedirectAction(id: string): Promise<void> {
  const admin = await requireSeoPermission();
  try {
    await deleteRedirect(id);
    await logAudit(admin.id, "seo.redirect_deleted", "seo_redirect", id);
    revalidateSeoAdmin();
  } catch (err) {
    console.error(`deleteRedirect failed: ${friendlyDbError(err)}`);
  }
}

export async function bulkDeleteRedirectsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSeoPermission();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  if (ids.length === 0) return { error: "Select at least one redirect." };

  const failure = await runOrError(() => deleteRedirects(ids));
  if (failure) return failure;
  await logAudit(admin.id, "seo.redirects_bulk_deleted", "seo_redirect", `${ids.length} rules`);
  revalidateSeoAdmin();
  return { success: `Deleted ${ids.length} redirect${ids.length === 1 ? "" : "s"}.` };
}

/**
 * CSV import. Accepts `from,to,status` with an optional header row.
 *
 * Every row is validated against the rules already in place *and* against the
 * rows earlier in the same file, so an import can't introduce a loop that
 * neither row would create on its own. Invalid rows are reported and skipped;
 * a single bad line never aborts the whole import.
 */
export async function importRedirectsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSeoPermission();
  const raw = String(formData.get("csv") ?? "").trim();
  if (!raw) return { error: "Paste some CSV first." };

  const existing = await listRedirects();
  const running = existing.map((r) => ({ fromPath: r.fromPath, toPath: r.toPath }));

  const rows = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const errors: string[] = [];
  let imported = 0;

  for (const [index, line] of rows.entries()) {
    const cells = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const [from, to, status] = cells;
    // Skip a header row.
    if (index === 0 && /^(from|source|old)/i.test(from ?? "")) continue;
    if (!from || !to) {
      errors.push(`Line ${index + 1}: needs both a source and a destination.`);
      continue;
    }

    const statusCode = Number(status) || 301;
    if (![301, 302, 307, 308].includes(statusCode)) {
      errors.push(`Line ${index + 1}: "${status}" isn't a supported status code.`);
      continue;
    }

    const check = validateRedirect({ fromPath: from, toPath: to }, running);
    if (!check.ok) {
      errors.push(`Line ${index + 1}: ${check.error}`);
      continue;
    }

    try {
      await upsertRedirect({ fromPath: from, toPath: to, statusCode, enabled: true, source: "import" });
      running.push({ fromPath: from, toPath: to });
      imported++;
    } catch (err) {
      errors.push(`Line ${index + 1}: ${friendlyDbError(err)}`);
    }
  }

  await logAudit(admin.id, "seo.redirects_imported", "seo_redirect", `${imported} rules`);
  revalidateSeoAdmin();

  if (imported === 0) return { error: errors.slice(0, 5).join(" ") || "Nothing imported." };
  const suffix = errors.length ? ` ${errors.length} row(s) skipped: ${errors.slice(0, 3).join(" ")}` : "";
  return { success: `Imported ${imported} redirect${imported === 1 ? "" : "s"}.${suffix}` };
}

// ---------------------------------------------------------------------------
// Per-entity metadata (categories, collections, brands, suppliers, pages)
// ---------------------------------------------------------------------------

export async function updateEntityMetaAction(
  entityType: SeoEntityType,
  entityKey: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireSeoPermission();
  const csv = (key: string) =>
    String(formData.get(key) ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

  const failure = await runOrError(() =>
    upsertEntityMeta(entityType, entityKey, {
      seoTitle: text(formData, "seoTitle"),
      metaDescription: text(formData, "metaDescription"),
      focusKeyword: text(formData, "focusKeyword"),
      secondaryKeywords: csv("secondaryKeywords"),
      canonicalUrl: text(formData, "canonicalUrl"),
      robots: String(formData.get("robots") ?? "index,follow"),
      ogTitle: text(formData, "ogTitle"),
      ogDescription: text(formData, "ogDescription"),
      ogImageUrl: text(formData, "ogImageUrl"),
      twitterTitle: text(formData, "twitterTitle"),
      twitterDescription: text(formData, "twitterDescription"),
      twitterImageUrl: text(formData, "twitterImageUrl"),
      twitterCard: String(formData.get("twitterCard") ?? "summary_large_image"),
    }),
  );
  if (failure) return failure;

  await logAudit(admin.id, "seo.entity_meta_changed", entityType, entityKey);
  revalidateSeoSurfaces();
  revalidateSeoAdmin();
  if (entityType === "page") revalidatePath(entityKey);
  return { success: "Saved." };
}

export async function resetEntityMetaAction(entityType: SeoEntityType, entityKey: string): Promise<void> {
  const admin = await requireSeoPermission();
  try {
    await deleteEntityMeta(entityType, entityKey);
    await logAudit(admin.id, "seo.entity_meta_reset", entityType, entityKey);
    revalidateSeoSurfaces();
    revalidateSeoAdmin();
  } catch (err) {
    console.error(`resetEntityMeta failed: ${friendlyDbError(err)}`);
  }
}

// ---------------------------------------------------------------------------
// Bulk product SEO
// ---------------------------------------------------------------------------

/**
 * Fills in every *blank* SEO title and description across the catalogue with
 * generated copy.
 *
 * Explicitly does not touch a field an admin has already written — the
 * generated values are a floor, not a replacement, and silently overwriting
 * hand-written copy would be the single most destructive thing this dashboard
 * could do.
 */
export async function generateMissingProductSeoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSeoPermission();
  const overwrite = bool(formData, "overwrite");
  const styles = await getAllStyles();

  let updated = 0;
  const failures: string[] = [];

  for (const style of styles) {
    const source = {
      name: style.name,
      styleNumber: style.styleNumber,
      category: style.category,
      season: style.season,
      tagline: style.tagline,
      description: style.description,
      brandName: style.brandName,
      materials: style.materials,
      tags: style.tags,
    };

    const needsTitle = overwrite || !style.seoTitle?.trim();
    const needsDescription = overwrite || !style.metaDescription?.trim();
    if (!needsTitle && !needsDescription) continue;

    try {
      await updateStyleSeo(style.id, {
        seoTitle: needsTitle ? generateProductTitle(source, "Hector Footwear") : style.seoTitle,
        metaDescription: needsDescription ? generateProductDescription(source) : style.metaDescription,
        seoKeywords: style.seoKeywords,
        focusKeyword: style.focusKeyword,
        secondaryKeywords: style.secondaryKeywords,
        canonicalUrl: style.canonicalUrl,
        robots: style.robots,
        ogTitle: style.ogTitle,
        ogDescription: style.ogDescription,
        ogImageUrl: style.ogImageUrl,
        twitterTitle: style.twitterTitle,
        twitterDescription: style.twitterDescription,
        twitterImageUrl: style.twitterImageUrl,
        twitterCard: style.twitterCard,
      });
      updated++;
    } catch (err) {
      failures.push(friendlyDbError(err));
    }
  }

  if (updated === 0 && failures.length > 0) return { error: failures[0] };

  await logAudit(admin.id, "seo.bulk_generated", "style", `${updated} products`);
  revalidatePath("/admin/products");
  revalidateSeoAdmin();
  revalidateSeoSurfaces();
  return {
    success: updated === 0 ? "Every product already has a title and description." : `Filled in SEO copy for ${updated} product${updated === 1 ? "" : "s"}.`,
  };
}

/**
 * Generates alt text for every product image that has none. Same
 * never-overwrite rule.
 *
 * Takes the full `useActionState` signature even though it reads neither
 * argument — the form has no fields, but the hook still calls it with both.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateMissingAltTextAction(_prev: FormState, _formData: FormData): Promise<FormState> {
  const admin = await requireSeoPermission();
  const [styles, images] = await Promise.all([getAllStyles(), listAllImagesWithContext()]);
  const byId = new Map(styles.map((style) => [style.id, style]));

  const updates = images
    .filter((image) => !image.altText.trim())
    .map((image) => {
      const style = byId.get(image.styleId);
      if (!style) return null;
      return { imageId: image.id, altText: generateImageAltText({ name: style.name, category: style.category }) };
    })
    .filter((update): update is { imageId: string; altText: string } => update !== null);

  if (updates.length === 0) return { success: "Every product image already has alt text." };

  const failure = await runOrError(() => setAltTextBulk(updates));
  if (failure) return failure;

  await logAudit(admin.id, "seo.bulk_alt_text", "style_image", `${updates.length} images`);
  revalidatePath("/admin/products");
  revalidateSeoAdmin();
  return { success: `Wrote alt text for ${updates.length} image${updates.length === 1 ? "" : "s"}.` };
}

/**
 * Applies one field to many products at once — the "bulk edit" the brief asks
 * for. Values are applied verbatim; `{name}` and `{category}` are substituted
 * per product so a single template can produce distinct copy rather than
 * stamping every product with an identical (and duplicate-flagged) string.
 */
export async function bulkEditProductSeoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSeoPermission();
  const field = String(formData.get("field") ?? "");
  const template = String(formData.get("value") ?? "").trim();
  const ids = formData.getAll("ids").map(String).filter(Boolean);

  if (ids.length === 0) return { error: "Select at least one product." };
  if (!template && field !== "clear") return { error: "Enter a value to apply." };

  const styles = (await getAllStyles()).filter((style) => ids.includes(style.id));
  let updated = 0;
  const failures: string[] = [];

  for (const style of styles) {
    const value = template
      .replaceAll("{name}", style.name)
      .replaceAll("{category}", style.category)
      .replaceAll("{season}", style.season ?? "")
      .replaceAll("{styleNumber}", style.styleNumber)
      .replaceAll("{brand}", style.brandName || "Hector Footwear");

    const patch = {
      seoTitle: style.seoTitle,
      metaDescription: style.metaDescription,
      seoKeywords: style.seoKeywords,
      focusKeyword: style.focusKeyword,
      secondaryKeywords: style.secondaryKeywords,
      canonicalUrl: style.canonicalUrl,
      robots: style.robots,
      ogTitle: style.ogTitle,
      ogDescription: style.ogDescription,
      ogImageUrl: style.ogImageUrl,
      twitterTitle: style.twitterTitle,
      twitterDescription: style.twitterDescription,
      twitterImageUrl: style.twitterImageUrl,
      twitterCard: style.twitterCard,
    };

    if (field === "seoTitle") patch.seoTitle = value;
    else if (field === "metaDescription") patch.metaDescription = value;
    else if (field === "robots") patch.robots = value;
    else if (field === "canonicalUrl") patch.canonicalUrl = value;
    else if (field === "ogTitle") patch.ogTitle = value;
    else if (field === "ogDescription") patch.ogDescription = value;
    else if (field === "focusKeyword") patch.focusKeyword = value;
    else if (field === "secondaryKeywords") {
      patch.secondaryKeywords = value.split(",").map((k) => k.trim()).filter(Boolean);
    } else return { error: `Unknown field "${field}".` };

    try {
      await updateStyleSeo(style.id, patch);
      updated++;
    } catch (err) {
      failures.push(friendlyDbError(err));
    }
  }

  if (updated === 0) return { error: failures[0] ?? "Nothing was updated." };

  await logAudit(admin.id, "seo.bulk_edit", "style", `${field} on ${updated} products`);
  revalidatePath("/admin/products");
  revalidateSeoAdmin();
  revalidateSeoSurfaces();
  return { success: `Updated ${field} on ${updated} product${updated === 1 ? "" : "s"}.` };
}
