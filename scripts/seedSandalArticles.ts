/**
 * Seeds the two leather-sandal articles (English + Greek), written 2026-09-06.
 *
 *   npx tsx scripts/seedSandalArticles.ts           # dry run
 *   npx tsx scripts/seedSandalArticles.ts --apply   # writes
 *
 * These are the first posts on this site to fill `seo_title` and `meta_description`. All
 * eighteen existing articles leave both null, so every one of them takes the generated
 * fallback title and description. `articleMetadata` prefers the admin values when present,
 * and `buildArticleSchema` uses `meta_description` for the BlogPosting description — so
 * filling them is the difference between a generated summary and a written one, in both
 * the <head> and the structured data.
 *
 * Facts checked against the database rather than assumed, because sandals are narrower than
 * the rest of the catalogue and the general claims do not hold:
 *
 *   - There are exactly TWO sandals, YKT09 Black and YKT09 Brown. Both men's, both summer,
 *     both pre-order.
 *   - They ship in the 10-PAIR BOX ONLY. `inventory` carries no box8 or box12 row for
 *     either, so the usual "8, 10 or 12 pairs" line would be wrong here.
 *   - MSRP exists on both styles but renders only behind `showPricing`, i.e. to a signed-in
 *     approved account. It is not repeated here.
 *
 * The merchandising notes (brown styles more easily, black is the safest colour, adjustable
 * fastening cuts size-related returns, tourist demand peaks June–August) are the buyer's own
 * `last_note_el` on the two styles, not invention.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const IMG = "https://yhtmdrurvthgvekgovcy.supabase.co/storage/v1/object/public/style-images/";
const BROWN = `${IMG}st-d4a3991e/5125c133-e871-4db4-8a95-031c3ecec2d4-H-P-C-hector-polo-club-ykt08-brown-sandal.png.jpg`;
const BLACK = `${IMG}st-15eb4928/48772a34-47c9-447b-aa15-696243cf1082-H-P-C-hector-polo-club-ykt08-black-sandal.png.jpg`;

interface Post {
  slug: string;
  locale: "en" | "el";
  title: string;
  seo_title: string;
  meta_description: string;
  excerpt: string;
  category: string;
  tags: string[];
  featured_image_url: string;
  content_html: string;
}

const posts: Post[] = [
  {
    slug: "mens-leather-sandals-wholesale-buyers-guide",
    locale: "en",
    title: "Men's Leather Sandals Wholesale: A Buyer's Guide to Stocking Genuine Leather Sandals",
    seo_title: "Men's Leather Sandals Wholesale | Hector Footwear",
    meta_description:
      "Wholesale men's genuine leather sandals from a Greek maker since 1984. Contoured footbeds, adjustable fastening, 10-pair boxes in EU 40–45. Trade only.",
    excerpt:
      "What separates a leather sandal worth stocking from one that comes back — construction, colour, sizing, and when to place the order. Featuring the YKT09 in black and brown.",
    category: "Buyer Guides",
    tags: [
      "leather sandals wholesale",
      "men's sandals",
      "genuine leather",
      "summer buying",
      "wholesale footwear Greece",
    ],
    featured_image_url: BROWN,
    content_html: `<p>Sandals are the shortest selling window in a men's footwear range and the least forgiving. A boot that does not move in November can still move in January. A sandal that is not on the shelf in May has missed its year.</p>
<p>They are also the category where quality shows fastest. There is no upper to hide behind — a customer sees the straps, the footbed and the sole, holds the shoe, and decides in about four seconds. This guide covers what to look for when buying men's leather sandals wholesale, and what we make.</p>
<h2>What we produce</h2>
<p>Our sandal range is deliberately narrow: one last, two colours. The <a href="/product/ykt09-black-leather-sandals">YKT09 Black</a> and the <a href="/product/ykt09-brown-leather-sandals">YKT09 Brown</a> are men's genuine leather sandals with adjustable fastening and a contoured, arch-supporting footbed, on a slip-resistant outsole.</p>
<p>Two colours in one shape is a deliberate choice rather than a limitation. Sandals are bought on fit and comfort far more than on styling, so range depth in this category tends to produce leftovers rather than sales.</p>
<h2>What to look for in a wholesale leather sandal</h2>
<p>Four things decide whether a leather sandal is a repeat line or a markdown.</p>
<ul>
<li><strong>Genuine leather straps, not bonded.</strong> Real leather softens and moulds to the foot over the first week, which is why a good leather sandal gets more comfortable rather than less. Bonded and coated materials do the opposite — they crack where they flex, and on a sandal every strap is a flex point.</li>
<li><strong>A contoured footbed.</strong> Flat footbeds are cheaper and are the single most common reason a sandal is worn twice and abandoned. Arch support is what makes a sandal wearable for a full day rather than for a walk to the beach.</li>
<li><strong>A slip-resistant outsole.</strong> Sandals are worn on wet tile, pool surrounds and boat decks. This is a safety property, not a specification detail.</li>
<li><strong>Adjustable fastening.</strong> The most underrated feature in the category, and the one with a direct commercial effect — see sizing below.</li>
</ul>
<h2>Black or brown: which to stock</h2>
<p>If you carry one colour, carry black. It is the easiest sandal colour to sell because it needs no thought from the customer and reads correctly with everything.</p>
<p>If you carry two, brown earns its place for a different reason: it styles more easily. Brown works with shorts, with linen and with chinos, and it does not read as a beach sandal when it is worn in town. That is the customer who buys a leather sandal rather than a rubber one, and brown is the colour that customer usually wants.</p>
<h2>Sizing, and why adjustable fastening matters commercially</h2>
<p>Sandal returns are overwhelmingly size returns. A closed shoe holds the foot and forgives half a size; an open sandal shows every millimetre of overhang and does not.</p>
<p>Adjustable fastening absorbs that. A customer between sizes can make either work, which converts a fitting that would have ended in no sale — or in a return two weeks later — into a sale that stays sold. When you are comparing sandals from two suppliers on paper, this is the specification worth weighting most heavily.</p>
<h2>How the boxes work</h2>
<p>We sell by the box, never by the pair. Unlike the rest of our catalogue, the sandals are offered in <strong>one box size only — 10 pairs</strong>, in a fixed run:</p>
<ul>
<li><strong>EU 40</strong> × 1</li>
<li><strong>EU 41</strong> × 2</li>
<li><strong>EU 42</strong> × 2</li>
<li><strong>EU 43</strong> × 2</li>
<li><strong>EU 44</strong> × 2</li>
<li><strong>EU 45</strong> × 1</li>
</ul>
<p>That distribution reflects real demand rather than an even split: 41 to 44 carry the sales, 40 and 45 are the edges. One box per colour — twenty pairs across two colours — is a complete sandal offer for most independent stores.</p>
<h2>When to order</h2>
<p>Both sandals are <strong>pre-order</strong> styles, produced against confirmed orders rather than pulled from a shelf. That makes timing the single most important decision in this category.</p>
<p>Demand peaks between June and August, and it is sharpest in tourist areas — a coastal or island store can clear a season's sandals in eight weeks. Because production runs against your order, a sandal buy placed in spring arrives for that window. A sandal buy placed in June arrives for the end of it.</p>
<h2>Common questions</h2>
<p><strong>Do you sell leather sandals in single pairs?</strong> No. We are wholesale only, and the ordering unit is the 10-pair box.</p>
<p><strong>Are the sandals men's only?</strong> Yes — the YKT09 is a men's last in EU 40–45. If you need a unisex option for the same season, the <a href="/product/692-black-leather-loafer">692 loafer</a> is cut for both.</p>
<p><strong>Can I mix colours in one box?</strong> No. A box is one style in one colour. Two colours means two boxes.</p>
<p><strong>Will two pairs look identical?</strong> Not exactly. Leather is a natural material and grain and colour vary between hides and between production runs; this is normal and is not a defect. If you are building a display, order the colour in one go rather than across two seasons.</p>
<p><strong>Where are they made?</strong> In Greece. We have manufactured men's leather footwear in Heraklion, Crete since 1984, and we sell to the trade only — there is no direct-to-consumer shop undercutting your prices.</p>
<h2>Ordering</h2>
<p>Wholesale prices are shown once your trade account is approved and you are signed in. Accounts are approved for prepayment, net 30 or net 60, with the discount decreasing as the terms lengthen.</p>
<p>See both sandals in the <a href="/catalogue">full catalogue</a>, or <a href="/apply">apply for a wholesale account</a> — applications are reviewed by a person, usually within two business days.</p>`,
  },
  {
    slug: "andrika-dermatina-sandalia-chondriki-odigos",
    locale: "el",
    title: "Ανδρικά Δερμάτινα Σανδάλια Χονδρική: Οδηγός Αγοράς για Καταστήματα",
    seo_title: "Ανδρικά Δερμάτινα Σανδάλια Χονδρική | Hector Footwear",
    meta_description:
      "Ανδρικά δερμάτινα σανδάλια χονδρικής από Έλληνα κατασκευαστή, από το 1984. Ανατομικός πάτος, ρυθμιζόμενο κλείσιμο, κιβώτια 10 ζευγαριών σε νούμερα 40–45.",
    excerpt:
      "Τι ξεχωρίζει ένα δερμάτινο σανδάλι που αξίζει να μπει στο ράφι — κατασκευή, χρώμα, νούμερα και χρόνος παραγγελίας. Με τα YKT09 σε μαύρο και καφέ.",
    category: "Buyer Guides",
    tags: [
      "δερμάτινα σανδάλια χονδρική",
      "ανδρικά σανδάλια",
      "γνήσιο δέρμα",
      "καλοκαιρινή παραγγελία",
      "χονδρική υποδημάτων",
    ],
    featured_image_url: BLACK,
    content_html: `<p>Τα σανδάλια έχουν το πιο σύντομο παράθυρο πώλησης σε μια ανδρική συλλογή και το λιγότερο συγχωρητικό. Ένα μποτάκι που δεν κινήθηκε τον Νοέμβριο μπορεί να κινηθεί τον Ιανουάριο. Ένα σανδάλι που δεν βρίσκεται στο ράφι τον Μάιο έχασε τη χρονιά του.</p>
<p>Είναι επίσης η κατηγορία όπου η ποιότητα φαίνεται αμέσως. Δεν υπάρχει «πάνω μέρος» για να κρυφτεί τίποτα — ο πελάτης βλέπει τα λουριά, τον πάτο και τη σόλα, πιάνει το παπούτσι και αποφασίζει σε τέσσερα δευτερόλεπτα. Ο οδηγός αυτός καλύπτει τι να προσέξετε όταν αγοράζετε ανδρικά δερμάτινα σανδάλια χονδρικής, και τι κατασκευάζουμε εμείς.</p>
<h2>Τι παράγουμε</h2>
<p>Η γκάμα σανδαλιών είναι σκόπιμα στενή: ένα καλαπόδι, δύο χρώματα. Τα <a href="/product/ykt09-black-leather-sandals">YKT09 Μαύρο</a> και <a href="/product/ykt09-brown-leather-sandals">YKT09 Καφέ</a> είναι ανδρικά σανδάλια από γνήσιο δέρμα, με ρυθμιζόμενο κλείσιμο και ανατομικό πάτο με υποστήριξη καμάρας, σε ανθεκτική αντιολισθητική σόλα.</p>
<p>Τα δύο χρώματα σε ένα σχήμα είναι επιλογή, όχι περιορισμός. Το σανδάλι αγοράζεται πολύ περισσότερο με κριτήριο την εφαρμογή και την άνεση παρά το στιλ, οπότε το βάθος γκάμας σε αυτή την κατηγορία συνήθως αφήνει υπόλοιπα αντί για πωλήσεις.</p>
<h2>Τι να προσέξετε σε ένα δερμάτινο σανδάλι χονδρικής</h2>
<p>Τέσσερα πράγματα κρίνουν αν ένα δερμάτινο σανδάλι θα γίνει επαναλαμβανόμενος κωδικός ή έκπτωση.</p>
<ul>
<li><strong>Λουριά από γνήσιο δέρμα, όχι συνθετικά.</strong> Το πραγματικό δέρμα μαλακώνει και παίρνει το σχήμα του ποδιού μέσα στην πρώτη εβδομάδα — γι' αυτό ένα καλό δερμάτινο σανδάλι γίνεται πιο άνετο με τον χρόνο, όχι λιγότερο. Τα συνθετικά κάνουν το αντίθετο: σπάνε εκεί που λυγίζουν, και σε ένα σανδάλι κάθε λουρί είναι σημείο κάμψης.</li>
<li><strong>Ανατομικός πάτος.</strong> Ο επίπεδος πάτος είναι φθηνότερος και είναι ο νούμερο ένα λόγος που ένα σανδάλι φοριέται δύο φορές και μένει στο ντουλάπι. Η υποστήριξη καμάρας είναι αυτό που το κάνει φορέσιμο για όλη μέρα και όχι μόνο για μια βόλτα στην παραλία.</li>
<li><strong>Αντιολισθητική σόλα.</strong> Τα σανδάλια φοριούνται σε βρεγμένο πλακάκι, γύρω από πισίνες και σε σκάφη. Είναι θέμα ασφάλειας, όχι λεπτομέρεια προδιαγραφών.</li>
<li><strong>Ρυθμιζόμενο κλείσιμο.</strong> Το πιο υποτιμημένο χαρακτηριστικό της κατηγορίας — και αυτό με την πιο άμεση εμπορική επίδραση, όπως εξηγείται παρακάτω.</li>
</ul>
<h2>Μαύρο ή καφέ: τι να βάλετε στο ράφι</h2>
<p>Αν κρατήσετε ένα χρώμα, κρατήστε το μαύρο. Είναι το πιο εύκολο χρώμα σανδαλιού, γιατί δεν απαιτεί σκέψη από τον πελάτη και ταιριάζει με τα πάντα.</p>
<p>Αν κρατήσετε δύο, το καφέ δικαιολογεί τη θέση του για διαφορετικό λόγο: συνδυάζεται πιο εύκολα. Πάει με σορτς, με λινό και με chino, και δεν μοιάζει με «σανδάλι παραλίας» όταν φορεθεί στην πόλη. Αυτός είναι ο πελάτης που αγοράζει δερμάτινο και όχι λαστιχένιο σανδάλι — και το καφέ είναι συνήθως το χρώμα που ζητάει.</p>
<h2>Νούμερα, και γιατί το ρυθμιζόμενο κλείσιμο μετράει εμπορικά</h2>
<p>Οι επιστροφές στα σανδάλια είναι συντριπτικά επιστροφές νούμερου. Ένα κλειστό παπούτσι κρατά το πόδι και συγχωρεί μισό νούμερο· ένα ανοιχτό σανδάλι δείχνει κάθε χιλιοστό και δεν συγχωρεί.</p>
<p>Το ρυθμιζόμενο κλείσιμο απορροφά ακριβώς αυτό. Ο πελάτης που είναι ανάμεσα σε δύο νούμερα μπορεί να φορέσει και τα δύο, και μια δοκιμή που θα κατέληγε σε μη-πώληση — ή σε επιστροφή δύο εβδομάδες αργότερα — γίνεται πώληση που μένει. Όταν συγκρίνετε σανδάλια δύο προμηθευτών στα χαρτιά, αυτή είναι η προδιαγραφή που αξίζει το μεγαλύτερο βάρος.</p>
<h2>Πώς λειτουργεί το κιβώτιο</h2>
<p>Πουλάμε ανά κιβώτιο, ποτέ ανά ζευγάρι. Σε αντίθεση με την υπόλοιπη γκάμα, τα σανδάλια διατίθενται σε <strong>ένα μόνο μέγεθος κιβωτίου — 10 ζεύγη</strong>, σε σταθερή σειρά:</p>
<ul>
<li><strong>Νο 40</strong> × 1</li>
<li><strong>Νο 41</strong> × 2</li>
<li><strong>Νο 42</strong> × 2</li>
<li><strong>Νο 43</strong> × 2</li>
<li><strong>Νο 44</strong> × 2</li>
<li><strong>Νο 45</strong> × 1</li>
</ul>
<p>Η κατανομή δεν είναι ισομερής αλλά ακολουθεί την πραγματική ζήτηση: τα 41 έως 44 σηκώνουν τις πωλήσεις, το 40 και το 45 είναι τα άκρα. Ένα κιβώτιο ανά χρώμα — είκοσι ζευγάρια σε δύο χρώματα — αποτελεί πλήρη πρόταση σανδαλιού για τα περισσότερα ανεξάρτητα καταστήματα.</p>
<h2>Πότε να παραγγείλετε</h2>
<p>Και τα δύο σανδάλια είναι μοντέλα <strong>προπαραγγελίας</strong>: παράγονται έναντι επιβεβαιωμένων παραγγελιών και όχι από έτοιμο απόθεμα. Αυτό κάνει τον χρόνο την πιο κρίσιμη απόφαση στην κατηγορία.</p>
<p>Η ζήτηση κορυφώνεται από Ιούνιο έως Αύγουστο και είναι εντονότερη σε τουριστικές περιοχές — ένα παραθαλάσσιο ή νησιωτικό κατάστημα μπορεί να εξαντλήσει τα σανδάλια μιας σεζόν σε οκτώ εβδομάδες. Επειδή η παραγωγή τρέχει πάνω στην παραγγελία σας, μια παραγγελία σανδαλιών την άνοιξη προλαβαίνει αυτό το παράθυρο. Μια παραγγελία τον Ιούνιο προλαβαίνει το τέλος του.</p>
<h2>Συχνές ερωτήσεις</h2>
<p><strong>Πουλάτε δερμάτινα σανδάλια σε μεμονωμένα ζευγάρια;</strong> Όχι. Λειτουργούμε αποκλειστικά χονδρικής και η μονάδα παραγγελίας είναι το κιβώτιο των 10 ζευγαριών.</p>
<p><strong>Είναι μόνο ανδρικά;</strong> Ναι — το YKT09 είναι ανδρικό καλαπόδι σε νούμερα 40–45. Αν χρειάζεστε unisex επιλογή για την ίδια σεζόν, το <a href="/product/692-black-leather-loafer">692 loafer</a> καλύπτει και τις δύο ζητήσεις.</p>
<p><strong>Μπορώ να αναμείξω χρώματα σε ένα κιβώτιο;</strong> Όχι. Ένα κιβώτιο είναι ένα μοντέλο σε ένα χρώμα. Δύο χρώματα σημαίνει δύο κιβώτια.</p>
<p><strong>Θα είναι δύο ζευγάρια πανομοιότυπα;</strong> Όχι ακριβώς. Το δέρμα είναι φυσικό υλικό και το στίγμα και το χρώμα διαφέρουν από δέρμα σε δέρμα και από παρτίδα σε παρτίδα· αυτό είναι φυσιολογικό και δεν συνιστά ελάττωμα. Αν στήνετε βιτρίνα, παραγγείλτε το χρώμα μονομιάς και όχι σε δύο σεζόν.</p>
<p><strong>Πού κατασκευάζονται;</strong> Στην Ελλάδα. Κατασκευάζουμε ανδρικά δερμάτινα υποδήματα στο Ηράκλειο Κρήτης από το 1984 και πουλάμε αποκλειστικά χονδρική — δεν υπάρχει κατάστημα λιανικής της εταιρείας που να υπονομεύει τις τιμές σας.</p>
<h2>Παραγγελία</h2>
<p>Οι τιμές χονδρικής εμφανίζονται μόλις εγκριθεί ο λογαριασμός σας και συνδεθείτε. Οι λογαριασμοί εγκρίνονται για προεξόφληση, πίστωση 30 ή 60 ημερών, με την έκπτωση να μειώνεται όσο επιμηκύνονται οι όροι.</p>
<p>Δείτε και τα δύο σανδάλια στον <a href="/catalogue">πλήρη κατάλογο</a> ή <a href="/apply">υποβάλετε αίτηση για λογαριασμό χονδρικής</a> — κάθε αίτηση εξετάζεται από άνθρωπο, συνήθως εντός δύο εργάσιμων ημερών.</p>`,
  },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: clashes, error: clashErr } = await db
    .from("journal_posts")
    .select("slug")
    .in("slug", posts.map((p) => p.slug));
  if (clashErr) throw clashErr;
  if (clashes && clashes.length > 0) {
    console.log("REFUSED — slugs exist:", clashes.map((c) => (c as { slug: string }).slug).join(", "));
    process.exitCode = 1;
    return;
  }

  const { data: styles } = await db.from("styles").select("slug").eq("status", "active");
  const known = new Set((styles ?? []).map((s) => (s as { slug: string }).slug));
  const STATIC = new Set(["/apply", "/terms", "/catalogue", "/collections", "/faq", "/contact"]);
  let bad = 0;
  for (const post of posts) {
    for (const m of post.content_html.matchAll(/href="([^"]+)"/g)) {
      const href = m[1].replace(/^\/(de|fr)/, "");
      if (href.startsWith("/product/")) {
        if (!known.has(href.slice("/product/".length))) {
          console.log(`  BAD LINK ${post.slug} -> ${m[1]}`);
          bad++;
        }
      } else if (!STATIC.has(href)) {
        console.log(`  UNKNOWN ROUTE ${post.slug} -> ${m[1]}`);
        bad++;
      }
    }
    // A meta description Google will truncate is a wasted one.
    if (post.meta_description.length > 165) {
      console.log(`  META TOO LONG ${post.slug}: ${post.meta_description.length}`);
      bad++;
    }
    if (post.seo_title.length > 60) {
      console.log(`  SEO TITLE TOO LONG ${post.slug}: ${post.seo_title.length}`);
      bad++;
    }
  }
  if (bad > 0) {
    console.log(`\n${bad} problem(s) — nothing written.`);
    process.exitCode = 1;
    return;
  }
  console.log("links resolve; seo_title and meta_description within display limits");

  const now = new Date();
  const rows = posts.map((post, i) => ({
    slug: post.slug,
    locale: post.locale,
    title: post.title,
    seo_title: post.seo_title,
    meta_description: post.meta_description,
    excerpt: post.excerpt,
    content_html: post.content_html,
    category: post.category,
    tags: post.tags,
    featured_image_url: post.featured_image_url,
    featured_image_path: null,
    author_name: "Hector Footwear Team",
    featured: false,
    status: "published",
    published_at: new Date(now.getTime() - i * 60_000).toISOString(),
    robots: "index,follow",
  }));

  for (const r of rows) {
    console.log(`\n  [${r.locale}] ${r.slug}`);
    console.log(`     seo_title (${r.seo_title.length}): ${r.seo_title}`);
    console.log(`     meta      (${r.meta_description.length}): ${r.meta_description.slice(0, 90)}…`);
    console.log(`     body: ${r.content_html.length} chars`);
  }

  if (!apply) {
    console.log("\nDRY RUN — pass --apply to write.");
    return;
  }
  const { error } = await db.from("journal_posts").insert(rows);
  if (error) throw error;
  console.log(`\ninserted ${rows.length} posts`);
}

main();
