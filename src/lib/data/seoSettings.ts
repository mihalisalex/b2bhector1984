import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Global SEO configuration, backed by the single `seo_settings` row added in
 * migration 0025.
 *
 * Read by robots.ts, sitemap.ts, the root layout, every `generateMetadata`,
 * and the JSON-LD builders. All of them run on public, uncached-by-default
 * routes, so this is `cache()`-wrapped to collapse to one query per request.
 *
 * If migration 0025 hasn't run, every read falls back to DEFAULTS, which are
 * exactly the values that were hardcoded before the SEO platform existed —
 * so an unmigrated database behaves identically to the old build rather than
 * crashing the homepage.
 */
export interface SeoSettings {
  siteName: string;
  titleTemplate: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultOgImageUrl?: string;
  twitterSite?: string;
  twitterCreator?: string;
  defaultTwitterCard: string;

  /**
   * Whether the gated trade surfaces (catalogue, product, quick-order,
   * linesheet) may be indexed. FALSE in every default and seeded state —
   * wholesale pricing must not appear in search results. See the migration's
   * comment for the full reasoning.
   */
  commerceIndexable: boolean;
  robotsEnabled: boolean;
  extraDisallow: string[];
  extraAllow: string[];
  crawlDelay?: number;
  sitemapEnabled: boolean;
  sitemapIncludeImages: boolean;

  organizationLegalName: string;
  organizationLogoUrl?: string;
  organizationEmail?: string;
  organizationPhone?: string;
  organizationStreet?: string;
  organizationCity?: string;
  organizationRegion?: string;
  organizationPostalCode?: string;
  organizationCountry: string;
  organizationFoundingYear?: string;
  socialProfiles: string[];
  localBusinessEnabled: boolean;
  openingHours?: string;

  schemaOrganization: boolean;
  schemaWebsite: boolean;
  schemaBreadcrumbs: boolean;
  schemaProduct: boolean;
  schemaFaq: boolean;

  googleSiteVerification?: string;
  bingSiteVerification?: string;
}

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  siteName: "Hector Footwear",
  titleTemplate: "%s — Hector Footwear Wholesale",
  defaultTitle: "Hector Footwear — Wholesale Footwear",
  defaultDescription:
    "Full-grain leather footwear for wholesale buyers. Two seasonal collections, box-only ordering, trade terms.",
  defaultTwitterCard: "summary_large_image",

  commerceIndexable: false,
  robotsEnabled: true,
  extraDisallow: [],
  extraAllow: [],
  sitemapEnabled: true,
  sitemapIncludeImages: true,

  organizationLegalName: "Hector Footwear",
  organizationCountry: "GR",
  socialProfiles: [],
  localBusinessEnabled: false,

  schemaOrganization: true,
  schemaWebsite: true,
  schemaBreadcrumbs: true,
  schemaProduct: true,
  schemaFaq: true,
};

interface SeoSettingsRow {
  site_name: string;
  title_template: string;
  default_title: string;
  default_description: string;
  default_og_image_url: string | null;
  twitter_site: string | null;
  twitter_creator: string | null;
  default_twitter_card: string;
  commerce_indexable: boolean;
  robots_enabled: boolean;
  extra_disallow: string[] | null;
  extra_allow: string[] | null;
  crawl_delay: number | null;
  sitemap_enabled: boolean;
  sitemap_include_images: boolean;
  organization_legal_name: string;
  organization_logo_url: string | null;
  organization_email: string | null;
  organization_phone: string | null;
  organization_street: string | null;
  organization_city: string | null;
  organization_region: string | null;
  organization_postal_code: string | null;
  organization_country: string;
  organization_founding_year: string | null;
  social_profiles: string[] | null;
  local_business_enabled: boolean;
  opening_hours: string | null;
  schema_organization: boolean;
  schema_website: boolean;
  schema_breadcrumbs: boolean;
  schema_product: boolean;
  schema_faq: boolean;
  google_site_verification: string | null;
  bing_site_verification: string | null;
}

/** Postgres/PostgREST returns null for an unset text column; the app models those as `undefined`. */
function opt(value: string | null): string | undefined {
  return value ?? undefined;
}

