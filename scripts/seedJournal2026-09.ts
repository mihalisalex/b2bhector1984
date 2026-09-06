/**
 * Seeds the eight journal articles written on 2026-09-06.
 *
 *   npx tsx scripts/seedJournal2026-09.ts           # dry run, prints what it would insert
 *   npx tsx scripts/seedJournal2026-09.ts --apply   # writes
 *
 * WHY A SCRIPT. /de/journal and /fr/journal were empty — ten English articles, eight Greek,
 * nothing in German or French — while .com serves all three languages. The Journal is the
 * long-form content an assistant actually quotes when it answers a sourcing question, so two
 * of .com's three languages had nothing to be quoted from.
 *
 * Every factual claim below is checked against the database rather than remembered:
 * the box ratios are `box_types.size_breakdown` verbatim, the product names, slugs and
 * descriptions are the live catalogue, and no article states a price, because wholesale
 * pricing is not public and `/llms.txt` explicitly tells models not to infer one.
 *
 * Internal links carry the locale prefix the article's own domain uses: bare `/product/…`
 * for English (unprefixed on .com) and Greek (unprefixed on .gr), `/de/…` and `/fr/…` for
 * the two prefixed locales. Article bodies are raw HTML rendered through
 * `sanitizeJournalBody`, so only p/h2/h3/ul/li/a/strong survive — nothing here uses more.
 *
 * Featured images are real product photography from the `style-images` bucket rather than
 * stock: these are the shoes the articles are about. `featured_image_path` stays null
 * because that column addresses the `journal-images` bucket, and pointing it at a file in a
 * different bucket would break the admin's replace-and-delete flow.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const IMG = "https://yhtmdrurvthgvekgovcy.supabase.co/storage/v1/object/public/style-images/";
const img = {
  boots116: `${IMG}st-151291a4/f96685cd-a0cb-4163-aebe-0cedbf77c4ec-H-P-C-hector-polo-club-116-black-boots-leather.jpg`,
  formal272: `${IMG}st-2835e305/5fe2d49d-5b36-4b2d-809a-8c85d89a004c-1-H-P-C-hector-polo-club-272-black-groomshoes-leather.jpg`,
  suede020: `${IMG}st-e7767250/a2dbb752-664e-4a99-9a71-9fe78c22f655-H-P-C-hector-polo-club-020-beige-loafers-leather.jpg`,
  loafer5195: `${IMG}st-9334c130/d4ac9bcf-233a-4a18-a3e6-15701407bc7e-H-P-C-hector-polo-club-5195-taba-formal-leather.jpg`,
  groom5101: `${IMG}st-109fc60d/eba7a3d9-ecee-4eac-bc04-071c18e310f6-H-P-C-hector-polo-club-5101-taba-groomshoes-leather.png.jpg`,
  loafer692: `${IMG}st-6af1921a/edafbee0-debc-4005-8189-bcf09b309889-H-P-C-hector-polo-club-692-BLACK-loafer-leather.png.jpg`,
  boots5109: `${IMG}st-42d5ccdb/3f336431-8f98-4316-9434-6c88af6cc6be-H-P-C-hector-polo-club-5109-brown-chelsea-boots-leather.jpg`,
  sandal: `${IMG}st-d4a3991e/5125c133-e871-4db4-8a95-031c3ecec2d4-H-P-C-hector-polo-club-ykt08-brown-sandal.png.jpg`,
};

interface Post {
  slug: string;
  locale: "en" | "el" | "de" | "fr";
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  featured_image_url: string;
  content_html: string;
}

const posts: Post[] = [
  // ------------------------------------------------------------------ English
  {
    slug: "winter-buy-mens-leather-boots-and-formal-shoes",
    locale: "en",
    title: "Building a Winter Buy: The Boots and Formal Shoes That Carry a Men's Range",
    excerpt:
      "A walk through the Hector Footwear winter range — four boots, four formal lace-ups and the year-round styles that sit between them — and how to turn it into a first order.",
    category: "Buyer Guides",
    tags: ["winter buy", "boots", "formal shoes", "range planning", "assortment"],
    featured_image_url: img.boots116,
    content_html: `<p>A men's leather range is usually decided by its winter half. Summer sells on colour and impulse. Winter sells on the two categories a customer walks in specifically to buy — a boot and a formal shoe — and replaces on a cycle you can plan around.</p>
<p>Here is what the winter side of our range actually consists of, and how a buyer might turn it into a first order.</p>
<h2>The boots: two silhouettes, two colours each</h2>
<p>There are four boots, and they are two shapes offered in two colours. The <a href="/product/116-black-leather-boots">116 Black</a> and <a href="/product/116-taba-leather-formal-boots">116 Taba</a> take a clean ankle-height profile — smart enough for an office, robust enough for daily winter wear. The <a href="/product/5109-black-leather-formal-boots">5109 Black</a> and <a href="/product/5109-brown-leather-formal-boots">5109 Brown</a> are the same proposition in a second shape, so a store can carry two boots that do not compete with each other.</p>
<p>All four are built the same way: genuine leather upper, breathable lining, slip-resistant outsole. All four are <strong>made to order</strong>, which matters for planning — they are produced against confirmed orders rather than pulled from a shelf, so a winter boot buy wants to be placed early rather than topped up in December.</p>
<h2>The formal lace-ups</h2>
<p>Four again, and again two shapes in two colours: <a href="/product/272-black-leather-formal-shoes">272 Black</a> and <a href="/product/272-tan-leather-formal-shoes">272 Tan</a>, <a href="/product/372-black-leather-formal-shoes">372 Black</a> and <a href="/product/372-brown-leather-formal-shoes">372 Brown</a>. These are timeless formal cuts for business dress, ceremonies and smart occasions — the shoe someone buys because they have an event, which is a different and more urgent purchase than a boot.</p>
<p>Black outsells the browns in most stores. It is still worth carrying one brown or tan per shape: the customer who wants a brown formal shoe rarely accepts black as a substitute, and will leave to find one.</p>
<h2>The styles that do not stop in March</h2>
<p>Three of our formal styles are flagged for <strong>both seasons</strong> rather than winter alone, and they are the ones that keep earning shelf space after the boot buy is over. The <a href="/product/5195-taba-leather-formal-loafer">5195 Taba</a> and <a href="/product/5195-black-leather-formal-loafer">5195 Black</a> formal loafers are a slip-on cut for the office and for weddings. The <a href="/product/5101-taba-leather-groomshoes">5101 Taba Groomshoes</a> and <a href="/product/5101-groomshoes">5101</a> are built for a wedding day — cushioned for the number of hours one actually involves.</p>
<p>The <a href="/product/692-black-leather-loafer">692 Black</a> and <a href="/product/692-tan-brown-leather-loafer">692 Tan Brown</a> loafers, and the <a href="/product/1906-leather-sneaker">1906 leather sneaker</a>, sit in the same year-round bracket.</p>
<h2>Doing the box arithmetic</h2>
<p>We sell by the box, not the pair, and each box is a fixed size run. There are three:</p>
<ul>
<li><strong>8 pairs</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 pairs</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
<li><strong>12 pairs</strong> — EU 40×1, 41×2, 42×3, 43×3, 44×2, 45×1</li>
</ul>
<p>The practical difference is the top of the run: the 8-pair box stops at 44, the other two carry a 45. If your customer base skews larger, the 10 and 12 are the boxes to build on.</p>
<p>A workable first winter order is one box per colour on the two boot shapes and one on each formal shape — eight boxes, and a range that looks complete on the wall rather than like a sample set.</p>
<h2>Terms</h2>
<p>Every account is approved for prepayment, net 30 or net 60, and the discount shrinks as the terms lengthen: prepay carries the largest, net 60 is list. Prices are shown once your trade account is approved and signed in. If you do not have one yet, <a href="/apply">apply for wholesale access</a> — applications are reviewed by a person, usually within two business days.</p>`,
  },

  // -------------------------------------------------------------------- Greek
  {
    slug: "kalokairini-paraggelia-andrika-dermatina-papoutsia-chondriki",
    locale: "el",
    title: "Καλοκαιρινή Παραγγελία: Τα Μοντέλα που Στηρίζουν μια Ανδρική Συλλογή",
    excerpt:
      "Ποια μοντέλα συγκροτούν μια καλοκαιρινή ανδρική συλλογή δερμάτινων υποδημάτων — boat, εσπαντρίγιες, loafers, σανδάλια και sneakers — και πώς γίνεται μια πρώτη παραγγελία ανά κιβώτιο.",
    category: "Buyer Guides",
    tags: ["καλοκαιρινή συλλογή", "loafers", "σανδάλια", "εσπαντρίγιες", "χονδρική"],
    featured_image_url: img.suede020,
    content_html: `<p>Η καλοκαιρινή ανδρική συλλογή έχει διαφορετική λογική από τη χειμερινή. Ο πελάτης δεν μπαίνει στο κατάστημα για να αντικαταστήσει κάτι που χάλασε· μπαίνει επειδή αλλάζει η εποχή. Αυτό σημαίνει περισσότερα μοντέλα, μικρότερες ποσότητες ανά μοντέλο και μεγαλύτερη σημασία στο χρώμα.</p>
<p>Δείτε τι περιλαμβάνει η καλοκαιρινή μας γκάμα και πώς συγκροτείται μια πρώτη παραγγελία από αυτήν.</p>
<h2>Boat και καστόρι</h2>
<p>Τα <a href="/product/020-suede-boat-loafer">020</a> και <a href="/product/020-taba-suede-boat-loafer">020 Ταμπά</a> είναι boat από καστόρι με κορδόνι-λεπτομέρεια και μαλακό πάτο, για χαλαρό καλοκαιρινό ύφος. Τα <a href="/product/021-blue-suede-boat-loafer">021 Μπλε</a> και <a href="/product/021-beige-suede-boat-loafer">021 Μπεζ</a> καλύπτουν την ίδια ζήτηση σε δεύτερη γραμμή, ώστε να έχετε δύο boat που δεν ανταγωνίζονται μεταξύ τους.</p>
<p>Σε δέρμα, τα <a href="/product/ykt06-leather-boat">YKT06 Καφέ</a> και <a href="/product/ykt06-blue-leather-boat">YKT06 Μπλε</a> είναι η πιο κλασική εκδοχή του ίδιου σχήματος.</p>
<h2>Εσπαντρίγιες και loafers</h2>
<p>Οι εσπαντρίγιες <a href="/product/035-beige-espadrille">035 Μπεζ</a> και <a href="/product/035-brown-leather-espadrille">035 Καφέ</a> είναι δερμάτινες, σε ελαφριά ευλύγιστη καλοκαιρινή σόλα — εύκολο slip-on για καλοκαίρι και διακοπές, και από τα μοντέλα που πουλάνε καλύτερα σε τουριστικές αγορές.</p>
<p>Τα loafers <a href="/product/1013-leather-loafer">1013</a>, <a href="/product/1013-black-leather-loafer">1013 Μαύρο</a> και <a href="/product/1013-beige-leather-loafer">1013 Μπεζ</a> καλύπτουν το καθημερινό κομμάτι. Τα <a href="/product/692-black-leather-loafer">692 Μαύρο</a> και <a href="/product/692-tan-brown-leather-loafer">692 Ταμπά</a> έχουν unisex γραμμή — ένα μοντέλο που καλύπτει και ανδρική και γυναικεία ζήτηση, κάτι που μετράει όταν ο χώρος στο ράφι είναι περιορισμένος.</p>
<h2>Σανδάλια και sneakers</h2>
<p>Τα <a href="/product/ykt09-brown-leather-sandals">YKT09 Καφέ</a> και <a href="/product/ykt09-black-leather-sandals">YKT09 Μαύρο</a> είναι δερμάτινα σανδάλια με ρυθμιζόμενο κλείσιμο και ανατομικό πάτο με υποστήριξη καμάρας. Είναι η κατηγορία με τη μικρότερη γκάμα και τη μεγαλύτερη αιχμή: πουλάει σε στενό παράθυρο, οπότε θέλει να βρίσκεται στο ράφι πριν από αυτό.</p>
<p>Τα sneakers <a href="/product/1906-leather-sneaker">1906</a>, <a href="/product/1906-brown-leather-sneaker">1906 Καφέ</a>, <a href="/product/1906-grey-suede-sneaker">1906 Γκρι Καστόρι</a> και <a href="/product/1906-beige-suede-sneaker">1906 Μπεζ Καστόρι</a> είναι μοντέλα και των δύο εποχών εκτός από το μπεζ, που είναι καθαρά καλοκαιρινό.</p>
<h2>Η αριθμητική του κιβωτίου</h2>
<p>Πουλάμε ανά κιβώτιο, όχι ανά ζευγάρι, και κάθε κιβώτιο είναι πλήρης σειρά μεγεθών:</p>
<ul>
<li><strong>8 ζεύγη</strong> — 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 ζεύγη</strong> — 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
<li><strong>12 ζεύγη</strong> — 40×1, 41×2, 42×3, 43×3, 44×2, 45×1</li>
</ul>
<p>Η ουσιαστική διαφορά είναι η κορυφή της σειράς: το κιβώτιο των 8 σταματά στο 44, τα άλλα δύο φτάνουν στο 45.</p>
<p>Για το καλοκαίρι, η λογική είναι αντίστροφη από τον χειμώνα: περισσότερα μοντέλα από ένα κιβώτιο το καθένα, αντί για λίγα μοντέλα σε βάθος. Ένα κιβώτιο σε κάθε boat, μία εσπαντρίγια, ένα loafer και ένα σανδάλι δίνουν ήδη μια γκάμα που δείχνει ολοκληρωμένη.</p>
<h2>Όροι</h2>
<p>Κάθε λογαριασμός εγκρίνεται για προεξόφληση, πίστωση 30 ή 60 ημερών, με την έκπτωση να μειώνεται όσο επιμηκύνονται οι όροι. Οι τιμές εμφανίζονται μόλις εγκριθεί και συνδεθεί ο λογαριασμός χονδρικής σας. Αν δεν έχετε ακόμη, <a href="/apply">υποβάλετε αίτηση</a> — κάθε αίτηση εξετάζεται από άνθρωπο, συνήθως εντός δύο εργάσιμων ημερών.</p>`,
  },

  // ------------------------------------------------------------------- German
  {
    slug: "grosshandel-herren-lederschuhe-aus-griechenland",
    locale: "de",
    title: "Herren-Lederschuhe im Großhandel aus Griechenland: Was deutsche Einkäufer wissen sollten",
    excerpt:
      "Umsatzsteuer im Reverse-Charge-Verfahren, Kartonweise-Bestellung, Zahlungsziele und Vorlaufzeiten — die praktischen Punkte beim Einkauf von Lederschuhen bei einem griechischen Hersteller.",
    category: "Buyer Guides",
    tags: ["Großhandel", "Herrenschuhe", "Leder", "Import", "Reverse-Charge"],
    featured_image_url: img.formal272,
    content_html: `<p>Ein griechischer Lieferant ist für einen deutschen Schuheinzelhändler kein Sonderfall — beide sitzen im EU-Binnenmarkt, es gibt keinen Zoll und keine Einfuhrumsatzsteuer an der Grenze. Ein paar Punkte laufen trotzdem anders als beim Einkauf im Inland. Die folgenden sind die, nach denen am häufigsten gefragt wird.</p>
<h2>Umsatzsteuer: Reverse-Charge, nicht griechische Mehrwertsteuer</h2>
<p>Wenn Sie uns eine gültige, in Deutschland registrierte USt-IdNr. nennen und die Ware Griechenland verlässt, stellen wir <strong>ohne griechische Umsatzsteuer</strong> in Rechnung. Die Steuer schulden Sie im Reverse-Charge-Verfahren in Deutschland und ziehen sie im selben Vorgang als Vorsteuer wieder ab. Für Ihre Liquidität heißt das: auf unserer Rechnung steht der Nettobetrag, und Sie strecken keine ausländische Steuer vor, die Sie sich später zurückholen müssten.</p>
<p>Ohne gültige USt-IdNr. geht das nicht. Hinterlegen Sie sie deshalb schon im Antrag und nicht erst bei der ersten Bestellung.</p>
<h2>Kartonweise, nicht paarweise</h2>
<p>Wir verkaufen ausschließlich in vollen Größenläufen. Es gibt drei Kartongrößen, und die Aufteilung ist fest:</p>
<ul>
<li><strong>8 Paar</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 Paar</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
<li><strong>12 Paar</strong> — EU 40×1, 41×2, 42×3, 43×3, 44×2, 45×1</li>
</ul>
<p>Für den deutschen Markt ist das relevanteste Detail das obere Ende: der 8-Paar-Karton endet bei 44, die beiden größeren führen eine 45. Deutsche Kundschaft fällt im Schnitt größer aus als die südeuropäische, für die diese Läufe ursprünglich geschnitten wurden — planen Sie eher mit dem 10er- und dem 12er-Karton.</p>
<h2>Lagerware, Vorbestellung, Auftragsfertigung</h2>
<p>Jedes Modell ist gekennzeichnet. Lagerware wird ab Lager versandt. <strong>Vorbestellung</strong> und <strong>Auftragsfertigung</strong> werden gegen bestätigte Bestellungen produziert, und die angezeigten Termine sind Produktionsschätzungen, keine zugesicherten Liefertermine.</p>
<p>Praktisch heißt das: die Winterstiefel — etwa <a href="/de/product/116-black-leather-boots">116 Black</a> und <a href="/de/product/5109-brown-leather-formal-boots">5109 Brown</a> — werden auf Auftrag gefertigt und wollen früh geordert werden, nicht im November nachgelegt.</p>
<h2>Zahlungsziele</h2>
<p>Jedes Konto wird für Vorkasse, 30 oder 60 Tage netto freigegeben. Der Nachlass sinkt, je länger das Ziel: Vorkasse trägt den größten, 60 Tage netto ist der Listenpreis. Welches Ziel für Sie freigegeben ist, sehen Sie im Bestellabschluss; ein anderes können Sie anfragen, dann geht die Bestellung vor dem Versand zur Kreditfreigabe an Ihren Betreuer.</p>
<h2>Was Sie sonst noch erwartet</h2>
<p>Wir verkaufen ausschließlich an den Handel und betreiben keinen Direktvertrieb an Endkunden — es gibt also keinen Herstellershop, der Ihre Preise unterbietet. Das Haus fertigt seit 1984 in Heraklion auf Kreta.</p>
<p>Preise sind erst nach Freigabe und Anmeldung sichtbar. <a href="/de/apply">Beantragen Sie ein Händlerkonto</a> — jeder Antrag wird von einem Menschen geprüft, in der Regel innerhalb von zwei Werktagen. Die vollständigen Bedingungen stehen in den <a href="/de/terms">Verkaufsbedingungen</a>.</p>`,
  },
  {
    slug: "kartonweise-bestellen-groessenlauf-grosshandel",
    locale: "de",
    title: "Kartonweise bestellen: Warum Großhandelsschuhe im Größenlauf verkauft werden",
    excerpt:
      "Der volle Größenlauf wirkt wie eine Einschränkung und ist in Wahrheit eine Kalkulationsentscheidung. Was in einem Karton steckt, warum es so ist und wie man damit plant.",
    category: "Supplier Guides",
    tags: ["Kartonbestellung", "Größenlauf", "Sortiment", "Einkauf"],
    featured_image_url: img.boots116,
    content_html: `<p>Fast jeder Schuhgroßhändler verkauft in vorgepackten Kartons statt in Einzelpaaren, und für Einzelhändler, die aus anderen Warengruppen kommen, wirkt das zunächst wie eine willkürliche Hürde. Ist es nicht. Es ist die Entscheidung, die den Großhandelspreis überhaupt erst möglich macht.</p>
<h2>Was in einem Karton steckt</h2>
<p>Ein Karton ist ein Modell in einer Farbe, aufgeteilt auf einen festen Größenlauf. Wir führen drei:</p>
<ul>
<li><strong>8 Paar</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 Paar</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
<li><strong>12 Paar</strong> — EU 40×1, 41×2, 42×3, 43×3, 44×2, 45×1</li>
</ul>
<p>Die Verteilung ist kein Zufall, sondern bildet die tatsächliche Nachfragekurve ab: die Mittelgrößen 42 und 43 tragen den Absatz, 40 und 45 sind die Ränder. Ein Karton entspricht also ungefähr dem, was ein Modell im Verkauf tatsächlich abruft.</p>
<h2>Warum nicht einzeln</h2>
<p>Drei Gründe, und alle drei landen am Ende im Preis.</p>
<p><strong>Produktion.</strong> Leder wird in Partien zugeschnitten. Eine Serie über einen vollen Größenlauf nutzt die Haut anders aus als das Nachlegen einzelner Größen, und das Nachlegen einzelner Größen kostet mehr als es einbringt.</p>
<p><strong>Kommissionierung.</strong> Ein vorgepackter Karton wird gescannt und verladen. Ein Einzelpaar wird gesucht, entnommen, neu verpackt und einzeln erfasst — bei zwölf Paaren zwölfmal statt einmal.</p>
<p><strong>Restgrößen.</strong> Wer Einzelpaare verkauft, verkauft zuerst die Mitte und bleibt auf den Rändern sitzen. Diese Restbestände werden irgendwann abgeschrieben, und diese Abschreibung steckt dann in jedem Preis.</p>
<h2>Wie man damit plant</h2>
<p>Der übliche Fehler ist, ein Modell zu tief einzukaufen. Bei acht bis zwölf Paar pro Karton bringt ein zweiter Karton desselben Modells in derselben Farbe zwei Paar in jeder Mittelgröße — und ein Regal, das schmaler wirkt, als es ist.</p>
<p>Besser ist in aller Regel: ein Karton je Modell und Farbe über mehr Modelle. Das <a href="/de/product/692-black-leather-loafer">692 Black</a> etwa hat eine Unisex-Linie und bedient damit Nachfrage aus zwei Richtungen aus einem einzigen Karton.</p>
<p>Zum zweiten Karton greift man, wenn ein Modell nachweislich läuft — nicht bei der Erstorder.</p>
<h2>Der obere Rand des Laufs</h2>
<p>Ein Detail, das im deutschsprachigen Raum zählt: der 8-Paar-Karton endet bei EU 44, der 10er und der 12er führen eine 45. Fällt Ihre Kundschaft groß aus, ist das der entscheidende Unterschied zwischen den Kartongrößen — nicht der Stückpreis.</p>
<p>Den vollständigen Größenlauf und die Kartonoptionen sehen Sie auf jeder Produktseite im <a href="/de/catalogue">Katalog</a>.</p>`,
  },
  {
    slug: "vollnarbenleder-veloursleder-einkaufsleitfaden",
    locale: "de",
    title: "Vollnarbenleder und Veloursleder: ein Einkaufsleitfaden für Materialqualität",
    excerpt:
      "Woran man im Großhandelseinkauf erkennt, womit man es zu tun hat — und warum Farbabweichungen zwischen Häuten kein Reklamationsgrund sind.",
    category: "Buyer Guides",
    tags: ["Leder", "Veloursleder", "Materialqualität", "Einkauf"],
    featured_image_url: img.loafer5195,
    content_html: `<p>„Echtes Leder" auf einem Etikett sagt wenig darüber, wie ein Schuh nach zwei Saisons aussieht. Für den Einkauf hilft es, die Schichten der Haut zu kennen und zu wissen, welche man vor sich hat.</p>
<h2>Die Schichten</h2>
<p><strong>Vollnarbenleder</strong> ist die äußere Schicht der Haut mit unversehrter Narbung. Sie wird nicht abgeschliffen, also bleibt die natürliche Faserstruktur erhalten — das ist die Schicht, die dicht und fest ist und mit den Jahren Patina ansetzt statt sich abzunutzen.</p>
<p><strong>Narbenleder</strong> (top-grain) ist dieselbe Schicht, aber leicht abgeschliffen, um Unregelmäßigkeiten zu entfernen, und häufig mit einer aufgeprägten Narbung versehen. Gleichmäßiger im Bild, etwas weniger langlebig.</p>
<p><strong>Veloursleder</strong> stammt von der Spaltseite der Haut und wird angeraut. Es ist nicht die minderwertige Variante, sondern ein anderes Material mit anderen Eigenschaften: weicher, leichter, empfindlicher gegen Wasser und Salz. Ein Sommermodell wie das <a href="/de/product/020-suede-boat-loafer">020 Suede Boat</a> ist genau deshalb aus Velours und nicht aus glattem Leder.</p>
<h2>Was Sie am Schuh prüfen können</h2>
<ul>
<li><strong>Die Schnittkante.</strong> An einer Kante sehen Sie die Faser. Vollnarbenleder ist über den Querschnitt dicht; ein beschichtetes Spaltleder zeigt eine sichtbare Trennung zwischen Oberfläche und Trägermaterial.</li>
<li><strong>Die Narbung.</strong> Natürliche Narbung wiederholt sich nicht. Ein Muster, das über die Fläche exakt gleich bleibt, ist geprägt.</li>
<li><strong>Das Innenfutter.</strong> Ein atmungsaktives Lederfutter ist teurer als eine Textilkaschierung und wird gerade dort eingespart, wo der Kunde es zuletzt bemerkt — nämlich erst im Tragen.</li>
<li><strong>Die Verbindung von Schaft und Sohle.</strong> Sauber und gleichmäßig verklebt, ohne Überstand.</li>
</ul>
<h2>Warum zwei Paare nicht identisch sind</h2>
<p>Das ist der Punkt, an dem im Großhandel die meisten Missverständnisse entstehen. Leder ist ein Naturprodukt: Narbung, Farbaufnahme und Finish unterscheiden sich von Haut zu Haut und von Partie zu Partie. Zwei Paare desselben Modells aus zwei Produktionen können sichtbar verschieden ausfallen, ohne dass eines davon fehlerhaft wäre.</p>
<p>Für den Einzelhandel folgen daraus zwei praktische Konsequenzen. Erstens: Wenn Sie ein Modell in einer Farbe für eine Auslage nachlegen, ordern Sie es möglichst in einem Zug statt über zwei Saisons verteilt. Zweitens: Diese Abweichung ist ausdrücklich kein Mangel — so steht es auch in unseren <a href="/de/terms">Verkaufsbedingungen</a>.</p>
<h2>Was wir verwenden</h2>
<p>Unsere Modelle sind aus echtem Leder oder Velours gearbeitet, mit atmungsaktivem Futter und rutschhemmender Laufsohle; die Materialliste steht auf jeder Produktseite. Das Haus fertigt seit 1984 in Heraklion auf Kreta und beliefert ausschließlich den Handel.</p>
<p>Die vollständige Auswahl finden Sie im <a href="/de/catalogue">Katalog</a>.</p>`,
  },

  // ------------------------------------------------------------------- French
  {
    slug: "grossiste-chaussures-cuir-homme-grece",
    locale: "fr",
    title: "Chaussures en cuir pour homme en gros depuis la Grèce : ce qu'un détaillant français doit savoir",
    excerpt:
      "Autoliquidation de la TVA, commande par carton, conditions de paiement et délais de production — les points pratiques d'un approvisionnement chez un fabricant grec.",
    category: "Buyer Guides",
    tags: ["gros", "chaussures homme", "cuir", "import", "autoliquidation"],
    featured_image_url: img.loafer692,
    content_html: `<p>Un fournisseur grec n'a rien d'exotique pour un détaillant français : nous sommes tous deux dans le marché unique, sans douane ni TVA à l'importation à la frontière. Quelques points fonctionnent néanmoins différemment d'un achat en France. Voici ceux sur lesquels on nous interroge le plus.</p>
<h2>TVA : autoliquidation, pas de TVA grecque</h2>
<p>Si vous nous communiquez un numéro de TVA intracommunautaire valide enregistré en France et que la marchandise quitte la Grèce, nous facturons <strong>sans TVA grecque</strong>. Vous autoliquidez la taxe en France et la déduisez dans la même opération. Concrètement : notre facture porte le montant hors taxes, et vous n'avancez aucune taxe étrangère à récupérer ensuite.</p>
<p>Cela suppose un numéro valide. Indiquez-le dès la demande de compte, pas au moment de la première commande.</p>
<h2>Par carton, pas à la paire</h2>
<p>Nous vendons uniquement en séries de tailles complètes. Trois formats, à répartition fixe :</p>
<ul>
<li><strong>8 paires</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 paires</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
<li><strong>12 paires</strong> — EU 40×1, 41×2, 42×3, 43×3, 44×2, 45×1</li>
</ul>
<p>Le détail qui compte est le haut de la série : le carton de 8 s'arrête au 44, les deux autres montent au 45. Selon votre clientèle, c'est souvent ce critère — et non le prix unitaire — qui décide du format.</p>
<h2>Stock, précommande, fabrication à la commande</h2>
<p>Chaque modèle porte son statut. Le stock part de l'entrepôt. La <strong>précommande</strong> et la <strong>fabrication à la commande</strong> sont produites contre commandes confirmées, et les dates affichées sont des estimations de production, non des délais de livraison garantis.</p>
<p>En pratique : les bottines d'hiver, comme la <a href="/fr/product/116-black-leather-boots">116 Black</a> ou la <a href="/fr/product/5109-brown-leather-formal-boots">5109 Brown</a>, sont fabriquées à la commande et se réservent tôt — elles ne se réassortissent pas en novembre.</p>
<h2>Conditions de paiement</h2>
<p>Chaque compte est agréé pour le paiement d'avance, 30 jours nets ou 60 jours nets. La remise diminue à mesure que le délai s'allonge : le paiement d'avance porte la plus forte, 60 jours nets correspond au prix de liste. Vous voyez au moment de valider ce qui est agréé pour vous ; une autre condition peut être demandée, la commande passant alors par votre commercial pour accord de crédit avant expédition.</p>
<h2>Ce qui vous attend par ailleurs</h2>
<p>Nous vendons exclusivement au commerce et ne pratiquons aucune vente directe aux particuliers : il n'existe donc pas de boutique de marque qui casserait vos prix. La maison fabrique depuis 1984 à Héraklion, en Crète.</p>
<p>Les prix n'apparaissent qu'une fois le compte agréé et la session ouverte. <a href="/fr/apply">Demandez un compte professionnel</a> — chaque demande est examinée par une personne, généralement sous deux jours ouvrés. Les modalités complètes figurent dans nos <a href="/fr/terms">conditions de vente</a>.</p>`,
  },
  {
    slug: "commander-par-carton-serie-de-tailles",
    locale: "fr",
    title: "Commander par carton : pourquoi la chaussure en gros se vend par série de tailles",
    excerpt:
      "La série complète ressemble à une contrainte ; c'est en réalité ce qui rend le prix de gros possible. Ce que contient un carton, pourquoi, et comment construire un assortiment avec.",
    category: "Supplier Guides",
    tags: ["carton", "série de tailles", "assortiment", "achat"],
    featured_image_url: img.suede020,
    content_html: `<p>Presque tous les grossistes en chaussures vendent en cartons pré-packés plutôt qu'à la paire, et pour un détaillant venu d'une autre famille de produits, cela ressemble d'abord à une contrainte arbitraire. Ce n'en est pas une : c'est la décision qui rend le prix de gros possible.</p>
<h2>Ce que contient un carton</h2>
<p>Un carton, c'est un modèle dans un coloris, réparti sur une série de tailles fixe. Nous en avons trois :</p>
<ul>
<li><strong>8 paires</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×1</li>
<li><strong>10 paires</strong> — EU 40×1, 41×2, 42×2, 43×2, 44×2, 45×1</li>
<li><strong>12 paires</strong> — EU 40×1, 41×2, 42×3, 43×3, 44×2, 45×1</li>
</ul>
<p>La répartition n'est pas arbitraire : elle épouse la courbe réelle de la demande. Les tailles médianes, 42 et 43, portent les ventes ; le 40 et le 45 sont les extrémités. Un carton correspond donc à peu près à ce qu'un modèle écoule effectivement.</p>
<h2>Pourquoi pas à la paire</h2>
<p>Trois raisons, qui finissent toutes dans le prix.</p>
<p><strong>La production.</strong> Le cuir se coupe par lots. Une série couvrant une gamme complète exploite la peau autrement qu'un réassort de tailles isolées, et réassortir une taille isolée coûte plus qu'elle ne rapporte.</p>
<p><strong>La préparation de commande.</strong> Un carton pré-packé se scanne et se charge. Une paire isolée se cherche, se prélève, se remballe et se saisit — douze fois au lieu d'une, pour douze paires.</p>
<p><strong>Les fins de série.</strong> Qui vend à la paire écoule d'abord le milieu de gamme et conserve les extrémités. Ces invendus finissent en démarque, et cette démarque se retrouve dans tous les prix.</p>
<h2>Construire un assortiment</h2>
<p>L'erreur courante consiste à acheter un modèle trop en profondeur. À huit ou douze paires par carton, un second carton du même modèle dans le même coloris apporte deux paires de plus dans chaque taille médiane — et un linéaire qui paraît plus étroit qu'il ne l'est.</p>
<p>Mieux vaut en général un carton par modèle et par coloris, sur davantage de modèles. Le <a href="/fr/product/692-black-leather-loafer">692 Black</a>, par exemple, a une ligne unisexe et couvre donc deux demandes à partir d'un seul carton.</p>
<p>Le second carton se justifie quand un modèle a fait la preuve qu'il tourne — pas à la commande initiale.</p>
<h2>Le haut de la série</h2>
<p>Un détail à retenir : le carton de 8 s'arrête au 44, ceux de 10 et de 12 montent au 45. Si votre clientèle chausse grand, c'est là que se joue la différence entre les formats, davantage que sur le prix unitaire.</p>
<p>La série complète et les formats disponibles figurent sur chaque fiche produit du <a href="/fr/catalogue">catalogue</a>.</p>`,
  },
  {
    slug: "reconnaitre-cuir-pleine-fleur-guide-achat",
    locale: "fr",
    title: "Reconnaître un cuir de qualité : guide d'achat des matières",
    excerpt:
      "Comment identifier, à l'achat en gros, ce que l'on a réellement entre les mains — et pourquoi les écarts de teinte entre deux peaux ne sont pas un défaut.",
    category: "Buyer Guides",
    tags: ["cuir", "daim", "qualité", "matières", "achat"],
    featured_image_url: img.groom5101,
    content_html: `<p>La mention « cuir véritable » sur une étiquette ne dit presque rien de l'état d'une chaussure après deux saisons. À l'achat, il vaut mieux connaître les couches de la peau et savoir laquelle on a devant soi.</p>
<h2>Les couches</h2>
<p><strong>Le cuir pleine fleur</strong> est la couche externe de la peau, fleur intacte. Elle n'est pas poncée : la structure naturelle des fibres est conservée. C'est la couche dense et résistante, celle qui prend une patine avec les années au lieu de s'user.</p>
<p><strong>Le cuir fleur corrigée</strong> est la même couche, légèrement poncée pour effacer les irrégularités, souvent suivie d'un grain imprimé. Plus régulier à l'œil, un peu moins durable.</p>
<p><strong>Le daim</strong> provient du côté croûte de la peau et il est gratté. Ce n'est pas un cuir au rabais, c'est une autre matière, aux propriétés différentes : plus souple, plus légère, plus sensible à l'eau et au sel. Un modèle d'été comme le <a href="/fr/product/020-suede-boat-loafer">020 Suede Boat</a> est en daim précisément pour cette raison.</p>
<h2>Ce qui se vérifie sur la chaussure</h2>
<ul>
<li><strong>La tranche.</strong> Sur une coupe, la fibre est visible. Un pleine fleur est dense sur toute l'épaisseur ; une croûte enduite laisse voir une séparation nette entre la surface et le support.</li>
<li><strong>Le grain.</strong> Un grain naturel ne se répète pas. Un motif rigoureusement identique sur toute la surface est imprimé.</li>
<li><strong>La doublure.</strong> Une doublure respirante coûte plus cher qu'un textile contrecollé, et c'est justement là qu'on économise : le client ne s'en aperçoit qu'à l'usage.</li>
<li><strong>Le montage tige-semelle.</strong> Collage net et régulier, sans débord.</li>
</ul>
<h2>Pourquoi deux paires ne sont pas identiques</h2>
<p>C'est la source de la plupart des malentendus dans le commerce de gros. Le cuir est une matière naturelle : grain, prise de teinte et finition varient d'une peau à l'autre et d'un lot à l'autre. Deux paires d'un même modèle issues de deux productions peuvent différer visiblement sans qu'aucune ne soit défectueuse.</p>
<p>Deux conséquences pratiques pour un détaillant. D'abord, si vous complétez un modèle dans un coloris pour une vitrine, commandez-le en une seule fois plutôt qu'étalé sur deux saisons. Ensuite, cette variation n'est pas un défaut — nos <a href="/fr/terms">conditions de vente</a> le précisent explicitement.</p>
<h2>Ce que nous employons</h2>
<p>Nos modèles sont montés en cuir véritable ou en daim, avec doublure respirante et semelle antidérapante ; la liste des matières figure sur chaque fiche produit. La maison fabrique depuis 1984 à Héraklion, en Crète, et ne vend qu'au commerce.</p>
<p>L'ensemble de la collection est dans le <a href="/fr/catalogue">catalogue</a>.</p>`,
  },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const slugs = posts.map((p) => p.slug);
  const { data: clashes, error: clashErr } = await db.from("journal_posts").select("slug").in("slug", slugs);
  if (clashErr) throw clashErr;
  if (clashes && clashes.length > 0) {
    console.log("REFUSED — these slugs already exist:", clashes.map((c) => (c as { slug: string }).slug).join(", "));
    process.exitCode = 1;
    return;
  }

  // Every internal link must resolve. A 404 inside an article is worse than no article,
  // and eight articles across four languages is exactly where a typo hides.
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
  }
  if (bad > 0) {
    console.log(`\n${bad} broken link(s) — nothing written.`);
    process.exitCode = 1;
    return;
  }
  console.log("all internal links resolve to live styles or known routes");

  const now = new Date();
  const rows = posts.map((post, i) => ({
    slug: post.slug,
    locale: post.locale,
    title: post.title,
    excerpt: post.excerpt,
    content_html: post.content_html,
    category: post.category,
    tags: post.tags,
    featured_image_url: post.featured_image_url,
    featured_image_path: null,
    author_name: "Hector Footwear Team",
    featured: false,
    status: "published",
    // Staggered by a minute so the index has a stable, deterministic order.
    published_at: new Date(now.getTime() - i * 60_000).toISOString(),
    robots: "index,follow",
  }));

  console.log(`\n${rows.length} posts:`);
  for (const r of rows) console.log(`  [${r.locale}] ${r.slug}  (${r.content_html.length} chars)`);

  if (!apply) {
    console.log("\nDRY RUN — pass --apply to write.");
    return;
  }

  const { error } = await db.from("journal_posts").insert(rows);
  if (error) throw error;
  console.log(`\ninserted ${rows.length} posts`);
}

main();
