import "server-only";
import { getPublishedJournalPosts } from "@/lib/data/journalPosts";
import type { JournalPost, Style } from "@/lib/types";
import type { Locale } from "@/i18n/config";

/**
 * Which journal articles to show under a product.
 *
 * WHY THIS EXISTS. The journal links to products constantly — a sandal guide names both
 * sandals, the winter round-up names every boot — but nothing linked back. Authority flowed
 * from the articles into the catalogue and stopped there. This closes the loop, and it does
 * so from the product's side, which is the side search engines were reaching first.
 *
 * Three tiers, in order, so the block is always relevant and never empty:
 *
 *   1. Articles that link to THIS product. The strongest signal there is — the author
 *      chose to name it — and the one a buyer reading about the 116 boot actually wants.
 *   2. Articles about this product's category, matched on the localised label's stem.
 *      "Σανδάλια" -> "σανδάλ" catches σανδάλι and σανδάλια; "Boots" -> "boot" catches boots
 *      and bootie. Crude, but it is a relevance nudge, not a classifier, and the heading
 *      says "guides" rather than promising a match.
 *   3. The most recent articles in this language, so a product with no coverage yet still
 *      hands the crawler somewhere to go.
 *
 * Reads only this locale's posts. A Greek product page listing English guides would be the
 * "domain reads as English" signal the journal query warns about.
 */
export async function getGuidesForStyle(
  style: Style,
  locale: Locale,
  categoryLabel: string,
  limit = 3,
): Promise<JournalPost[]> {
  const posts = await getPublishedJournalPosts(locale);
  if (posts.length === 0) return [];

  const productHref = `/product/${style.slug}`;
  // Accent-insensitive on purpose. Greek moves the stress as a word inflects — «μπότες»
  // carries it on the ο, «μποτάκι» on the ά — so a stem taken from the label with its
  // accent intact ("μπότ") matched the boots category in exactly one article and missed
  // the winter round-up that names four boots. Folding diacritics first makes the stem
  // "μποτ", which finds both. Umlauts and French accents fold the same way.
  const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const stem = fold(categoryLabel).replace(/.{2}$/, "");
  // How many times the category is mentioned, not whether. A sandal guide that says
  // "a boot that did not sell in November" once should not outrank the winter round-up
  // that names four boots — ranking by count is what keeps the block about the product.
  const categoryMentions = (p: JournalPost) =>
    stem.length >= 3 ? fold(`${p.title} ${p.tags.join(" ")} ${p.contentHtml}`).split(stem).length - 1 : 0;

  const seen = new Set<string>();
  const picked: JournalPost[] = [];
  const take = (candidates: JournalPost[]) => {
    for (const p of candidates) {
      if (picked.length >= limit) return;
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      picked.push(p);
    }
  };

  take(posts.filter((p) => p.contentHtml.includes(productHref)));
  take(
    posts
      .map((p) => ({ p, n: categoryMentions(p) }))
      .filter(({ n }) => n > 0)
      .sort((a, b) => b.n - a.n)
      .map(({ p }) => p),
  );
  take(posts);
  return picked;
}
