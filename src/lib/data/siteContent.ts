import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
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
  /** The bar above the hero ("Summer 2027 Collection is Live Now" -> /catalogue). Added by
   * migration 0024 — `mapHero` defaults these when the columns aren't there yet, so an
   * unmigrated database just doesn't show the bar instead of crashing the homepage. */
  announcementEnabled: boolean;
  announcementText: string;
  announcementHref: string;
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
  announcement_enabled?: boolean | null;
  announcement_text?: string | null;
  announcement_href?: string | null;
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
    announcementEnabled: row.announcement_enabled ?? false,
    announcementText: row.announcement_text ?? "",
    announcementHref: row.announcement_href ?? "/catalogue",
  };
}

/** `cache()`-wrapped: the marketing layout (announcement bar) and the homepage (hero
 * content) both need this in the same request's render tree, so they share one fetch
 * instead of querying `site_content` twice. */
export const getHomepageHero = cache(async (): Promise<HomepageHero> => {
  const { data, error } = await supabaseAdmin
    .from("site_content")
    .select("*")
    .eq("id", HERO_ID)
    .single();
  if (error) throw new Error(`site_content: ${error.message}`);
  return mapHero(data);
});

export async function updateHomepageHero(input: {
  eyebrow: string;
  heading: string;
  body: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementHref: string;
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
      announcement_enabled: input.announcementEnabled,
      announcement_text: input.announcementText,
      announcement_href: input.announcementHref,
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
