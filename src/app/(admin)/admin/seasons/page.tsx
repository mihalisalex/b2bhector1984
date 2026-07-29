import { getSeasonSettings } from "@/lib/data/seasonSettings";
import { updateSeasonSettingsAction } from "@/lib/adminActions";

export default async function AdminSeasonsPage() {
  const settings = await getSeasonSettings();

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Seasons
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">
        Control which seasons buyers can browse and what they&rsquo;re called. Turning a season off
        hides its styles from the Catalogue, Quick Order, Collections, and the homepage — the
        styles and their data are untouched, and direct links (cart, favorites, saved
        assortments) keep working.
      </p>

      <form action={updateSeasonSettingsAction} className="mt-8 max-w-xl space-y-8">
        <SeasonField season="summer" defaultEnabled={settings.summer.enabled} defaultLabel={settings.summer.label} />
        <SeasonField season="winter" defaultEnabled={settings.winter.enabled} defaultLabel={settings.winter.label} />

        <button
          type="submit"
          className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}

function SeasonField({
  season,
  defaultEnabled,
  defaultLabel,
}: {
  season: "summer" | "winter";
  defaultEnabled: boolean;
  defaultLabel: string;
}) {
  const prefix = season === "summer" ? "summer" : "winter";
  const fallback = season === "summer" ? "Summer" : "Winter";
  return (
    <div className="border border-stone-300 bg-white p-4">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink">
        <input
          type="checkbox"
          name={`${prefix}Enabled`}
          defaultChecked={defaultEnabled}
          className="h-4 w-4 accent-ink"
        />
        {fallback} enabled
      </label>
      <label className="mt-3 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Display name</span>
        <input
          type="text"
          name={`${prefix}Label`}
          defaultValue={defaultLabel}
          placeholder={`e.g. "${fallback} 2027"`}
          required
          className="mt-1.5 w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
        />
      </label>
    </div>
  );
}
