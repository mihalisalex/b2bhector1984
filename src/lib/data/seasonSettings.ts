import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Season } from "@/lib/types";

export interface SeasonSetting {
  enabled: boolean;
  label: string;
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
}

/** Degrades to the defaults (nothing hidden, stock labels) if migration 0022 hasn't run yet or the query fails. */
export const getSeasonSettings = cache(async (): Promise<SeasonSettings> => {
  const { data, error } = await supabaseAdmin.from("season_settings").select("season, enabled, label");
  if (error || !data) return DEFAULTS;
  const bySeason = new Map((data as SeasonSettingRow[]).map((row) => [row.season, row]));
  return {
    summer: bySeason.get("summer") ?? DEFAULTS.summer,
    winter: bySeason.get("winter") ?? DEFAULTS.winter,
  };
});

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

export async function updateSeasonSettings(input: SeasonSettings): Promise<void> {
  const rows = (Object.entries(input) as [Season, SeasonSetting][]).map(([season, s]) => ({
    season,
    enabled: s.enabled,
    label: s.label,
  }));
  const { error } = await supabaseAdmin.from("season_settings").upsert(rows, { onConflict: "season" });
  if (error) throw new Error(`season_settings: ${error.message}`);
}
