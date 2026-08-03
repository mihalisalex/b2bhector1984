import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

export const metadata = {
  title: "Cookie Notice",
  description: "Cookie Notice for Hector Footwear Wholesale.",
  robots: { index: false, follow: false },
};

interface CookieRow {
  name: string;
  purpose: string;
  type: string;
}

const COOKIES: CookieRow[] = [
  {
    name: "Session cookie",
    purpose: "Keeps you signed in to your wholesale account between page loads.",
    type: "Essential — required to use the site while logged in",
  },
  {
    name: "Application-in-progress cookie",
    purpose: "Tracks a submitted wholesale application so you can check its status before an account exists.",
    type: "Essential",
  },
];

export default function CookiesPage() {
  return (
    <div>
      <section className="border-b border-stone-300 bg-stone-100 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">Legal</span>
          <h1 className="font-display mt-4 text-4xl font-bold uppercase leading-[1.02] tracking-tight text-ink sm:text-5xl">
            Cookie Notice
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
            This page is illustrative, demo-appropriate boilerplate — it is not real legal advice and
            shouldn&rsquo;t be relied on as such.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-6 py-16 lg:px-10">
        <p className="max-w-[65ch] text-sm leading-relaxed text-ink-soft">
          Hector Footwear Wholesale uses a small number of essential cookies to run the ordering portal.
          We don&rsquo;t use advertising or third-party tracking cookies.
        </p>

        <div className="scroll-thin mt-8 overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5 font-semibold">Cookie</th>
                <th className="px-4 py-2.5 font-semibold">Purpose</th>
                <th className="px-4 py-2.5 font-semibold">Type</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((c) => (
                <tr key={c.name} className="border-b border-stone-200 last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-ink">{c.name}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{c.purpose}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{c.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 max-w-[65ch] text-sm leading-relaxed text-ink-soft">
          Since every cookie above is essential to signing in and placing orders, there&rsquo;s nothing
          optional to opt out of — dismissing the cookie banner just acknowledges this notice.
        </p>
      </section>

      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
              Questions about cookies or data?
            </h2>
            <p className="mt-1 text-sm text-stone-300/80">
              <Link href="/contact" className="underline underline-offset-2 hover:text-white">
                Contact us
              </Link>{" "}
              — every inquiry is answered by someone on the team, usually within two business days.
            </p>
          </div>
          <LinkButton href="/privacy" size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
            Privacy Policy
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
