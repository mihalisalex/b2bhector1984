/**
 * Greek-specific language rules that a dictionary string cannot express.
 *
 * Right now that is one rule: the vocative case.
 *
 * Greek inflects a name when you address someone by it. "Γιάννης" is how the name is
 * written; "Γεια σας Γιάννης" is not how you greet him — it is "Γεια σας Γιάννη". Getting
 * this wrong is not a subtle style point to a Greek reader, it is the kind of mistake that
 * marks the sender as foreign, which is precisely what giving Greek its own domain is meant
 * to avoid.
 *
 * The transformation is mechanical for Greek personal names and is applied only to them:
 * anything not written in Greek script is returned untouched, so "Marcus" stays "Marcus".
 */

/** Names whose nominative already equals their vocative, or that these rules would break. */
const UNCHANGED_ENDINGS = [
  // Feminine names in -α / -η are identical in the vocative (Μαρία, Ελένη, Σοφία).
  "α",
  "η",
  "ω", // Αργυρώ, Φρόσω
  "ού", // Λενιώ-type / foreign transliterations
];

/**
 * Nominative -> vocative for a Greek first name.
 *
 * Covers the endings that actually occur in Greek given names:
 *   -ος -> -ο    Νίκος -> Νίκο, Γιώργος -> Γιώργο, Παύλος -> Παύλο
 *   -ης -> -η    Γιάννης -> Γιάννη, Δημήτρης -> Δημήτρη
 *   -ας -> -α    Κώστας -> Κώστα, Ανδρέας -> Ανδρέα
 *   -ές -> -έ    Θανάσης-type variants ending in -ές
 *
 * Deliberately conservative: an ending this doesn't recognise is left alone. A name in its
 * nominative form reads as slightly stiff; a name mangled by an over-eager rule reads as
 * broken, and stiff is the better failure.
 */
export function greekVocative(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;

  // Not Greek script — a Latin-alphabet name has no vocative to form.
  if (!/^[Α-Ωα-ωΆ-ώΪΫϊϋΐΰ]/.test(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();
  if (UNCHANGED_ENDINGS.some((suffix) => lower.endsWith(suffix))) return trimmed;

  if (lower.endsWith("ος")) return trimmed.slice(0, -2) + "ο";
  if (lower.endsWith("ής")) return trimmed.slice(0, -2) + "ή";
  if (lower.endsWith("ης")) return trimmed.slice(0, -2) + "η";
  if (lower.endsWith("άς")) return trimmed.slice(0, -2) + "ά";
  if (lower.endsWith("ας")) return trimmed.slice(0, -2) + "α";
  if (lower.endsWith("ές")) return trimmed.slice(0, -2) + "έ";

  return trimmed;
}

/** Words in an account's contact name that are not a person's name at all. */
const NOT_A_NAME = /^(admin|administrator|house|office|info|shop|store|team|sales|γραφείο|κατάστημα)$/i;

/**
 * The first name to greet someone by, or "" when the contact name doesn't give a usable one
 * (the email then says just "Γεια σας," / "Hi there,").
 *
 * Contact names are typed by the shops themselves, and three real ones show why this is
 * needed (2026-10-13): "House Admin" (the owner's own account), "AXIOTIS GKIAOURIDIS" (all
 * capitals), and "ΦΡΑΓΚΑΘΟΥΛΑΣ" (a surname alone, in capitals).
 *
 *   - A single word is usually a surname or a shop, and "Γεια σας Φραγκαθούλα" to a man
 *     you'd call "κύριε Φραγκαθούλα" reads wrong — so no name.
 *   - All-capital Latin is title-cased: "AXIOTIS" -> "Axiotis".
 *   - All-capital Greek gets no name: capitals drop the accent, and "Γιωργο" without its
 *     tonos is a misspelling a Greek reader notices at once.
 *   - Role words ("Admin", "Office", "Γραφείο") are never names.
 */
export function greetingFirstName(contactName: string): string {
  const words = contactName.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return "";
  const first = words[0].replace(/[.,;:]+$/, "");
  if (!first || NOT_A_NAME.test(first) || words.some((w) => NOT_A_NAME.test(w))) return "";
  const letters = first.replace(/[^A-Za-zΑ-Ωα-ωΆ-ώΪΫϊϋΐΰ]/g, "");
  if (letters.length < 2) return "";
  const isUpper = letters === letters.toUpperCase() && letters !== letters.toLowerCase();
  if (isUpper) {
    if (/[Α-ΩΆ-Ώ]/.test(letters)) return "";
    return first.charAt(0) + first.slice(1).toLowerCase();
  }
  return first;
}

