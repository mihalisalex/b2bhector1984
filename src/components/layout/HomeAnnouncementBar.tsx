"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { stripLocale, withLocale } from "@/i18n/paths";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

const COLOR_CLASSES: Record<"black" | "burgundy", string> = {
  black: "bg-ink hover:bg-ink/85",
  burgundy: "bg-burgundy hover:bg-burgundy/85",
};

/**
 * Renders above `MarketingHeader`, not inside the homepage's own content — the ask was
 * for it to sit above the logo/nav, and `MarketingLayout` is a Server Component that
 * renders the header before `{children}`, so nothing the homepage returns can appear
 * above it. This is the layout's own top-of-page slot instead.
 *
 * `MarketingLayout` wraps every marketing route (brand story, FAQ, contact, …), not just
 * "/", so this checks the pathname itself rather than the layout deciding — a launch
 * callout belongs on the homepage, not on every page under the group.
 */
export function HomeAnnouncementBar({
  enabled,
  text,
  textEl,
  href,
  color = "black",
}: {
  enabled: boolean;
  text: string;
  /** Greek text (migration 0039). Empty falls back to `text` — the bar renders above the
   * hero on BOTH domains, so before this existed whichever language it was written in
   * was also what the other domain showed. */
  textEl: string;
  href: string;
  /** Admin-selectable on /admin/content — see COLOR_CLASSES above. */
  color?: "black" | "burgundy";
}) {
  const pathname = usePathname();
  const { locale } = useI18n();
  const copy = locale === "el" && textEl ? textEl : text;
  const { path } = stripLocale(pathname);
  if (path !== "/" || !enabled || !copy) return null;

  return (
    <Link
      href={withLocale(locale, href)}
      className={cn(
        "block px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors",
        COLOR_CLASSES[color],
      )}
    >
      {copy}
    </Link>
  );
}
