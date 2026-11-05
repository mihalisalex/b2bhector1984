import Link from "next/link";
import { runSeoAudit, type IssueSeverity, type SeoIssue } from "@/lib/seoAudit";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * The SEO overview: a real audit of real data, with the highest-severity
 * problems first.
 *
 * Two things are stated plainly rather than faked, because a dashboard that
 * shows a confident zero for something it can't measure is worse than one that
 * admits the gap:
 *   - Indexed-page counts and impressions need a Search Console API
 *     credential this project doesn't have.
 *   - External broken-link checking needs a crawler.
 */
export default async function SeoOverviewPage() {
  const [report, settings] = await Promise.all([runSeoAudit(), getSeoSettings()]);

  return (
    <div className="space-y-8">
      {!report.schemaReady && (
        <div className="border border-ember bg-ember/5 px-4 py-3 text-sm text-ink">
          <p className="font-semibold">The SEO schema migration hasn&rsquo;t been run yet.</p>
          <p className="mt-1 text-ink-soft">
            Run <code className="font-mono-tab">supabase/migrations/0025_seo_platform.sql</code> in the
            Supabase SQL Editor. Until then, settings and redirects can&rsquo;t be saved, and the audit
            below only reflects the fields that already existed.
          </p>
        </div>
      )}

      <IndexingPolicyCard indexable={settings.commerceIndexable} robotsEnabled={settings.robotsEnabled} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreTile score={report.overallScore} />
        <Tile label="Κρίσιμα" value={report.counts.critical} tone={report.counts.critical > 0 ? "bad" : "good"} />
        <Tile label="Προειδοποιήσεις" value={report.counts.warning} tone={report.counts.warning > 0 ? "warn" : "good"} />
        <Tile label="Σημειώσεις" value={report.counts.notice} tone="neutral" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Προϊόντα που ελέγχθηκαν" value={report.counts.productsAudited} tone="neutral" />
        <Tile label="Δημόσιες σελίδες" value={report.counts.pagesAudited} tone="neutral" />
        <Tile
          label="Φωτογραφίες χωρίς περιγραφή"
          value={`${report.counts.imagesMissingAlt} / ${report.counts.imagesAudited}`}
          tone={report.counts.imagesMissingAlt > 0 ? "warn" : "good"}
        />
        <Tile
          label="Ανακατευθύνσεις"
          value={`${report.counts.redirects}${report.counts.redirectsDisabled ? ` (${report.counts.redirectsDisabled} off)` : ""}`}
          tone="neutral"
        />
      </section>

      <IssueList issues={report.issues} />

      <section>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">Βαθμολογία σελίδων</h2>
        <p className="mt-1 text-sm text-ink-soft">Οι χαμηλότερες πρώτες: αυτές αξίζει να διορθωθούν.</p>
        <div className="scroll-thin mt-4 overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-stone-300 bg-stone-50 text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">Σελίδα</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">URL</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Προβλήματα</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Βαθμός</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Διόρθωση</th>
              </tr>
            </thead>
            <tbody>
              {report.pages.map((page) => (
                <tr key={`${page.kind}:${page.id}`} className="border-b border-stone-200 last:border-0">
                  <td className="px-4 py-2.5 text-ink">{page.label}</td>
                  <td className="px-4 py-2.5 font-mono-tab text-xs text-ink-soft">{page.path}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{page.issues.length || "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <ScorePill score={page.score} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={page.editHref} className="text-xs underline underline-offset-2 hover:text-ink">
                      Επεξεργασία
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-stone-300 bg-white px-4 py-3 text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Τι δεν δείχνει αυτή η σελίδα</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
          <li>
            <strong className="text-ink">Σελίδες στο ευρετήριο, εμφανίσεις και κλικ</strong>: έρχονται από το Google Search Console, για το οποίο δεν υπάρχει σύνδεση εδώ. Βάλε τον κωδικό επαλήθευσης στις γενικές ρυθμίσεις και δες τα νούμερα στο ίδιο το Search Console.
          </li>
          <li>
            <strong className="text-ink">Χαλασμένα εξωτερικά links</strong>: θέλουν έλεγχο του site απ' έξω. Ο παραπάνω έλεγχος καλύπτει μόνο τους εσωτερικούς προορισμούς ανακατευθύνσεων.
          </li>
          <li>
            <strong className="text-ink">Έλεγχος δομημένων δεδομένων</strong>: το JSON-LD βγαίνει από τα πραγματικά δεδομένα, αλλά τον τελικό λόγο τον έχει η Google. Η ενότητα SEO κάθε προϊόντος έχει link στο Rich Results Test.
          </li>
        </ul>
        <p className="mt-3 text-ink-soft">
          Αρχεία:{" "}
          <a href={`${SITE_URL}/robots.txt`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            robots.txt
          </a>{" "}
          ·{" "}
          <a href={`${SITE_URL}/sitemap.xml`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            sitemap.xml
          </a>
        </p>
      </section>
    </div>
  );
}

function IndexingPolicyCard({ indexable, robotsEnabled }: { indexable: boolean; robotsEnabled: boolean }) {
  if (!robotsEnabled) {
    return (
      <div className="border border-ember bg-ember/5 px-4 py-3 text-sm">
        <p className="font-semibold text-ink">Όλο το site είναι κλειδωμένο για τις μηχανές αναζήτησης.</p>
        <p className="mt-1 text-ink-soft">
          Το robots.txt δίνει <code className="font-mono-tab">Disallow: /</code>. Ενεργοποίησέ το ξανά στις γενικές ρυθμίσεις, εκτός αν πρόκειται για δοκιμαστικό domain.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-stone-300 bg-white px-4 py-3 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Πολιτική ευρετηρίασης</p>
      {indexable ? (
        <p className="mt-1.5 text-ink">
          <strong>Ο κατάλογος είναι δημόσιος.</strong> Κατάλογος και προϊόντα εμφανίζονται στο robots.txt και στο sitemap και επιτρέπεται η ευρετηρίαση, άρα <strong>οι χονδρικές τιμές μπορεί να φανούν στις αναζητήσεις.</strong> Είναι σωστό μόνο αν το θέλεις συνειδητά.
        </p>
      ) : (
        <p className="mt-1.5 text-ink">
          <strong>Ο κατάλογος είναι ιδιωτικός</strong>, που είναι το σωστό για χονδρική. Κατάλογος και προϊόντα αποκλείονται στο robots.txt, μένουν έξω από το sitemap και έχουν <code className="font-mono-tab">noindex</code>. Τα πεδία SEO τους καθορίζουν μόνο την προεπισκόπηση όταν στέλνεις το link με email ή WhatsApp.
        </p>
      )}
      <Link
        href="/admin/seo/settings?section=indexing"
        className="mt-2 inline-block text-xs underline underline-offset-2 hover:text-ink"
      >
        Αλλαγή πολιτικής ευρετηρίασης
      </Link>
    </div>
  );
}

function ScoreTile({ score }: { score: number }) {
  return (
    <div className="border border-stone-300 bg-ink px-4 py-3 text-white">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Συνολική βαθμολογία SEO</p>
      <p className="mt-1 font-display text-3xl font-bold">{score}</p>
      <p className="text-xs text-white/70">στα 100, μέσος όρος όλων των σελίδων</p>
    </div>
  );
}

const TONE_STYLES = {
  good: "text-positive",
  warn: "text-signal",
  bad: "text-ember",
  neutral: "text-ink",
} as const;

function Tile({ label, value, tone }: { label: string; value: number | string; tone: keyof typeof TONE_STYLES }) {
  return (
    <div className="border border-stone-300 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${TONE_STYLES[tone]}`}>{value}</p>
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const tone = score >= 90 ? "bg-positive" : score >= 70 ? "bg-signal" : "bg-ember";
  return (
    <span className={`inline-block min-w-10 px-2 py-0.5 text-center text-xs font-semibold text-white ${tone}`}>
      {score}
    </span>
  );
}

const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  notice: "Notice",
};

const SEVERITY_STYLES: Record<IssueSeverity, string> = {
  critical: "bg-ember text-white",
  warning: "bg-signal text-white",
  notice: "bg-stone-300 text-ink",
};

function IssueList({ issues }: { issues: SeoIssue[] }) {
  if (issues.length === 0) {
    return (
      <section className="border border-positive bg-positive/5 px-4 py-3 text-sm text-ink">
        Κανένα πρόβλημα SEO.
      </section>
    );
  }

  // The full list can run to hundreds of notices on a big catalogue; the top 40
  // (already severity-sorted) is what an admin will actually work through in
  // one sitting, and the count makes the truncation explicit rather than silent.
  const shown = issues.slice(0, 40);

  return (
    <section>
      <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">
        Προβλήματα <span className="text-ink-soft">({issues.length})</span>
      </h2>
      <p className="mt-1 text-sm text-ink-soft">Τα σοβαρότερα πρώτα.</p>
      <ul className="mt-4 divide-y divide-stone-200 border border-stone-300 bg-white">
        {shown.map((issue, index) => (
          <li key={`${issue.code}-${issue.entityLabel}-${index}`} className="flex flex-wrap items-start gap-3 px-4 py-3">
            <span
              className={`mt-0.5 shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SEVERITY_STYLES[issue.severity]}`}
            >
              {SEVERITY_LABEL[issue.severity]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{issue.title}</p>
              <p className="text-sm text-ink-soft">{issue.detail}</p>
              <p className="mt-0.5 text-xs text-ink-soft">{issue.entityLabel}</p>
            </div>
            {issue.fixHref && (
              <Link href={issue.fixHref} className="shrink-0 text-xs underline underline-offset-2 hover:text-ink">
                Διόρθωση
              </Link>
            )}
          </li>
        ))}
      </ul>
      {issues.length > shown.length && (
        <p className="mt-2 text-xs text-ink-soft">
          Showing the {shown.length} most severe of {issues.length}. Fix these and reload to see the rest.
        </p>
      )}
    </section>
  );
}
