import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { buildFaqSchema } from "@/lib/seoJsonLd";
import { getSeoSettings } from "@/lib/data/seoSettings";

export function generateMetadata() {
  return pageMetadata({
    title: "FAQ",
    description:
      "Answers to common questions about Hector 1984 wholesale — box-only ordering, terms-based pricing, accounts, and shipping.",
    path: "/faq",
  });
}

interface Faq {
  q: string;
  a: string;
}

interface FaqGroup {
  title: string;
  items: Faq[];
}

const GROUPS: FaqGroup[] = [
  {
    title: "Ordering & Box Policy",
    items: [
      {
        q: "Can I order single pairs?",
        a: "No — Hector 1984 sells wholesale only in fixed pre-pack boxes (8, 10, or 12 pairs), never as single pairs. Every box spans EU sizes 40–45 in a set ratio, so the box is the ordering unit, not the individual size.",
      },
      {
        q: "What if I only need a few pairs in one size?",
        a: "Every box already spreads sizes 40–45 across the printed ratio for that box type — you can't pick a single size out of a box. Choose the box size (8/10/12-pair) that best matches the size run your floor sells.",
      },
      {
        q: "Is there a minimum order?",
        a: "Yes — a single order-wide minimum of 40 pairs, not a per-style minimum. Mix as many styles, colorways, and box sizes as you like across your cart to reach it; your cart shows a running pair count as you go.",
      },
      {
        q: "What's the difference between Quick Order and the Catalog?",
        a: "Quick Order is a fast, table-style view for building box quantities across many styles at once. The Catalog and individual product pages give you the full matrix ordering screen for one style at a time, with more detail and photography.",
      },
    ],
  },
  {
    title: "Pricing & Payment Terms",
    items: [
      {
        q: "How is my price calculated?",
        a: "One simple rule, no account tiers: pay in full (prepay) for 10% off, net-30 for 5% off, or net-60 at list price. You choose your terms at checkout, and the total updates live.",
      },
      {
        q: "Can I use different payment terms on different orders?",
        a: "Yes. Your account has a default (shown on your dashboard), but you can select different terms per order at checkout. Requesting terms other than your account's default routes that order to your rep for credit approval before it ships.",
      },
      {
        q: "What currency is pricing shown in?",
        a: "All wholesale pricing on this site is in EUR (€).",
      },
      {
        q: "Are the prices I see in Quick Order or the Catalog final?",
        a: "Those screens show list price (net-60) as a reference while you build your order. The final per-pair price — with any prepay or net-30 discount applied — is calculated at checkout once you select payment terms.",
      },
    ],
  },
  {
    title: "Wholesale Accounts",
    items: [
      {
        q: "How do I get a wholesale account?",
        a: "Apply from \"Apply for Wholesale Access\" with your store and resale certificate details. Our team typically reviews applications within 2 business days. Once approved, you're provisioned with a login and a territory rep.",
      },
      {
        q: "I can't log in — what do I do?",
        a: "Reach out to your territory rep (listed on your dashboard) or wholesale@hector1984.com and we'll help sort out access.",
      },
      {
        q: "Who do I talk to about my account?",
        a: "Every approved account has a dedicated rep, shown on your dashboard with direct email and phone. That's the fastest way to reach us on anything account-specific.",
      },
    ],
  },
  {
    title: "Shipping & Delivery",
    items: [
      {
        q: "What's the difference between \"Available now\" and \"Pre-book\"?",
        a: "Available now styles ship within about 5 business days of order confirmation. Pre-book styles have a stated ship window (shown on the product page) and may arrive in a separate shipment if your order also includes at-once styles.",
      },
      {
        q: "Where do you ship?",
        a: "Shipping details vary by territory — contact your rep or wholesale@hector1984.com to confirm coverage and lead times for your location.",
      },
    ],
  },
  {
    title: "The Collection",
    items: [
      {
        q: "What categories do you carry?",
        a: "Two seasonal collections: Summer (Loafers, Wedding, Sneakers, Sandals) and Winter (Boots, Sneakers, Formal, Anatomic).",
      },
      {
        q: "Can I browse without an account?",
        a: "Yes — the Collections lookbook is open to everyone. Wholesale pricing and matrix ordering unlock once you're signed in with an approved account.",
      },
      {
        q: "Does every style come in all three box sizes?",
        a: "Not always. Each product page lists \"Sold as\" — the specific box sizes (8/10/12-pair) offered for that style.",
      },
    ],
  },
];

export default async function FaqPage() {
  // FAQPage markup makes these questions eligible for rich results. Built from
  // the same GROUPS array the page renders, so the two can never drift apart —
  // marking up an answer that isn't on the page is a policy violation.
  const settings = await getSeoSettings();
  const faqSchema = buildFaqSchema(
    GROUPS.flatMap((group) => group.items),
    settings,
  );

  return (
    <div>
      <JsonLd schema={faqSchema} />
      <section className="border-b border-stone-300 bg-stone-100 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">FAQ</span>
          <h1 className="font-display mt-4 text-4xl font-bold uppercase leading-[1.02] tracking-tight text-ink sm:text-5xl">
            Questions, answered.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
            Everything about ordering, pricing, and wholesale accounts. Can&rsquo;t find it here?
            We&rsquo;re a real team, not a bot.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-6 py-16 lg:px-10">
        <div className="flex flex-col gap-12">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="font-display border-b border-stone-300 pb-4 text-xl font-bold uppercase tracking-tight text-ink">
                {group.title}
              </h2>
              <div className="mt-2 divide-y divide-stone-200">
                {group.items.map((item) => (
                  <details key={item.q} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink marker:content-none">
                      {item.q}
                      <span
                        aria-hidden
                        className="shrink-0 font-mono-tab text-lg text-ink-soft transition-transform duration-200 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-ink-soft">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
              Still have questions?
            </h2>
            <p className="mt-1 text-sm text-stone-300/80">
              <Link href="/contact" className="underline underline-offset-2 hover:text-white">
                Contact us
              </Link>{" "}
              — every inquiry is answered by someone on the team, usually within two business days.
            </p>
          </div>
          <LinkButton href="/apply" size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
            Apply for Wholesale Access
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
