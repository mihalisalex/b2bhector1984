import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Hector Footwear Wholesale.",
  robots: { index: false, follow: false },
};

interface Clause {
  q: string;
  a: string;
}

const CLAUSES: Clause[] = [
  {
    q: "What we collect",
    a: "Business and contact details you provide when applying for or maintaining a wholesale account (business name, contact name, email, phone, resale certificate, ship-to addresses), plus order history and account activity.",
  },
  {
    q: "How we use it",
    a: "To operate your wholesale account — processing orders, applying your negotiated terms, coordinating with your territory rep, and sending order-related notifications.",
  },
  {
    q: "Who it's shared with",
    a: "Your information is used internally by Hector Footwear Wholesale and your assigned territory rep. We don't sell account data to third parties.",
  },
  {
    q: "Data retention",
    a: "Account and order records are retained for as long as your account is active, and as needed to satisfy business and accounting requirements after closure.",
  },
  {
    q: "Your choices",
    a: "You can review and update your business/contact details and ship-to addresses at any time from Account Settings, or by contacting your rep.",
  },
];

export default function PrivacyPage() {
  return (
    <div>
      <section className="border-b border-stone-300 bg-stone-100 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">Legal</span>
          <h1 className="font-display mt-4 text-4xl font-bold uppercase leading-[1.02] tracking-tight text-ink sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
            This page is illustrative, demo-appropriate boilerplate — it is not real legal advice and
            shouldn&rsquo;t be relied on as such.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-6 py-16 lg:px-10">
        <div className="divide-y divide-stone-200">
          {CLAUSES.map((clause) => (
            <div key={clause.q} className="py-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">{clause.q}</h2>
              <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-ink-soft">{clause.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
              Questions about your data?
            </h2>
            <p className="mt-1 text-sm text-stone-300/80">
              <Link href="/contact" className="underline underline-offset-2 hover:text-white">
                Contact us
              </Link>{" "}
              — every inquiry is answered by someone on the team, usually within two business days.
            </p>
          </div>
          <LinkButton href="/cookies" size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
            Cookie Notice
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
