import Image from "next/image";
import { getSeasonSettings } from "@/lib/data/seasonSettings";
import { updateSeasonSettingsAction, createSeasonTeaserUploadUrlAction, finalizeSeasonTeaserUploadAction } from "@/lib/adminActions";
import { ImageUploadForm } from "@/components/admin/ImageUploadForm";
import type { Season } from "@/lib/types";

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
        assortments) keep working. The homepage spotlight photo is chosen here too, rather than
        automatically picking whichever style happens to be first for that season.
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

      <div className="mt-10 max-w-xl space-y-8">
        <SeasonTeaserImage season="summer" imageUrl={settings.summer.teaserImageUrl} label={settings.summer.label} />
        <SeasonTeaserImage season="winter" imageUrl={settings.winter.teaserImageUrl} label={settings.winter.label} />
      </div>
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

function SeasonTeaserImage({ season, imageUrl, label }: { season: Season; imageUrl?: string; label: string }) {
  return (
    <div className="border border-stone-300 bg-white p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label} — homepage spotlight photo</span>
      <div className="relative mt-3 aspect-[16/9] w-full overflow-hidden border border-stone-300 bg-stone-100">
        {imageUrl ? (
          <Image src={imageUrl} alt={`${label} homepage spotlight`} fill sizes="(min-width: 1024px) 576px, 100vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-soft">
            No photo chosen yet — falls back to the season&rsquo;s first style photo
          </div>
        )}
      </div>
      <ImageUploadForm
        createUploadTarget={createSeasonTeaserUploadUrlAction.bind(null, season)}
        finalizeUpload={finalizeSeasonTeaserUploadAction.bind(null, season)}
        buttonLabel={imageUrl ? "Upload & replace" : "Upload photo"}
      />
    </div>
  );
}
