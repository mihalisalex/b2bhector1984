import type { Category, Style } from "@/lib/types";

/**
 * Understands the words buyers actually type — Greek first — and maps them to categories,
 * colours and materials.
 *
 * The database's full-text index is English-only and product names are English, so on
 * hectorfootwear.gr a search for "μπότα" or "μοκασίνι" used to return nothing (buyer audit,
 * 2026-09-25). Words are compared without accents and by stem, so "μπότα", "μπότες",
 * "μποτάκια" all mean boots, and several words narrow together: "μαύρη μπότα" is black
 * boots, "5109 καφέ" is the brown 5109.
 */

type Concept =
  | { kind: "category"; value: Category[] }
  | { kind: "colour"; value: string[] }
  | { kind: "material"; value: "suede" }
  | { kind: "ignore" };

/** Stem → meaning. A search word matches a stem when either starts with the other (≥3 letters). */
const LEXICON: [string[], Concept][] = [
  [["μποτ", "μπωτ", "boot", "chelsea", "τσελσ", "αρβυλ", "ankle", "stiefel", "bott"], { kind: "category", value: ["boots"] }],
  [["μοκασ", "loafer", "boat", "ιστιοπλ", "espadr", "εσπαντρ", "slipon", "slip-on", "mokass", "mocass"], { kind: "category", value: ["loafers"] }],
  [["σανδαλ", "πεδιλ", "sandal", "slide", "sanda"], { kind: "category", value: ["sandals"] }],
  [["sneak", "αθλητ", "σνικ", "trainer", "casual", "basket"], { kind: "category", value: ["sneakers"] }],
  [["επισημ", "δετ", "κορδον", "oxford", "derby", "formal", "dress", "κλασικ", "γαμπρ", "γαμο", "γαμου", "wedding", "groom", "νυφ", "business", "classiq"], { kind: "category", value: ["formal", "wedding"] }],
  [["ανατομ", "anatom", "comfort"], { kind: "category", value: ["anatomic"] }],
  [["μαυρ", "black", "schwarz", "noir"], { kind: "colour", value: ["black"] }],
  [["καφε", "brown", "braun", "marron", "σοκολα"], { kind: "colour", value: ["brown", "tan brown"] }],
  [["ταμπα", "taba", "tan", "κονιακ", "cognac", "camel"], { kind: "colour", value: ["taba", "tan", "tan brown"] }],
  [["μπεζ", "beige", "κρεμ", "cream", "sand", "αμμου"], { kind: "colour", value: ["beige"] }],
  [["μπλε", "blue", "navy", "μαρεν", "blau", "bleu"], { kind: "colour", value: ["blue"] }],
  [["γκρι", "grey", "gray", "grau", "gris"], { kind: "colour", value: ["grey"] }],
  [["καστορ", "σουετ", "suede", "nubuck", "velour", "wildled", "daim"], { kind: "material", value: "suede" }],
  // Words that describe the whole catalogue and so narrow nothing.
  [["δερμ", "leather", "leder", "cuir", "παπουτσ", "υποδημ", "ανδρ", "shoe", "schuh", "chauss", "men", "herren", "homme", "ζευγ", "χονδρ", "wholesale", "γνησ", "genuine"], { kind: "ignore" }],
];

export function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ς/g, "σ");
}

function conceptFor(word: string): Concept | null {
  if (word.length < 3) return null;
  for (const [stems, concept] of LEXICON) {
    for (const stem of stems) {
      const s = normalizeSearch(stem);
      if (word.startsWith(s) || (word.length >= 4 && s.startsWith(word))) return concept;
    }
  }
  return null;
}

function haystack(style: Style): string {
  return normalizeSearch(
    [style.name, style.styleNumber, style.description ?? "", style.descriptionEl ?? "", ...(style.materials ?? []), ...(style.materialsEl ?? [])].join(" "),
  );
}

/**
 * The styles matching `query`, or `null` when none of its words were recognised (the caller
 * then falls back to the database's full-text search). Every recognised kind must match —
 * category AND colour AND material — while words of the same kind widen ("μπότα μοκασίνι").
 * Other words (style numbers, "groomshoes") must appear in the product's own text.
 */
export function matchStylesBySynonyms(query: string, styles: Style[]): Set<string> | null {
  const words = normalizeSearch(query).split(/[^\p{L}\p{N}-]+/u).filter(Boolean);
  const categories = new Set<Category>();
  const colours = new Set<string>();
  let suede = false;
  const literal: string[] = [];
  let recognised = false;

  for (const word of words) {
    const concept = conceptFor(word);
    if (!concept) {
      literal.push(word);
      continue;
    }
    recognised = true;
    if (concept.kind === "category") concept.value.forEach((c) => categories.add(c));
    else if (concept.kind === "colour") concept.value.forEach((c) => colours.add(c));
    else if (concept.kind === "material") suede = true;
  }
  if (!recognised) return null;

  const ids = new Set<string>();
  for (const style of styles) {
    if (categories.size && !categories.has(style.category)) continue;
    if (colours.size) {
      const names = style.colorways.map((c) => normalizeSearch(c.name));
      if (!names.some((n) => colours.has(n) || [...colours].some((c) => n.includes(c)))) continue;
    }
    const text = haystack(style);
    if (suede && !/suede|καστορ|σουετ/.test(text)) continue;
    if (literal.length && !literal.every((w) => text.includes(w))) continue;
    ids.add(style.id);
  }
  return ids;
}
