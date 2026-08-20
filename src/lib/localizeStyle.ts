import type { Locale } from "@/i18n/config";
import type { Style } from "@/lib/types";

/**
 * Resolves a style's prose into one locale, falling back to English where no translation
 * has been written yet.
 *
 * The fallback is silent by necessity — a half-translated catalogue has to render, not show
 * blanks — but a silent fallback is exactly the kind of thing that quietly becomes
 * permanent. Two things stop that here:
 *
 *   - `hasGreekCopy` / `missingGreekFields` make the gap countable, and the admin product
 *     list badges and totals it.
 *   - The pre-launch checklist carries the count as a go/no-go item.
 *
 * Only `el` has translated columns today. de/fr fall back to English wholesale, which is
 * the honest state: nobody has written German product copy, and pretending otherwise by
 * adding empty columns for it would just add three more gaps to count.
 */
export interface LocalizedStyleCopy {
  tagline: string;
  description: string;
  materials: string[];
  lastNote: string;
}

export function localizeStyle(style: Style, locale: Locale): LocalizedStyleCopy {
  if (locale !== "el") {
    return {
      tagline: style.tagline,
      description: style.description,
      materials: style.materials,
      lastNote: style.lastNote,
    };
  }
  return {
    tagline: style.taglineEl ?? style.tagline,
    description: style.descriptionEl ?? style.description,
    materials: style.materialsEl ?? style.materials,
    lastNote: style.lastNoteEl ?? style.lastNote,
  };
}

/**
 * The fields that make a product page read as Greek.
 *
 * `tagline` and `description` are the two that decide it: they are the prose a reader and a
 * language classifier both see. `materials` and `lastNote` are short, often
 * trade-vocabulary, and a page is not English-looking for missing them — so they are
 * reported but do not make a style "missing Greek".
 */
export const GREEK_COPY_REQUIRED_FIELDS = ["tagline", "description"] as const;

export function missingGreekFields(style: Style): string[] {
  const missing: string[] = [];
  if (!style.taglineEl?.trim()) missing.push("tagline");
  if (!style.descriptionEl?.trim()) missing.push("description");
  if (!style.materialsEl?.length) missing.push("materials");
  if (style.lastNote.trim() && !style.lastNoteEl?.trim()) missing.push("lastNote");
  return missing;
}

/** True when the two fields that decide the page's language are both present. */
export function hasGreekCopy(style: Style): boolean {
  return Boolean(style.taglineEl?.trim() && style.descriptionEl?.trim());
}