function mapSettings(row: SeoSettingsRow): SeoSettings {
  return {
    siteName: row.site_name,
    titleTemplate: row.title_template,
    defaultTitle: row.default_title,
    defaultDescription: row.default_description,
    defaultOgImageUrl: opt(row.default_og_image_url),
    twitterSite: opt(row.twitter_site),
    twitterCreator: opt(row.twitter_creator),
    defaultTwitterCard: row.default_twitter_card,
    commerceIndexable: row.commerce_indexable,
    robotsEnabled: row.robots_enabled,
    extraDisallow: row.extra_disallow ?? [],
    extraAllow: row.extra_allow ?? [],
    crawlDelay: row.crawl_delay ?? undefined,
    sitemapEnabled: row.sitemap_enabled,
    sitemapIncludeImages: row.sitemap_include_images,
    organizationLegalName: row.organization_legal_name,
    organizationLogoUrl: opt(row.organization_logo_url),
    organizationEmail: opt(row.organization_email),
    organizationPhone: opt(row.organization_phone),
    organizationStreet: opt(row.organization_street),
    organizationCity: opt(row.organization_city),
    organizationRegion: opt(row.organization_region),
    organizationPostalCode: opt(row.organization_postal_code),
    organizationCountry: row.organization_country,
    organizationFoundingYear: opt(row.organization_founding_year),
    socialProfiles: row.social_profiles ?? [],
    localBusinessEnabled: row.local_business_enabled,
    openingHours: opt(row.opening_hours),
    schemaOrganization: row.schema_organization,
    schemaWebsite: row.schema_website,
    schemaBreadcrumbs: row.schema_breadcrumbs,
    schemaProduct: row.schema_product,
    schemaFaq: row.schema_faq,
    googleSiteVerification: opt(row.google_site_verification),
    bingSiteVerification: opt(row.bing_site_verification),
  };
}

export const getSeoSettings = cache(async (): Promise<SeoSettings> => {
  const { data, error } = await supabaseAdmin.from("seo_settings").select("*").eq("id", "global").maybeSingle();
  if (error || !data) return DEFAULT_SEO_SETTINGS;
  return mapSettings(data as SeoSettingsRow);
});

/**
 * Whether migration 0025 has actually been applied.
 *
 * This asks the database directly rather than inferring it from whether any
 * SEO data exists — a freshly-migrated but not-yet-configured install has empty
 * tables, which is indistinguishable from a missing schema by content alone.
 * Getting that wrong would leave the dashboard permanently warning about a
 * migration the admin had already run.
 */
export const isSeoSchemaReady = cache(async (): Promise<boolean> => {
  const { error } = await supabaseAdmin.from("seo_settings").select("id").limit(1);
  return !error;
});

export async function updateSeoSettings(input: Partial<SeoSettings>): Promise<void> {
  // Only columns present in `input` are written, so a form that renders one
  // tab's worth of fields can't blank out the tabs it didn't render.
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const set = <T,>(column: string, value: T | undefined) => {
    if (value !== undefined) patch[column] = value;
  };

  set("site_name", input.siteName);
  set("title_template", input.titleTemplate);
  set("default_title", input.defaultTitle);
  set("default_description", input.defaultDescription);
  set("default_og_image_url", input.defaultOgImageUrl ?? null);
  set("twitter_site", input.twitterSite ?? null);
  set("twitter_creator", input.twitterCreator ?? null);
  set("default_twitter_card", input.defaultTwitterCard);
  set("commerce_indexable", input.commerceIndexable);
  set("robots_enabled", input.robotsEnabled);
  set("extra_disallow", input.extraDisallow);
  set("extra_allow", input.extraAllow);
  set("crawl_delay", input.crawlDelay ?? null);
  set("sitemap_enabled", input.sitemapEnabled);
  set("sitemap_include_images", input.sitemapIncludeImages);
  set("organization_legal_name", input.organizationLegalName);
  set("organization_logo_url", input.organizationLogoUrl ?? null);
  set("organization_email", input.organizationEmail ?? null);
  set("organization_phone", input.organizationPhone ?? null);
  set("organization_street", input.organizationStreet ?? null);
  set("organization_city", input.organizationCity ?? null);
  set("organization_region", input.organizationRegion ?? null);
  set("organization_postal_code", input.organizationPostalCode ?? null);
  set("organization_country", input.organizationCountry);
  set("organization_founding_year", input.organizationFoundingYear ?? null);
  set("social_profiles", input.socialProfiles);
  set("local_business_enabled", input.localBusinessEnabled);
  set("opening_hours", input.openingHours ?? null);
  set("schema_organization", input.schemaOrganization);
  set("schema_website", input.schemaWebsite);
  set("schema_breadcrumbs", input.schemaBreadcrumbs);
  set("schema_product", input.schemaProduct);
  set("schema_faq", input.schemaFaq);
  set("google_site_verification", input.googleSiteVerification ?? null);
  set("bing_site_verification", input.bingSiteVerification ?? null);

  const { error } = await supabaseAdmin.from("seo_settings").update(patch).eq("id", "global");
  if (error) throw new Error(`seo_settings: ${error.message}`);
}
