import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CACHE_TAGS, CACHE_TTL_SECONDS } from "@/lib/cacheTags";
import { assertAllowedExtension, IMAGE_EXTENSIONS } from "@/lib/uploadValidation";

const BUCKET = "site-content";
const HERO_ID = "homepage_hero";

export interface HomepageHero {
  eyebrow: string;
  heading: string;
  body: string;
  heroImageUrl: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  /**
   * Greek hero copy (migration 0037). Empty string means "not written yet" and the
   * homepage falls back to the English field beside it.
   *
   * The CTA *hrefs* are deliberately not duplicated: they are routes, and both languages
   * point at the same page on their own domain.
   */
  eyebrowEl: string;
  headingEl: string;
  bodyEl: string;
  primaryCtaLabelEl: string;
  secondaryCtaLabelEl: string;
  /** The bar above the hero ("Summer 2027 Collection is Live Now" -> /catalogue). Added by
   * migration 0024 — `mapHero` defaults these when the columns aren't there yet, so an
   * unmigrated database just doesn't show the bar instead of crashing the homepage. */
  announcementEnabled: boolean;
  announcementText: string;
  announcementHref: string;
  /** Admin-selectable background for the bar itself (migration 0035). Defaults to "black"
   * on a database that hasn't run it yet, or on any unrecognised stored value — same
   * defensive-default pattern as `announcementEnabled` above. */
  announcementColor: "black" | "burgundy";
  /** The free-text closing line appended to the WhatsApp proforma-invoice notification
   * (migration 0026) — the one part of that message that isn't a computed order figure. */
  whatsappClosingNote: string;
  /** Site-wide production lead time in days (migration 0030) — used to stamp
   * `production_eta` on any order line that couldn't be fulfilled from stock. */
  productionLeadTimeDays: number;
}

interface HeroRow {
  eyebrow: string;
  heading: string;
  body: string;
  hero_image_url: string;
  primary_cta_label: string;
  primary_cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
  eyebrow_el?: string | null;
  heading_el?: string | null;
  body_el?: string | null;
  primary_cta_label_el?: string | null;
  secondary_cta_label_el?: string | null;
  announcement_enabled?: boolean | null;
  announcement_text?: string | null;
  announcement_href?: string | null;
  announcement_color?: string | null;
  whatsapp_closing_note?: string | null;
  production_lead_time_days?: number | null;
}

function mapHero(row: HeroRow): HomepageHero {
  return {
    eyebrow: row.eyebrow,
    heading: row.heading,
    body: row.body,
    heroImageUrl: row.hero_image_url,
    primaryCtaLabel: row.primary_cta_label,
    primaryCtaHref: row.primary_cta_href,
    secondaryCtaLabel: row.secondary_cta_label,
    secondaryCtaHref: row.secondary_cta_href,
    eyebrowEl: row.eyebrow_el ?? "",
    headingEl: row.heading_el ?? "",
    bodyEl: row.body_el ?? "",
    primaryCtaLabelEl: row.primary_cta_label_el ?? "",
    secondaryCtaLabelEl: row.secondary_cta_label_el ?? "",
    announcementEnabled: row.announcement_enabled ?? false,
    announcementText: row.announcement_text ?? "",
    announcementHref: row.announcement_href ?? "/catalogue",
    announcementColor: row.announcement_color === "burgundy" ? "burgundy" : "black",
    whatsappClosingNote: row.whatsapp_closing_note ?? "Thank you for your business — we'll confirm stock and production shortly.",
    productionLeadTimeDays: row.production_lead_time_days ?? 40,
  };
}

async function fetchHomepageHero(): Promise<HomepageHero> {
  const { data, error } = await supabaseAdmin
    .from("site_content")
    .select("*")
    .eq("id", HERO_ID)
    .single();
  if (error) throw new Error(`site_content: ${error.message}`);
  return mapHero(data);
}

/**
 * `cache()`-wrapped: the marketing layout (announcement bar) and the homepage (hero
 * content) both need this in the same request's render tree, so they share one fetch
 * instead of querying `site_content` twice.
 *
 * Also cached *across* requests — this runs on every page under the marketing layout, not
 * just the homepage, so it was one query per pageview sitewide for a row that changes a few
 * times a month. See `@/lib/cacheTags`.
 */
export const getHomepageHero = cache(
  unstable_cache(fetchHomepageHero, ["homepage-hero"], {
    tags: [CACHE_TAGS.siteContent],
    revalidate: CACHE_TTL_SECONDS,
  }),
);

export async function updateHomepageHero(input: {
  eyebrow: string;
  heading: string;
  body: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  eyebrowEl: string;
  headingEl: string;
  bodyEl: string;
  primaryCtaLabelEl: string;
  secondaryCtaLabelEl: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementHref: string;
  announcementColor: "black" | "burgundy";
  whatsappClosingNote: string;
  productionLeadTimeDays: number;
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("site_content")
    .update({
      eyebrow: input.eyebrow,
      heading: input.heading,
      body: input.body,
      primary_cta_label: input.primaryCtaLabel,
      primary_cta_href: input.primaryCtaHref,
      secondary_cta_label: input.secondaryCtaLabel,
      secondary_cta_href: input.secondaryCtaHref,
      // Empty string is stored as null, so "not written yet" has exactly one
      // representation — otherwise `heading_el = ''` and `heading_el IS NULL` would both
      // mean "no Greek" and every fallback check would have to test for both.
      eyebrow_el: input.eyebrowEl.trim() || null,
      heading_el: input.headingEl.trim() || null,
      body_el: input.bodyEl.trim() || null,
      primary_cta_label_el: input.primaryCtaLabelEl.trim() || null,
      secondary_cta_label_el: input.secondaryCtaLabelEl.trim() || null,
      announcement_enabled: input.announcementEnabled,
      announcement_text: input.announcementText,
      announcement_color: input.announcementColor,
      whatsapp_closing_note: input.whatsappClosingNote,
      announcement_href: input.announcementHref,
      production_lead_time_days: input.productionLeadTimeDays,
      updated_at: new Date().toISOString(),
    })
    .eq("id", HERO_ID);
  if (error) throw new Error(`site_content: ${error.message}`);
}

/** Mints a signed Storage upload slot — the browser PUTs the file bytes directly
 * to Supabase using this, never through the Next.js server (see supabase/browser.ts). */
export async function createHeroImageUploadTarget(
  fileName: string,
): Promise<{ bucket: string; path: string; token: string }> {
  assertAllowedExtension(fileName, IMAGE_EXTENSIONS);
  const path = `${HERO_ID}/${crypto.randomUUID()}-${fileName}`;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(`storage createSignedUploadUrl: ${error.message}`);
  return { bucket: BUCKET, path: data.path, token: data.token };
}

/** Called once the browser has finished the direct-to-Storage upload for `path`. */
export async function finalizeHeroImageUpload(path: string): Promise<void> {
  const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await supabaseAdmin
    .from("site_content")
    .update({ hero_image_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", HERO_ID);
  if (error) throw new Error(`site_content: ${error.message}`);
}
