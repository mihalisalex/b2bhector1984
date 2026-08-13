import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { assertAllowedExtension, IMAGE_EXTENSIONS } from "@/lib/uploadValidation";
import { CACHE_TAGS, CACHE_TTL_SECONDS } from "@/lib/cacheTags";
import type { Season } from "@/lib/types";

const BUCKET = "site-content";

export interface SeasonSetting {
  enabled: boolean;
  label: string;
  teaserImagePath?: string;
  teaserImageUrl?: string;
}

export type SeasonSettings = Record<Season, SeasonSetting>;

const DEFAULTS: SeasonSettings = {
  summer: { enabled: true, label: "Summer" },
  winter: { enabled: true, label: "Winter" },
};

interface SeasonSettingRow {
  season: Season;
  enabled: boolean;
  label: string;
  teaser_image_path?: string | null;
  teaser_image_url?: string | null;
}

function mapSetting(row: SeasonSettingRow): SeasonSetting {
  return {
    enabled: row.enabled,
    label: row.label,
    teaserImagePath: row.teaser_image_path ?? undefined,
    teaserImageUrl: row.teaser_image_url ?? undefined,
  };
}

/** Degrades to the defaults (nothing hidden, stock labels, no teaser image) if migration
 * 0022/0028 hasn't run yet or the query fails. */
async function fetchSeasonSettings(): Promise<SeasonSettings> {
  const { data, error } = await supabaseAdmin.from("season_settings").select("*");
  if (error || !data) return DEFAULTS;
  const bySeason = new Map((data as SeasonSettingRow[]).map((row) => [row.season, mapSetting(row)]));
  return {
    summer: bySeason.get("summer") ?? DEFAULTS.summer,
    winter: bySeason.get("winter") ?? DEFAULTS.winter,
  };
}

/**
 * Two cache layers, deliberately: `unstable_cache` persists this across requests (see
 * `@/lib/cacheTags`), and React's `cache()` on the outside still collapses the several
 * calls made within a single render tree. The `Map` above is local to the fetch and never
 * crosses the cache boundary — the returned object is plain JSON, so it serializes cleanly.
 */
export const getSeasonSettings = cache(
  unstable_cache(fetchSeasonSettings, ["season-settings"], {
    tags: [CACHE_TAGS.seasons],
    revalidate: CACHE_TTL_SECONDS,
  }),
);

/**
 * Seasons that should appear in buyer-facing browsing surfaces. Never returns
 * an empty set — an admin disabling both seasons at once falls back to
 * showing everything rather than bricking the storefront over a misclick.
 */
export async function getEnabledSeasons(): Promise<Set<Season>> {
  const settings = await getSeasonSettings();
  const enabled = (Object.entries(settings) as [Season, SeasonSetting][])
    .filter(([, s]) => s.enabled)
    .map(([season]) => season);
  return enabled.length > 0 ? new Set(enabled) : new Set<Season>(["summer", "winter"]);
}

/** Enabled seasons only, in a fixed summer-then-winter order, with their admin-configured labels. */
export function toSeasonOptions(settings: SeasonSettings): { value: Season; label: string }[] {
  return (["summer", "winter"] as const)
    .filter((season) => settings[season].enabled)
    .map((season) => ({ value: season, label: settings[season].label }));
}

export async function updateSeasonSettings(input: { summer: { enabled: boolean; label: string }; winter: { enabled: boolean; label: string } }): Promise<void> {
  const rows = (Object.entries(input) as [Season, { enabled: boolean; label: string }][]).map(([season, s]) => ({
    season,
    enabled: s.enabled,
    label: s.label,
  }));
  const { error } = await supabaseAdmin.from("season_settings").upsert(rows, { onConflict: "season" });
  if (error) throw new Error(`season_settings: ${error.message}`);
}

/** Mints a signed Storage upload slot for a season's homepage teaser photo — the browser
 * PUTs the file bytes directly to Supabase, never through the Next.js server. */
export async function createSeasonTeaserUploadTarget(
  season: Season,
  fileName: string,
): Promise<{ bucket: string; path: string; token: string }> {
  assertAllowedExtension(fileName, IMAGE_EXTENSIONS);
  const path = `season-teasers/${season}/${crypto.randomUUID()}-${fileName}`;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(`storage createSignedUploadUrl: ${error.message}`);
  return { bucket: BUCKET, path: data.path, token: data.token };
}

/** Called once the browser has finished the direct-to-Storage upload for `path`. */
export async function finalizeSeasonTeaserUpload(season: Season, path: string): Promise<void> {
  const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await supabaseAdmin
    .from("season_settings")
    .update({ teaser_image_path: path, teaser_image_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("season", season);
  if (error) throw new Error(`season_settings: ${error.message}`);
}
