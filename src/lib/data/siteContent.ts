import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

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
  };
}

export async function getHomepageHero(): Promise<HomepageHero> {
  const { data, error } = await supabaseAdmin
    .from("site_content")
    .select("*")
    .eq("id", HERO_ID)
    .single();
  if (error) throw new Error(`site_content: ${error.message}`);
  return mapHero(data);
}

export async function updateHomepageHero(input: {
  eyebrow: string;
  heading: string;
  body: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", HERO_ID);
  if (error) throw new Error(`site_content: ${error.message}`);
}

export async function uploadHeroImage(file: File): Promise<void> {
  const path = `${HERO_ID}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) throw new Error(`storage upload: ${uploadError.message}`);

  const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await supabaseAdmin
    .from("site_content")
    .update({ hero_image_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", HERO_ID);
  if (error) throw new Error(`site_content: ${error.message}`);
}
