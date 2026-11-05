import { CatalogueDownloadButton } from "@/components/admin/CatalogueDownloadButton";
import { getSeasonSettings } from "@/lib/data/seasonSettings";
import { getAllStylesForAdmin } from "@/lib/data/styles";
import type { Season } from "@/lib/types";

export const metadata = { title: "Κατάλογος PDF", robots: { index: false } };

const SEASON_TITLE: Record<Season, string> = {
  winter: "Χειμερινή συλλογή",
  summer: "Καλοκαιρινή συλλογή",
};

export default async function AdminCataloguePage() {
  const [settings, styles] = await Promise.all([getSeasonSettings(), getAllStylesForAdmin()]);
  const active = styles.filter((s) => (s.status ?? "active") === "active" && s.colorways.length > 0);
  const seasons: Season[] = ["summer", "winter"];

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Κατάλογος PDF
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">
        Κατέβασε τον κατάλογο μιας σεζόν για να τον στείλεις σε πελάτη με email ή WhatsApp. Φτιάχνεται εκείνη τη στιγμή από
        τα προϊόντα του site, οπότε έχει πάντα τις τρέχουσες τιμές και φωτογραφίες. Μέσα είναι και τα μοντέλα που ισχύουν
        και για τις δύο σεζόν. Θέλει μερικά δευτερόλεπτα.
      </p>

      <div className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
        {seasons.map((season) => {
          const count = active.filter((s) => s.season === season || s.season === "both").length;
          return (
            <section key={season} className="border border-stone-300 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-ink">{SEASON_TITLE[season]}</h2>
                <span className="shrink-0 border border-stone-300 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
                  {settings[season].enabled ? "Ανοιχτή" : "Κλειστή"}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {settings[season].label} · {count} προϊόντα
              </p>
              <div className="mt-4 flex gap-2">
                <CatalogueDownloadButton season={season} withPrices primary />
                <CatalogueDownloadButton season={season} withPrices={false} />
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-6 max-w-xl text-xs text-ink-soft">
        Σε κάθε προϊόν μπαίνει η κύρια φωτογραφία του. Για να αλλάξεις ποια φαίνεται, διάλεξε άλλη κύρια στο προϊόν.
      </p>
    </div>
  );
}
