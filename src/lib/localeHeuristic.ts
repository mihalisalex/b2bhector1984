import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";

/**
 * Guess a business's language from its free-text location.
 *
 * This is the same predicate migration 0037 used to backfill `accounts.locale`, lifted into
 * code because a second caller needs it: an application that has been approved or declined
 * has no account yet and therefore no stored locale, and the admin deciding it is browsing
 * on whichever domain they happen to be on — which says nothing about the applicant. The
 * store address is the only real signal at that moment.
 *
 * The place stems are deliberately loose. The first version of this matched `heraklio` and
 * missed a live account whose address reads "Heraclion"; buyers type their own town from
 * memory, and matching only the correct spelling matches the wrong thing.
 */

const GREEK_SCRIPT = /[Ά-ώἀ-῿]/;

const GREECE_PLACE =
  /(athen|αθήν|thessalonik|salonik|θεσσαλον|herakl|heracl|irakl|iracl|ηράκλει|crete|kriti|κρήτ|patra|πάτρα|larissa|larisa|λάρισα|volos|βόλο|rhodes|rodos|ρόδο|chania|hania|χανι|ioannina|ιωάννιν|kavala|καβάλα|serres|σέρρε|katerini|κατερίν|kalamata|καλαμάτ|corfu|kerkyra|κέρκυρ|piraeus|pireas|πειραι|greece|ελλάδ|hellas)/i;

/**
 * Cyprus is Greek-speaking but is not Greece. Treated as Greek for *language* purposes —
 * which is what this function decides — while remaining a separate market question.
 */
const CYPRUS_PLACE = /(cypr|κύπρ|larnac|λάρνακ|nicosia|λευκωσ|limassol|λεμεσ|paphos|πάφο|famagusta|αμμόχωστ)/i;

export interface LocaleGuess {
  locale: Locale;
  /** False only when the evidence is unambiguous (the text is written in Greek). */
  inferred: boolean;
}

export function guessLocaleFromLocation(location: string | null | undefined): LocaleGuess {
  const text = (location ?? "").trim();
  if (!text) return { locale: DEFAULT_LOCALE, inferred: true };
  // Greek characters in an address are not a guess.
  if (GREEK_SCRIPT.test(text)) return { locale: "el", inferred: false };
  if (GREECE_PLACE.test(text)) return { locale: "el", inferred: false };
  if (CYPRUS_PLACE.test(text)) return { locale: "el", inferred: true };
  // Of the two possible errors, sending Greek to a non-Greek buyer produces a document they
  // cannot act on, so the genuinely unknown case defaults away from Greek.
  return { locale: "en", inferred: true };
}

/** A stored locale if it is valid, otherwise a guess from the location text. */
export function resolveLocale(stored: string | null | undefined, location?: string | null): Locale {
  if (stored && isLocale(stored)) return stored;
  return guessLocaleFromLocation(location).locale;
}
