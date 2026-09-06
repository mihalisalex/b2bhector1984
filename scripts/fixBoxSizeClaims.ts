/**
 * Corrects the box-size claim across every article that carries it.
 *
 *   npx tsx scripts/fixBoxSizeClaims.ts           # dry run, prints a diff per article
 *   npx tsx scripts/fixBoxSizeClaims.ts --apply   # writes
 *
 * WHAT WAS WRONG. Articles said wholesale orders ship in "8, 10, or 12 pairs" and that the
 * buyer chooses the box size that suits their size curve, with the run given as EU 40–45.
 * Three things are false in that, and `styles.available_box_types` — the column
 * `getAvailableBoxTypes` filters the ordering grid by — says so:
 *
 *   1. No style offers a choice. Every one of the 31 active styles has exactly ONE entry in
 *      available_box_types. A buyer never picks a format; the style determines it.
 *   2. The 12-pair box is used by NO style. It exists in the box_types table and nowhere else.
 *   3. EU 40–45 is only half true. 16 styles use the 10-pair box, which runs 40–45. The other
 *      15 use the 8-pair box, which stops at 44.
 *
 * Six of the articles being corrected here were written earlier today, and repeated the
 * error because they followed the framing of the older ones instead of checking the column.
 * The correction states what a buyer actually meets: one box per style, either 8 pairs
 * (40–44) or 10 (40–45), and check which before committing.
 *
 * Every replacement is an exact string match and the script refuses to write anything if a
 * single one has drifted — a partial pass across fourteen articles in four languages would
 * be worse than none.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

type Edit = [slug: string, from: string, to: string];

const EDITS: Edit[] = [
  // ---------------------------------------------------------------- pre-existing articles
  [
    "how-to-place-a-wholesale-order-step-by-step",
    "<p>Hector Footwear sells wholesale only in fixed pre-pack boxes — 8, 10, or 12 pairs — spread across a set EU 40–45 size ratio, so the box is the ordering unit, not the individual size.",
    "<p>Hector Footwear sells wholesale only in fixed pre-pack boxes, so the box is the ordering unit, not the individual size. Each style ships in one box size, shown on its product page: currently either an 8-pair box running EU 40–44, or a 10-pair box running EU 40–45.",
  ],
  [
    "complete-guide-to-buying-wholesale-leather-footwear",
    "<p>Most wholesale leather footwear ships in fixed pre-pack boxes — commonly 8, 10, or 12 pairs — spread across a set size run (in Hector Footwear's case, EU 40–45). You choose the box size that matches how your floor's size curve actually sells, not an individual size.</p>",
    "<p>Most wholesale leather footwear ships in fixed pre-pack boxes — commonly 8, 10 or 12 pairs — spread across a set size run. The supplier normally assigns one box format per style rather than letting you pick: at Hector Footwear, a style ships either in an 8-pair box running EU 40–44 or a 10-pair box running EU 40–45, and the product page says which. You are buying a slice of the size curve, not an individual size.</p>",
  ],
  [
    "box-only-ordering-explained",
    "<p>Rather than fighting the box structure, use it: choose the box size (8, 10, or 12 pairs) that best matches your store's typical size curve for that category, and lean on an order-wide minimum rather than a per-style one to mix styles and colorways flexibly across a single order.</p>",
    "<p>Rather than fighting the box structure, use it. The box format is set per style by the supplier rather than chosen at checkout — at Hector Footwear that is an 8-pair box (EU 40–44) or a 10-pair box (EU 40–45), shown on each product page — so the lever you actually control is which styles and colourways you combine. Lean on an order-wide minimum rather than a per-style one to mix them freely across a single order.</p>",
  ],
  [
    "odigos-agoras-dermatinon-andrikon-papoutsion-chondrikis",
    "<p>Τα περισσότερα δερμάτινα ανδρικά παπούτσια χονδρικής αποστέλλονται σε σταθερά προσυσκευασμένα κιβώτια — συνήθως 8, 10 ή 12 ζευγάρια — με συγκεκριμένη αναλογία μεγεθών (στην περίπτωση της Hector Footwear, ευρωπαϊκά νούμερα 40–45). Επιλέγετε το μέγεθος κιβωτίου που ταιριάζει καλύτερα στην πραγματική καμπύλη πωλήσεων του καταστήματός σας, όχι ένα μεμονωμένο νούμερο.</p>",
    "<p>Τα περισσότερα δερμάτινα ανδρικά παπούτσια χονδρικής αποστέλλονται σε σταθερά προσυσκευασμένα κιβώτια — συνήθως 8, 10 ή 12 ζευγάρια — με συγκεκριμένη αναλογία μεγεθών. Το μέγεθος του κιβωτίου το ορίζει συνήθως ο προμηθευτής ανά μοντέλο και δεν το επιλέγετε εσείς: στη Hector Footwear κάθε μοντέλο πωλείται είτε σε κιβώτιο 8 ζευγαριών με νούμερα 40–44 είτε σε κιβώτιο 10 ζευγαριών με νούμερα 40–45, και η σελίδα του προϊόντος δείχνει ποιο ισχύει. Αγοράζετε ένα κομμάτι ολόκληρης της καμπύλης μεγεθών, όχι ένα μεμονωμένο νούμερο.</p>",
  ],
  [
    "cheimerina-andrika-papoutsia-chondriki-top-4-montela",
    "<p>Όλα τα μοντέλα πωλούνται σε σταθερά προσυσκευασμένα κιβώτια με ευρωπαϊκά νούμερα 40–45.",
    "<p>Όλα τα μοντέλα πωλούνται σε σταθερά προσυσκευασμένα κιβώτια πλήρους σειράς μεγεθών — κιβώτιο 8 ζευγαριών με νούμερα 40–44 ή 10 ζευγαριών με νούμερα 40–45, ανάλογα με το μοντέλο.",
  ],
  [
    "seires-megethon-chondriki-andrika-dermatina-papoutsia",
    "<p>Τα κιβώτια κυκλοφορούν συνήθως σε 8, 10 ή 12 ζευγάρια. Ο κανόνας είναι απλός:",
    "<p>Τα κιβώτια κυκλοφορούν συνήθως σε 8, 10 ή 12 ζευγάρια — αν και ο κάθε προμηθευτής δεν προσφέρει απαραίτητα και τα τρία, και συνήθως ορίζει ένα ανά μοντέλο αντί να σας αφήνει να διαλέξετε (στη Hector Footwear είναι 8 ή 10 ζευγάρια, ανά μοντέλο). Ο κανόνας πάντως είναι απλός:",
  ],

  // ------------------------------------------------- articles written earlier today (mine)
  [
    "winter-buy-mens-leather-boots-and-formal-shoes",
    `<p>We sell by the box, not the pair, and each box is a fixed size run. There are three:</p>
<ul>
<li><strong>8 pairs</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 pairs</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
<li><strong>12 pairs</strong> — EU 40×1, 41×2, 42×3, 43×3, 44×2, 45×1</li>
</ul>
<p>The practical difference is the top of the run: the 8-pair box stops at 44, the other two carry a 45. If your customer base skews larger, the 10 and 12 are the boxes to build on.</p>`,
    `<p>We sell by the box, not the pair, and each box is a fixed size run. Every style ships in <strong>one</strong> box format, set by us and shown on its product page — there is no format to choose at checkout. Across the current range that is either:</p>
<ul>
<li><strong>An 8-pair box</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>A 10-pair box</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
</ul>
<p>The practical difference is the top of the run: the 8-pair box stops at 44, the 10-pair carries a 45. If your customer base skews larger, check which box a style uses before you commit to it — on the winter side the 116 boots and the 272 and 372 formals are 8-pair, and the 5109 boots are 10-pair.</p>`,
  ],
  [
    "kalokairini-paraggelia-andrika-dermatina-papoutsia-chondriki",
    `<p>Πουλάμε ανά κιβώτιο, όχι ανά ζευγάρι, και κάθε κιβώτιο είναι πλήρης σειρά μεγεθών:</p>
<ul>
<li><strong>8 ζεύγη</strong> — 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 ζεύγη</strong> — 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
<li><strong>12 ζεύγη</strong> — 40×1, 41×2, 42×3, 43×3, 44×2, 45×1</li>
</ul>
<p>Η ουσιαστική διαφορά είναι η κορυφή της σειράς: το κιβώτιο των 8 σταματά στο 44, τα άλλα δύο φτάνουν στο 45.</p>`,
    `<p>Πουλάμε ανά κιβώτιο, όχι ανά ζευγάρι, και κάθε κιβώτιο είναι πλήρης σειρά μεγεθών. Κάθε μοντέλο πωλείται σε <strong>ένα</strong> μέγεθος κιβωτίου, που το ορίζουμε εμείς και φαίνεται στη σελίδα του προϊόντος — δεν επιλέγετε εσείς μορφή στο ταμείο. Στην τρέχουσα γκάμα είναι είτε:</p>
<ul>
<li><strong>Κιβώτιο 8 ζευγαριών</strong> — 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>Κιβώτιο 10 ζευγαριών</strong> — 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
</ul>
<p>Η ουσιαστική διαφορά είναι η κορυφή της σειράς: το κιβώτιο των 8 σταματά στο 44, των 10 φτάνει στο 45. Στα καλοκαιρινά, τα σανδάλια YKT09, τα boat YKT06 και οι εσπαντρίγιες 035 είναι κιβώτια 10 ζευγαριών· τα 1013 και 692 loafers είναι 8.</p>`,
  ],
  [
    "grosshandel-herren-lederschuhe-aus-griechenland",
    `<p>Wir verkaufen ausschließlich in vollen Größenläufen. Es gibt drei Kartongrößen, und die Aufteilung ist fest:</p>
<ul>
<li><strong>8 Paar</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 Paar</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
<li><strong>12 Paar</strong> — EU 40×1, 41×2, 42×3, 43×3, 44×2, 45×1</li>
</ul>
<p>Für den deutschen Markt ist das relevanteste Detail das obere Ende: der 8-Paar-Karton endet bei 44, die beiden größeren führen eine 45. Deutsche Kundschaft fällt im Schnitt größer aus als die südeuropäische, für die diese Läufe ursprünglich geschnitten wurden — planen Sie eher mit dem 10er- und dem 12er-Karton.</p>`,
    `<p>Wir verkaufen ausschließlich in vollen Größenläufen. Jedes Modell hat <strong>einen</strong> festen Karton, den wir vorgeben und der auf der Produktseite steht — eine Kartongröße wird nicht ausgewählt. Im aktuellen Sortiment ist das entweder:</p>
<ul>
<li><strong>8 Paar</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 Paar</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
</ul>
<p>Für den deutschen Markt ist das relevanteste Detail das obere Ende: der 8-Paar-Karton endet bei 44, der 10-Paar-Karton führt eine 45. Deutsche Kundschaft fällt im Schnitt größer aus als die südeuropäische, für die diese Läufe ursprünglich geschnitten wurden — prüfen Sie daher vor der Order, welchen Karton ein Modell hat.</p>`,
  ],
  [
    "kartonweise-bestellen-groessenlauf-grosshandel",
    `<p>Ein Karton ist ein Modell in einer Farbe, aufgeteilt auf einen festen Größenlauf. Wir führen drei:</p>
<ul>
<li><strong>8 Paar</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 Paar</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
<li><strong>12 Paar</strong> — EU 40×1, 41×2, 42×3, 43×3, 44×2, 45×1</li>
</ul>`,
    `<p>Ein Karton ist ein Modell in einer Farbe, aufgeteilt auf einen festen Größenlauf. Jedes Modell hat genau einen; im aktuellen Sortiment sind das zwei Formate:</p>
<ul>
<li><strong>8 Paar</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 Paar</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
</ul>`,
  ],
  [
    "kartonweise-bestellen-groessenlauf-grosshandel",
    "<p>Ein Detail, das im deutschsprachigen Raum zählt: der 8-Paar-Karton endet bei EU 44, der 10er und der 12er führen eine 45. Fällt Ihre Kundschaft groß aus, ist das der entscheidende Unterschied zwischen den Kartongrößen — nicht der Stückpreis.</p>",
    "<p>Ein Detail, das im deutschsprachigen Raum zählt: der 8-Paar-Karton endet bei EU 44, der 10-Paar-Karton führt eine 45. Fällt Ihre Kundschaft groß aus, lohnt der Blick auf die Produktseite, bevor Sie ein Modell einlisten — der Karton gehört zum Modell und lässt sich nicht tauschen.</p>",
  ],
  [
    "grossiste-chaussures-cuir-homme-grece",
    `<p>Nous vendons uniquement en séries de tailles complètes. Trois formats, à répartition fixe :</p>
<ul>
<li><strong>8 paires</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 paires</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
<li><strong>12 paires</strong> — EU 40×1, 41×2, 42×3, 43×3, 44×2, 45×1</li>
</ul>
<p>Le détail qui compte est le haut de la série : le carton de 8 s'arrête au 44, les deux autres montent au 45. Selon votre clientèle, c'est souvent ce critère — et non le prix unitaire — qui décide du format.</p>`,
    `<p>Nous vendons uniquement en séries de tailles complètes. Chaque modèle a <strong>un seul</strong> format de carton, que nous fixons et qui figure sur sa fiche produit : il n'y a pas de format à choisir. Dans la collection actuelle, c'est soit :</p>
<ul>
<li><strong>8 paires</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 paires</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
</ul>
<p>Le détail qui compte est le haut de la série : le carton de 8 s'arrête au 44, celui de 10 monte au 45. Si votre clientèle chausse grand, vérifiez le format d'un modèle sur sa fiche avant de le référencer.</p>`,
  ],
  [
    "commander-par-carton-serie-de-tailles",
    `<p>Un carton, c'est un modèle dans un coloris, réparti sur une série de tailles fixe. Nous en avons trois :</p>
<ul>
<li><strong>8 paires</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 paires</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
<li><strong>12 paires</strong> — EU 40×1, 41×2, 42×3, 43×3, 44×2, 45×1</li>
</ul>`,
    `<p>Un carton, c'est un modèle dans un coloris, réparti sur une série de tailles fixe. Chaque modèle en a exactement un ; la collection actuelle en compte deux formats :</p>
<ul>
<li><strong>8 paires</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 paires</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
</ul>`,
  ],
  [
    "commander-par-carton-serie-de-tailles",
    "<p>Un détail à retenir : le carton de 8 s'arrête au 44, ceux de 10 et de 12 montent au 45. Si votre clientèle chausse grand, c'est là que se joue la différence entre les formats, davantage que sur le prix unitaire.</p>",
    "<p>Un détail à retenir : le carton de 8 s'arrête au 44, celui de 10 monte au 45. Si votre clientèle chausse grand, regardez la fiche produit avant de référencer un modèle — le format appartient au modèle et ne se change pas.</p>",
  ],
  // The two sandal articles said the single box was unusual. It is not: it is how the whole
  // catalogue works, and saying otherwise implied a choice that exists nowhere.
  [
    "mens-leather-sandals-wholesale-buyers-guide",
    "<p>We sell by the box, never by the pair. Unlike the rest of our catalogue, the sandals are offered in <strong>one box size only — 10 pairs</strong>, in a fixed run:</p>",
    "<p>We sell by the box, never by the pair, and every style has one fixed box format rather than a choice of them. For the sandals that is the <strong>10-pair box</strong>, in a fixed run:</p>",
  ],
  [
    "andrika-dermatina-sandalia-chondriki-odigos",
    "<p>Πουλάμε ανά κιβώτιο, ποτέ ανά ζευγάρι. Σε αντίθεση με την υπόλοιπη γκάμα, τα σανδάλια διατίθενται σε <strong>ένα μόνο μέγεθος κιβωτίου — 10 ζεύγη</strong>, σε σταθερή σειρά:</p>",
    "<p>Πουλάμε ανά κιβώτιο, ποτέ ανά ζευγάρι, και κάθε μοντέλο έχει ένα σταθερό μέγεθος κιβωτίου αντί για επιλογή. Για τα σανδάλια αυτό είναι το <strong>κιβώτιο των 10 ζευγαριών</strong>, σε σταθερή σειρά:</p>",
  ],
];

async function main() {
  const apply = process.argv.includes("--apply");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const slugs = [...new Set(EDITS.map((e) => e[0]))];
  const { data: rows, error } = await db.from("journal_posts").select("slug,content_html").in("slug", slugs);
  if (error) throw error;

  const bodies = new Map<string, string>();
  for (const r of rows ?? []) bodies.set((r as { slug: string }).slug, (r as { content_html: string }).content_html);

  let failed = 0;
  for (const [slug, from] of EDITS) {
    const body = bodies.get(slug);
    if (body === undefined) {
      console.log(`  MISSING ARTICLE ${slug}`);
      failed++;
      continue;
    }
    const hits = body.split(from).length - 1;
    if (hits !== 1) {
      console.log(`  NO MATCH (${hits}) in ${slug} for: ${from.slice(0, 80).replace(/\n/g, " ")}…`);
      failed++;
    }
  }
  if (failed > 0) {
    console.log(`\n${failed} replacement(s) did not match exactly — nothing written.`);
    process.exitCode = 1;
    return;
  }

  for (const [slug, from, to] of EDITS) bodies.set(slug, bodies.get(slug)!.replace(from, to));

  // Nothing may still claim a 12-pair box is orderable, in any language.
  let leftovers = 0;
  for (const [slug, body] of bodies) {
    for (const bad of ["12 pairs</strong>", "12 Paar</strong>", "12 paires</strong>", "12 ζεύγη</strong>", "12er"]) {
      if (body.includes(bad)) {
        console.log(`  LEFTOVER 12-pair claim in ${slug}: ${bad}`);
        leftovers++;
      }
    }
  }
  if (leftovers > 0) {
    console.log(`\n${leftovers} leftover(s) — nothing written.`);
    process.exitCode = 1;
    return;
  }

  console.log(`${EDITS.length} replacements matched across ${slugs.length} articles; no 12-pair claims remain.`);
  for (const slug of slugs) console.log(`   ${slug}  (${bodies.get(slug)!.length} chars)`);

  if (!apply) {
    console.log("\nDRY RUN — pass --apply to write.");
    return;
  }
  for (const slug of slugs) {
    const { error: upErr } = await db
      .from("journal_posts")
      .update({ content_html: bodies.get(slug), updated_at: new Date().toISOString() })
      .eq("slug", slug);
    if (upErr) throw upErr;
    console.log(`   updated ${slug}`);
  }
  console.log(`\nupdated ${slugs.length} articles`);
}

main();
