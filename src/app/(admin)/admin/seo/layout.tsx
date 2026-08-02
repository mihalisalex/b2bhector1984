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
          Everything that decides how this site appears in search results and on social — titles,
          descriptions, structured data, redirects and indexing policy. All of it takes effect
          without a deploy.
        </p>
      </header>
      <div className="mt-6">
        <SeoSubNav />
      </div>
      <div className="pt-8">{children}</div>
    </div>
  );
}
