"use client";

import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALES, type Locale } from "@/i18n/config";
import { stripLocale, withLocale } from "@/i18n/paths";
import { setLocaleCookie } from "@/i18n/localeCookie";
import { useDropdownPanel } from "@/components/layout/useDropdownPanel";

const LOCALE_LABEL: Record<Locale, string> = { en: "EN", de: "DE", fr: "FR", el: "EL" };
const LOCALE_NAME: Record<Locale, string> = { en: "English", de: "Deutsch", fr: "Français", el: "Ελληνικά" };

export function LanguageSwitcher() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { open, setOpen, mounted, pos, buttonRef, panelRef } = useDropdownPanel<HTMLButtonElement, HTMLDivElement>();

  function select(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    setLocaleCookie(next);
    const { path } = stripLocale(pathname);
    router.push(withLocale(next, path));
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
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                role="menuitem"
                onClick={() => select(l)}
                aria-current={l === locale ? "true" : undefined}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium ${
                  l === locale ? "bg-stone-100 text-ink" : "text-ink-soft hover:bg-stone-100 hover:text-ink"
                }`}
              >
                {LOCALE_NAME[l]}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
