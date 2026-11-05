import { SeoSubNav } from "@/components/admin/seo/SeoSubNav";

export const metadata = { title: "SEO", robots: { index: false, follow: false } };

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
          Search &amp; Discoverability
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-soft">
          Όλα όσα καθορίζουν πώς φαίνεται το site στις αναζητήσεις και στα social: τίτλοι, περιγραφές, δομημένα δεδομένα, ανακατευθύνσεις και ευρετηρίαση. Ισχύουν αμέσως.
        </p>
      </header>
      <div className="mt-6">
        <SeoSubNav />
      </div>
      <div className="pt-8">{children}</div>
    </div>
  );
}
