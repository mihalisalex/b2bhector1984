import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Hector Footwear Wholesale.",
  robots: { index: false, follow: false },
};

interface Clause {
  q: string;
  a: string;
}

const CLAUSES: Clause[] = [
  {
    q: "Wholesale accounts only",
    a: "This site is a business-to-business ordering portal for approved wholesale buyers. Access requires an approved account; pricing, inventory, and order terms shown here are not offered to the general public.",
  },
  {
    q: "Orders and payment terms",
    a: "Placing an order is a request to purchase at the payment terms selected at checkout (prepay, net-30, or net-60). An order is confirmed once accepted — see your order's status timeline for its current state.",
  },
  {
    q: "Credit and account standing",
    a: "Each account has a credit limit and payment terms set by your territory rep. Orders that would exceed your available credit are blocked until resolved with your rep.",
  },
  {
    q: "Product information",
    a: "Materials, weights, sizing, and availability shown on this site are believed accurate at time of publishing but may change without notice ahead of production.",
  },
  {
    q: "Account security",
    a: "You're responsible for keeping your account credentials confidential and for all activity under your account. Contact your rep immediately if you suspect unauthorized access.",
  },
];

export default function TermsPage() {
  return (
    <div>
      {/* Flat, left-aligned header — matches /collections instead of the centered
          stone-100 card this used to open with. */}
      <div className="mx-auto max-w-[900px] px-6 pb-4 pt-12 lg:px-10">
        <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">Legal</span>
        <h1 className="font-display mt-2 text-3xl font-bold uppercase leading-[1.05] tracking-tight text-ink sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
          This page is illustrative, demo-appropriate boilerplate — it is not real legal advice and
          shouldn&rsquo;t be relied on as such.
        </p>
      </div>

      <section className="mx-auto max-w-[900px] px-6 py-12 lg:px-10">
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
              Questions about your account?
            </h2>
            <p className="mt-1 text-sm text-stone-300/80">
              <Link href="/contact" className="underline underline-offset-2 hover:text-white">
                Contact us
              </Link>{" "}
              — every inquiry is answered by someone on the team, usually within two business days.
            </p>
          </div>
          <LinkButton href="/faq" size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
            Read the FAQ
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
