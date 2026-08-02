import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { pageMetadata } from "@/lib/seo";

export function generateMetadata() {
  return pageMetadata({
    title: "Contact",
    description:
      "Get in touch with Hector 1984 Wholesale — general inquiries, new wholesale accounts, and existing buyer support.",
    path: "/contact",
  });
}

export default function ContactPage() {
  return (
    <div>
      <section className="border-b border-stone-300 bg-stone-100 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">Get in touch</span>
          <h1 className="font-display mt-4 text-4xl font-bold uppercase leading-[1.02] tracking-tight text-ink sm:text-5xl">
            Talk to a real person,
            <br />
            not a bot.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
            Every inquiry is answered by someone on the Hector 1984 team — usually within two
            business days.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-20 lg:px-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <ContactCard
            title="General Inquiries"
            body="Questions about the brand, existing orders, or anything else."
            lines={[
              { href: "mailto:wholesale@hector1984.com", label: "wholesale@hector1984.com" },
              { href: "tel:+15035550100", label: "(503) 555-0100" },
            ]}
          />
          <ContactCard
            title="New Wholesale Accounts"
            body="Ready to apply, or have questions before you do? Reach the accounts team directly."
            lines={[{ href: "mailto:newaccounts@hector1984.com", label: "newaccounts@hector1984.com" }]}
          />
          <ContactCard
            title="Existing Buyers"
            body="Already have an account? Your territory rep is listed on your dashboard and is the fastest way to reach us."
            lines={[{ href: "/dashboard", label: "Go to your dashboard" }]}
          />
        </div>
      </section>

      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
              Not a wholesale account yet?
            </h2>
            <p className="mt-1 text-sm text-stone-300/80">Applications reviewed by a real person, not a bot.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/apply" size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
              Apply for Wholesale Access
            </LinkButton>
            <LinkButton
              href="/login"
              variant="secondary"
              size="lg"
              className="!border-white !text-white hover:!bg-white hover:!text-ink"
            >
              Buyer Login
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactCard({
  title,
  body,
  lines,
}: {
  title: string;
  body: string;
  lines: { href: string; label: string }[];
}) {
  return (
    <div className="flex flex-col border border-stone-300 bg-white p-6 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(26,29,34,0.1)]">
      <h3 className="font-display text-base font-bold uppercase tracking-tight text-ink">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{body}</p>
      <div className="mt-4 flex flex-col gap-1.5 border-t border-stone-200 pt-4">
        {lines.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm font-semibold text-signal hover:underline"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
