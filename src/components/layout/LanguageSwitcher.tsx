"use client";

import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { type Locale } from "@/i18n/config";
import { stripLocale } from "@/i18n/paths";
import { urlForLocale } from "@/i18n/domains";
import { useDropdownPanel } from "@/components/layout/useDropdownPanel";

const LOCALE_LABEL: Record<Locale, string> = { en: "EN", de: "DE", fr: "FR", el: "EL" };
const LOCALE_NAME: Record<Locale, string> = { en: "English", de: "Deutsch", fr: "Français", el: "Ελληνικά" };

/**
 * The two markets that have their own domain and their own content. The header offers only
 * these — the owner's call, and a sound one: there is no evidence de/fr have ever produced
 * a customer, and putting four flags in the header signals four equal markets on a site
 * that has not earned that authority yet. de/fr stay reachable from the footer.
 */
const HEADER_LOCALES: readonly Locale[] = ["el", "en"];
const FOOTER_LOCALES: readonly Locale[] = ["el", "en", "de", "fr"];

/**
 * The ONLY way to move between hectorfootwear.gr and hectorfootwear.com.
 *
 * Three things about it are deliberate and load-bearing:
 *
 *  1. **Real `<a href>`, not `router.push`.** The client router cannot cross an origin —
 *     it would rewrite the path on the current domain and leave the visitor on .gr looking
 *     at a URL meant for .com. These are full document navigations because they have to be.
 *
 *  2. **No cookie.** The old switcher wrote `hector_locale`, which the proxy then used to
 *     redirect unprefixed requests. That machinery is gone (see src/proxy.ts): it made the
 *     same URL serve different languages to different people, which breaks caching and
 *     indexing. Nothing reads the cookie any more, so writing it would be theatre.
 *
 *  3. **The path is preserved.** Switching language from /catalogue lands on the other
 *     domain's /catalogue, not its homepage — the single most annoying thing a language
 *     switcher can do is throw away where you were.
 *
 * `rel="alternate"` + `hrefLang` mark each link as the translated equivalent, matching the
 * `<head>` hreflang set. There is no automatic geo/IP redirect anywhere in this codebase;
 * this control is the whole mechanism.
 */
export function LanguageSwitcher({ variant = "header" }: { variant?: "header" | "footer" }) {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const { open, setOpen, mounted, pos, buttonRef, panelRef } = useDropdownPanel<HTMLButtonElement, HTMLDivElement>();

  // The logical path, with any /de or /fr segment removed, so it can be re-expressed under
  // the target locale's own rule (unprefixed on .gr and for en on .com; prefixed for de/fr).
  const { path } = stripLocale(pathname);

  if (variant === "footer") {
    return (
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {FOOTER_LOCALES.map((l) => (
          <li key={l}>
            <a
              href={urlForLocale(l, path)}
              hrefLang={l}
              rel="alternate"
              aria-current={l === locale ? "true" : undefined}
              className={l === locale ? "text-ink" : "hover:text-ink"}
            >
              {LOCALE_NAME[l]}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={dict.languageSwitcher.label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 items-center px-2 text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:text-signal"
      >
        {LOCALE_LABEL[locale]}
      </button>

      {mounted &&
        open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            aria-label={dict.languageSwitcher.label}
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-50 w-44 border border-stone-300 bg-stone-50 shadow-[0_18px_44px_rgba(0,0,0,0.16)]"
          >
            {HEADER_LOCALES.map((l) => (
              <a
                key={l}
                role="menuitem"
                href={urlForLocale(l, path)}
                hrefLang={l}
                rel="alternate"
                aria-current={l === locale ? "true" : undefined}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium ${
                  l === locale ? "bg-stone-100 text-ink" : "text-ink-soft hover:bg-stone-100 hover:text-ink"
                }`}
              >
                {LOCALE_NAME[l]}
              </a>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
