import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { DEFAULT_LOCALE } from "@/i18n/config";

/**
 * SEO overrides for everything that isn't a product.
 *
 * Categories and seasons are TypeScript unions and marketing pages are files
 * on disk — none of them have a database row to hang metadata off. Rather than
 * inventing tables for each, this one table is keyed by (type, key), where the
 * key is a uuid for real rows (collections, brands, suppliers) and a stable
 * string for the rest ("loafers", "/faq", "summer").
 */
export type SeoEntityType = "category" | "collection" | "brand" | "supplier" | "season" | "page" | "style";

export interface SeoEntityMeta {
  entityType: SeoEntityType;
  entityKey: string;
  seoTitle?: string;
  metaDescription?: string;
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
  structuredData?: Record<string, unknown>;
  updatedAt?: string;
}

interface EntityMetaRow {
  entity_type: SeoEntityType;
  entity_key: string;
  /** Optional so the mapper still works against a database where 0037 hasn't run. */
  locale?: string | null;
  seo_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  secondary_keywords: string[] | null;
  canonical_url: string | null;
  robots: string;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image_url: string | null;
  twitter_card: string;
  structured_data: Record<string, unknown> | null;
  updated_at: string;
}

function mapEntityMeta(row: EntityMetaRow): SeoEntityMeta {
  return {
    entityType: row.entity_type,
    entityKey: row.entity_key,
    seoTitle: row.seo_title ?? undefined,
    metaDescription: row.meta_description ?? undefined,
    focusKeyword: row.focus_keyword ?? undefined,
    secondaryKeywords: row.secondary_keywords ?? [],
    canonicalUrl: row.canonical_url ?? undefined,
    robots: row.robots,
    ogTitle: row.og_title ?? undefined,
    ogDescription: row.og_description ?? undefined,
    ogImageUrl: row.og_image_url ?? undefined,
    twitterTitle: row.twitter_title ?? undefined,
    twitterDescription: row.twitter_description ?? undefined,
    twitterImageUrl: row.twitter_image_url ?? undefined,
    twitterCard: row.twitter_card,
    structuredData: row.structured_data ?? undefined,
    updatedAt: row.updated_at,
  };
}

/**
 * Every override in one map, keyed `"type:key"`. Pages that need a single
 * entity's metadata still go through this — one small table read per request
 * shared via `cache()` beats a query per category on the collections page.
 */
export const getAllEntityMeta = cache(async (): Promise<Map<string, SeoEntityMeta>> => {
  const { data, error } = await supabaseAdmin.from("seo_entity_meta").select("*");
  if (error || !data) return new Map();
  return new Map(
    (data as EntityMetaRow[]).map((row) => [
      // Keyed by locale too, since migration 0037 made it part of the primary key. Rows
      // written before that migration read back as `en`, which is what they are.
      `${row.entity_type}:${row.entity_key}:${row.locale ?? DEFAULT_LOCALE}`,
      mapEntityMeta(row),
    ]),
  );
});

/**
 * One entity's override for one locale.
 *
 * Deliberately no cross-locale fallback. An override is a deliberate act for a specific
 * page in a specific language; inheriting another language's would put, say, an English
 * admin title on a Greek page — outranking the Greek in-code default and producing exactly
 * the mixed-language page the domain split exists to prevent. A miss here means the caller
 * falls through to its own locale-specific default, which is always translated.
 */
export async function getEntityMeta(
  entityType: SeoEntityType,
  entityKey: string,
  locale: string = DEFAULT_LOCALE,
): Promise<SeoEntityMeta | undefined> {
  const all = await getAllEntityMeta();
  return all.get(`${entityType}:${entityKey}:${locale}`);
}

/**
 * Optional fields accept `null` as well as `undefined`. Unlike `updateSeoSettings`,
 * this is a full-row upsert that already coalesces every optional column to null, so
 * the two mean the same thing here and neither can blank a field the form didn't render.
 */
export interface EntityMetaInput {
  seoTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  secondaryKeywords: string[];
  canonicalUrl?: string | null;
  robots: string;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImageUrl?: string | null;
  twitterCard: string;
}

export async function upsertEntityMeta(
  entityType: SeoEntityType,
  entityKey: string,
  input: EntityMetaInput,
): Promise<void> {
  const { error } = await supabaseAdmin.from("seo_entity_meta").upsert(
    {
      entity_type: entityType,
      entity_key: entityKey,
      seo_title: input.seoTitle ?? null,
      meta_description: input.metaDescription ?? null,
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
      updated_at: new Date().toISOString(),
    },
    { onConflict: "entity_type,entity_key" },
  );
  if (error) throw new Error(`seo_entity_meta: ${error.message}`);
}

export async function deleteEntityMeta(entityType: SeoEntityType, entityKey: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("seo_entity_meta")
    .delete()
    .eq("entity_type", entityType)
    .eq("entity_key", entityKey);
  if (error) throw new Error(`seo_entity_meta: ${error.message}`);
}
