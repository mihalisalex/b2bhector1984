import Image from "next/image";
import { getSeasonSettings } from "@/lib/data/seasonSettings";
import { getAllStylesForAdmin } from "@/lib/data/styles";
import { setSeasonOpenAction, updateSeasonSettingsAction, createSeasonTeaserUploadUrlAction, finalizeSeasonTeaserUploadAction } from "@/lib/adminActions";
import { ImageUploadForm } from "@/components/admin/ImageUploadForm";
import type { Season } from "@/lib/types";

export default async function AdminSeasonsPage() {
  const [settings, styles] = await Promise.all([getSeasonSettings(), getAllStylesForAdmin()]);
  const active = styles.filter((s) => (s.status ?? "active") === "active");
  const counts = {
    winter: active.filter((s) => s.season === "winter").length,
    summer: active.filter((s) => s.season === "summer").length,
    both: active.filter((s) => s.season === "both").length,
  };

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Seasons
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">
        Close a season when it&rsquo;s too late to deliver it. Its styles leave the Catalogue, Quick Order,
        Collections, search and the homepage, and nobody can order them, even from an old link or an old cart.
        All-season styles stay on sale. You can still see, edit and quote closed styles here in the admin.
        Takes effect within about a minute.
      </p>

      <div className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
        <SeasonSwitch season="winter" name={settings.winter.label} open={settings.winter.enabled} otherOpen={settings.summer.enabled} count={counts.winter} shared={counts.both} />
        <SeasonSwitch season="summer" name={settings.summer.label} open={settings.summer.enabled} otherOpen={settings.winter.enabled} count={counts.summer} shared={counts.both} />
      </div>

      <form action={updateSeasonSettingsAction} className="mt-10 max-w-xl space-y-8">
        <SeasonField season="summer" defaultLabel={settings.summer.label} />
        <SeasonField season="winter" defaultLabel={settings.winter.label} />

        <button
          type="submit"
          className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
        >
          Save names
        </button>
      </form>

      <div className="mt-10 max-w-xl space-y-8">
        <SeasonTeaserImage season="summer" imageUrl={settings.summer.teaserImageUrl} label={settings.summer.label} />
        <SeasonTeaserImage season="winter" imageUrl={settings.winter.teaserImageUrl} label={settings.winter.label} />
      </div>
    </div>
  );
}

/** One season's on/off switch, with what the switch will actually do. */
function SeasonSwitch({
  season,
  name,
  open,
  otherOpen,
  count,
  shared,
}: {
  season: Season;
  name: string;
  open: boolean;
  otherOpen: boolean;
  count: number;
  shared: number;
}) {
  const lastOpen = open && !otherOpen;
  return (
    <div className={`border p-5 ${open ? "border-stone-300 bg-white" : "border-ember/40 bg-ember-100"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{name}</p>
        <span className={`text-xs font-semibold uppercase tracking-wide ${open ? "text-positive" : "text-ember"}`}>
          {open ? "Open for orders" : "Closed"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-soft">
        {open
          ? `Closing takes ${count} ${season}-only style${count === 1 ? "" : "s"} off the site. The ${shared} all-season styles stay on sale.`
          : `${count} ${season}-only style${count === 1 ? " is" : "s are"} hidden and can't be ordered.`}
      </p>
      <form action={setSeasonOpenAction.bind(null, season, !open)} className="mt-4">
        <button
          type="submit"
          disabled={lastOpen}
          className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
        >
          {open ? `Close ${season} season` : `Open ${season} season`}
        </button>
        {lastOpen && <p className="mt-2 text-xs text-ink-soft">Open the other season first: one season always stays open.</p>}
      </form>
    </div>
  );
}

function SeasonField({
  season,
  defaultLabel,
}: {
  season: "summer" | "winter";
  defaultLabel: string;
}) {
  const prefix = season === "summer" ? "summer" : "winter";
  const fallback = season === "summer" ? "Summer" : "Winter";
  return (
    <div className="border border-stone-300 bg-white p-4">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{fallback} display name</span>
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
