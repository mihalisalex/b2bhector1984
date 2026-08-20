import { Bodoni_Moda, Plus_Jakarta_Sans, Geist_Mono, Noto_Serif_Display, Manrope } from "next/font/google";

/**
 * TWO TYPEFACE PAIRS, chosen by language — because the Latin pair cannot set Greek.
 *
 * This was found by reading the site, not by testing it. `document.fonts.check()` returns
 * TRUE for Greek in Bodoni Moda, which is how an earlier pass concluded the typography was
 * fine. It is true and it is misleading: Bodoni Moda's Greek comes from its *math* subset,
 * where U+391-3A1 sits alongside U+1D400 mathematical alphanumerics. Those capitals are
 * drawn for equations. Set as running text they look like what they are.
 *
 * Plus Jakarta Sans is worse — it ships no Greek at all, so every line of Greek body copy
 * was silently falling back to Arial, i.e. the entire Greek site was set in a system font.
 *
 * Verified per family against the Google Fonts CSS API, counting real Greek text blocks
 * (a standalone `unicode-range` starting at U+0370) separately from math blocks:
 *
 *   Bodoni Moda         greek-text 0   math 2     <- headline bug
 *   Plus Jakarta Sans   greek-text 0   math 0     <- no Greek whatsoever
 *   Noto Serif Display  greek-text 2   math 0
 *   Manrope             greek-text 2   math 0
 *
 * The Greek pair is chosen to preserve the site's character rather than restyle it:
 * Noto Serif Display is a high-contrast display serif, the same register as the Didone it
 * stands in for, and Manrope is the geometric sans already embedded in the PDF documents —
 * so the Greek site and the Greek invoice are now set in the same face.
 */

// --- Latin pair (en / de / fr) ---------------------------------------------

export const displaySerif = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const bodySans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: "variable",
});

// --- Greek pair (el) --------------------------------------------------------

/**
 * Both declare the SAME CSS variables as their Latin counterparts. Only one pair's class is
 * ever applied to <html> (see src/app/[lang]/layout.tsx), so the variable resolves to
 * whichever pair the page is using — no cascade fight, and every `font-display` /
 * `font-body` utility in the codebase keeps working untouched.
 *
 * `latin` is included alongside `greek` deliberately: Greek pages carry Latin strings that
 * stay untranslated on purpose — style names, colourway codes like TABA, "Net 30" — and
 * without it those words would fall back to a system font mid-sentence.
 */
export const displaySerifGreek = Noto_Serif_Display({
  variable: "--font-display",
  subsets: ["greek", "latin"],
  weight: ["400", "600", "700"],
});

export const bodySansGreek = Manrope({
  variable: "--font-body",
  subsets: ["greek", "latin"],
  weight: "variable",
});

// --- Shared -----------------------------------------------------------------

/**
 * Reserved for numeric/spec-sheet details (style numbers, quantities, prices in tables).
 * Left Latin-only on purpose: it sets digits and order codes, which are Latin in every
 * locale. Greek text never lands here — and if it ever does, that is the bug, not this.
 */
export const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "variable",
});
