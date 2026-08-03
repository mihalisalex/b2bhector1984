import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export function Footer() {
  return (
    <footer className="border-t border-stone-300 bg-ink text-stone-200">
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          <div>
            <Logo inverted />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-300/80">
              Full-grain leather footwear, wholesaled the way serious retailers expect. Est. 1984.
            </p>
          </div>

          <FooterCol
            title="Wholesale"
            links={[
              { href: "/apply", label: "Apply for access" },
              { href: "/login", label: "Buyer login" },
              { href: "/catalogue", label: "Catalogue" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { href: "/brand-story", label: "The brand" },
              { href: "/brand-story#materials", label: "Materials & craft" },
              { href: "/journal", label: "Journal" },
            ]}
          />
          <FooterCol
            title="Contact"
            links={[
              { href: "/faq", label: "FAQ" },
              { href: "/contact", label: "Contact us" },
              { href: "mailto:info@hectorfootwear.gr", label: "info@hectorfootwear.gr" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { href: "/terms", label: "Terms of Service" },
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/cookies", label: "Cookie Notice" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-stone-300/60 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Hector Footwear Co. Wholesale accounts only.</span>
          <span>All pricing and inventory data on this site is illustrative.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-300/60">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-stone-200 transition-colors hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
