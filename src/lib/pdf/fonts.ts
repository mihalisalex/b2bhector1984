import path from "node:path";
import { Font } from "@react-pdf/renderer";

/**
 * The PDF documents' typeface.
 *
 * Both documents used react-pdf's built-in Helvetica until now, which the file headers
 * described as a deliberate choice — "embedding custom TTFs into a server-rendered PDF is
 * real fragility". That reasoning held right up until these documents had to carry Greek.
 *
 * Helvetica is a PDF base-14 font declared `/Encoding /WinAnsiEncoding`, i.e. CP1252, which
 * contains no Greek glyphs whatsoever. react-pdf emits Greek text as CP1253 bytes against
 * that CP1252 font, so a reader draws Latin punctuation instead: "Αλεξανδρής" comes out as
 * '»µ¾±½´Á®Â. Verified by rendering a probe and decoding its content stream — this was
 * already true for any Greek business name or address on an invoice, before localisation.
 *
 * Manrope: a modern geometric sans with softly rounded terminals, chosen for legibility at
 * invoice sizes rather than character (Comfortaa is rounder and quite wrong on a tax
 * document). SIL Open Font License 1.1. Only the Greek+Latin subsets are bundled — 45 KB
 * for both weights, against 165 KB for the full variable font.
 *
 * `Font.register` is global and idempotent-ish, so this module is imported for side effect
 * by each document and the guard below keeps a double import from re-registering.
 */

export const PDF_FONT_FAMILY = "Manrope";

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  // Resolved from the process working directory rather than import.meta.url: these run
  // inside a Next server bundle where the module's own path is not the source tree's.
  const dir = path.join(process.cwd(), "src", "assets", "fonts");

  Font.register({
    family: PDF_FONT_FAMILY,
    fonts: [
      { src: path.join(dir, "Manrope-Regular.woff"), fontWeight: 400 },
      { src: path.join(dir, "Manrope-Bold.woff"), fontWeight: 700 },
    ],
  });

  // Greek has no hyphenation dictionary here, and react-pdf's default English hyphenator
  // would happily break Greek words at invalid points. Turning it off entirely is right for
  // both languages on a document this narrow — invoice cells are short strings, not prose.
  Font.registerHyphenationCallback((word) => [word]);
}
