import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";
import { SUPPORT_EMAIL, SUPPORT_EMAIL_HREF } from "@/lib/contact";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const f = dict.footer;
  return (
    <footer className="border-t border-stone-300 bg-ink text-stone-200">
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          <div>
            <Logo inverted />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-300/80">{f.tagline}</p>
          </div>

          <FooterCol
            title={f.wholesale}
            locale={locale}
            links={[
              { href: "/apply", label: f.applyForAccess },
              { href: "/login", label: f.buyerLogin },
              { href: "/catalogue", label: f.catalogue },
            ]}
          />
          <FooterCol
            title={f.company}
            locale={locale}
            links={[
              { href: "/brand-story", label: f.theBrand },
              { href: "/brand-story#materials", label: f.materialsAndCraft },
              { href: "/journal", label: f.journal },
            ]}
          />
          <FooterCol
            title={f.contact}
            locale={locale}
            links={[
              { href: "/faq", label: f.faq },
              { href: "/contact", label: f.contactUs },
              { href: SUPPORT_EMAIL_HREF, label: SUPPORT_EMAIL, external: true },
            ]}
          />
          <FooterCol
            title={f.legal}
            locale={locale}
            links={[
              { href: "/terms", label: f.termsOfService },
              { href: "/privacy", label: f.privacyPolicy },
              { href: "/cookies", label: f.cookieNotice },
            ]}
          />
        </div>

        {/* All four languages live here, not in the header — de and fr are reachable but
            not advertised as equal markets. This is the only place they can be reached at
            all, and the only automatic language behaviour on the site is: none. */}
        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-stone-300/60">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span className="text-stone-300/60">{dict.languageSwitcher.label}</span>
            <LanguageSwitcher variant="footer" />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-stone-300/60 md:flex-row md:items-center md:justify-between">
          <span>{t(f.copyright, { year: new Date().getFullYear() })}</span>
          <span>{f.disclaimer}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
  locale,
}: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
  locale: Locale;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-300/60">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.external ? l.href : withLocale(locale, l.href)}
              className="text-sm text-stone-200 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
