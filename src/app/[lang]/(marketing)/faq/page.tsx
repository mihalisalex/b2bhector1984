import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { buildFaqSchema } from "@/lib/seoJsonLd";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { getHomepageHero } from "@/lib/data/siteContent";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return pageMetadata({
    title: dict.seo.faqTitle,
    description: dict.seo.faqDescription,
    path: "/faq",
    locale,
    // The Q&A body is now genuinely translated for English and Greek (see GROUPS_BY_LOCALE
    // below) — German/French still fall back to the English array for now, which is a
    // normal partial-rollout state search engines tolerate fine, not a duplicate-content
    // problem the way a wholesale-copied canonical would be.
  });
}

interface Faq {
  q: string;
  a: string;
}

interface FaqGroup {
  title: string;
  items: Faq[];
}

/**
 * Written from how the business actually works (owner, 2026-09-25): every order is produced
 * for the buyer and takes about `days` days (the production lead time set in /admin), any
 * style can be produced in any season, an order is a request that becomes a proforma with
 * the final price, shipping goes by the buyer's own courier at their cost, and only buyers
 * based in Greece pay Greek VAT. Each style comes in exactly one box format.
 */
function groupsEn(days: number): FaqGroup[] {
  return [
    {
      title: "Ordering & Boxes",
      items: [
        {
          q: "Can I order single pairs?",
          a: "No — we sell wholesale only, in fixed pre-pack boxes. Each style comes in one box format, shown as “Sold as” on its product page: an 8-pair box covering EU 40–44 or a 10-pair box covering EU 40–45. The box is the ordering unit.",
        },
        {
          q: "Which sizes are in a box?",
          a: "A set ratio, printed on every product page. The 10-pair box holds 1×40, 2×41, 2×42, 2×43, 2×44 and 1×45; the 8-pair box holds 1×40, 2×41, 2×42, 2×43 and 1×44. Single sizes can't be taken out of a box.",
        },
        {
          q: "Is there a minimum order?",
          a: "Yes — 40 pairs across the whole order, not per style. Mix as many styles and colours as you like to reach it; your cart shows a running pair count.",
        },
        {
          q: "What's the difference between Quick Order and the Catalogue?",
          a: "Quick Order is a fast table for entering box quantities across many styles at once. The Catalogue and product pages show one style at a time, with photos and full details.",
        },
      ],
    },
    {
      title: "Production & Delivery",
      items: [
        {
          q: "When will I receive my order?",
          a: `Every order is produced for you. Delivery is usually about ${days} days after we confirm your order. Very large orders can take longer — we confirm the delivery date on your invoice before anything is final.`,
        },
        {
          q: "Can I order a style outside its season?",
          a: "Yes. The Summer and Winter labels are only there to help you browse — we can produce winter boots in summer and summer styles in winter.",
        },
        {
          q: "What do “Pre-order” and “Made to order” mean?",
          a: `Both mean your pairs are produced after you order, and both usually take about ${days} days. If a style is ever on our shelves, its page says “Available now” and it ships within about 5 business days.`,
        },
      ],
    },
    {
      title: "Prices & Payment",
      items: [
        {
          q: "How is my price calculated?",
          a: "One simple rule: pay in advance for 10% off, net-30 for 5% off, or net-60 at list price. You choose your terms at checkout and the total updates as you do.",
        },
        {
          q: "Are the prices on the site final?",
          a: "They are our list prices. On large orders we may be able to offer a better price — the final price is the one on your invoice.",
        },
        {
          q: "How and when do I pay?",
          a: "Sending an order from the site is a request, not a payment. We check that production can make the exact quantities, then send you the invoice with the final price, the delivery date and our bank details — usually within one business day. Nothing is charged before that.",
        },
        {
          q: "Is VAT included?",
          a: "No, all prices exclude VAT. Buyers based in Greece pay Greek VAT (24%). Buyers based in any other country are invoiced without Greek VAT.",
        },
        {
          q: "What currency are prices in?",
          a: "Euro (€).",
        },
        {
          q: "Can I use different payment terms on different orders?",
          a: "Yes. Your account has a default (shown on your dashboard), and you can pick different terms per order at checkout. Terms other than your default are confirmed with you before production starts.",
        },
      ],
    },
    {
      title: "Shipping",
      items: [
        {
          q: "Where do you ship?",
          a: "Anywhere — throughout Greece and Cyprus, across Europe and beyond.",
        },
        {
          q: "Who pays for shipping, and which courier do you use?",
          a: "Shipping is paid by the buyer, with the courier of your choice. When your order is ready we ask which courier to hand it to — for example your own DHL, ACS or Geniki Taxydromiki account — and the cost is whatever you have agreed with them.",
        },
      ],
    },
    {
      title: "Wholesale Accounts",
      items: [
        {
          q: "How do I get a wholesale account?",
          a: "Apply from “Apply for access” with your business details and VAT number. A person reviews every application, usually within 2 business days, and you'll get an email to set your password once you're approved.",
        },
        {
          q: "I can't log in — what do I do?",
          a: `Use “Forgot password?” on the login page, or email ${SUPPORT_EMAIL} and we'll sort out access.`,
        },
        {
          q: "Who do I talk to about my account or an order?",
          a: `Your contact at Hector Footwear is shown on your dashboard with their email and phone. You can always write to ${SUPPORT_EMAIL} as well.`,
        },
      ],
    },
    {
      title: "The Collection",
      items: [
        {
          q: "What categories do you carry?",
          a: "Men's leather loafers, formal and groom's shoes, boots, sneakers and sandals, grouped into a Summer and a Winter collection.",
        },
        {
          q: "Can I browse without an account?",
          a: "Yes — the full catalogue, with photos, box sizes and specifications, is open to everyone. Wholesale prices and ordering unlock once your account is approved.",
        },
      ],
    },
  ];
}

function groupsEl(days: number): FaqGroup[] {
  return [
    {
      title: "Παραγγελίες & Κιβώτια",
      items: [
        {
          q: "Μπορώ να παραγγείλω μεμονωμένα ζευγάρια;",
          a: "Όχι — πουλάμε μόνο χονδρική, σε σταθερά κιβώτια. Κάθε μοντέλο έρχεται σε ένα μόνο είδος κιβωτίου, που φαίνεται ως «Πωλείται σε» στη σελίδα του: κιβώτιο 8 ζευγαριών με νούμερα 40–44 ή κιβώτιο 10 ζευγαριών με νούμερα 40–45. Η μονάδα παραγγελίας είναι το κιβώτιο.",
        },
        {
          q: "Ποια νούμερα έχει ένα κιβώτιο;",
          a: "Σταθερή αναλογία, που αναγράφεται σε κάθε σελίδα προϊόντος. Το κιβώτιο 10 ζευγαριών έχει 1×40, 2×41, 2×42, 2×43, 2×44 και 1×45· το κιβώτιο 8 ζευγαριών έχει 1×40, 2×41, 2×42, 2×43 και 1×44. Δεν γίνεται να βγει μεμονωμένο νούμερο από το κιβώτιο.",
        },
        {
          q: "Υπάρχει ελάχιστη παραγγελία;",
          a: "Ναι — 40 ζευγάρια σε όλη την παραγγελία, όχι ανά μοντέλο. Συνδυάστε όσα μοντέλα και χρώματα θέλετε· το καλάθι δείχνει συνεχώς πόσα ζευγάρια έχετε.",
        },
        {
          q: "Ποια είναι η διαφορά Γρήγορης Παραγγελίας και Καταλόγου;",
          a: "Η Γρήγορη Παραγγελία είναι ένας γρήγορος πίνακας για να βάζετε κιβώτια σε πολλά μοντέλα μαζί. Ο Κατάλογος και οι σελίδες προϊόντων δείχνουν ένα μοντέλο τη φορά, με φωτογραφίες και όλες τις λεπτομέρειες.",
        },
      ],
    },
    {
      title: "Παραγωγή & Παράδοση",
      items: [
        {
          q: "Πότε θα παραλάβω την παραγγελία μου;",
          a: `Κάθε παραγγελία παράγεται για εσάς. Η παράδοση γίνεται συνήθως περίπου ${days} ημέρες μετά την επιβεβαίωση της παραγγελίας. Οι πολύ μεγάλες παραγγελίες μπορεί να χρειαστούν περισσότερο — την ημερομηνία παράδοσης την επιβεβαιώνουμε στο τιμολόγιο, πριν οριστικοποιηθεί οτιδήποτε.`,
        },
        {
          q: "Μπορώ να παραγγείλω ένα μοντέλο εκτός σεζόν;",
          a: "Ναι. Οι ετικέτες Καλοκαίρι και Χειμώνας υπάρχουν μόνο για να σας βοηθούν στην περιήγηση — μπορούμε να παράγουμε μποτάκια το καλοκαίρι και καλοκαιρινά μοντέλα τον χειμώνα.",
        },
        {
          q: "Τι σημαίνουν «Προπαραγγελία» και «Κατά παραγγελία»;",
          a: `Και τα δύο σημαίνουν ότι τα ζευγάρια σας παράγονται μετά την παραγγελία, και στις δύο περιπτώσεις χρειάζονται περίπου ${days} ημέρες. Αν κάποιο μοντέλο υπάρχει έτοιμο στην αποθήκη, η σελίδα του γράφει «Άμεσα διαθέσιμο» και αποστέλλεται σε περίπου 5 εργάσιμες.`,
        },
      ],
    },
    {
      title: "Τιμές & Πληρωμή",
      items: [
        {
          q: "Πώς υπολογίζεται η τιμή μου;",
          a: "Ένας απλός κανόνας: προπληρωμή με έκπτωση 10%, πίστωση 30 ημερών με έκπτωση 5%, ή πίστωση 60 ημερών στην τιμή καταλόγου. Επιλέγετε τους όρους στην ολοκλήρωση της παραγγελίας και το σύνολο ενημερώνεται αμέσως.",
        },
        {
          q: "Οι τιμές στο site είναι τελικές;",
          a: "Είναι οι τιμές καταλόγου μας. Σε μεγάλες παραγγελίες μπορεί να σας προσφέρουμε καλύτερη τιμή — τελική είναι η τιμή του τιμολογίου σας.",
        },
        {
          q: "Πώς και πότε πληρώνω;",
          a: "Η αποστολή παραγγελίας από το site είναι αίτημα, όχι πληρωμή. Ελέγχουμε ότι η παραγωγή μπορεί να βγάλει τις ακριβείς ποσότητες και σας στέλνουμε τιμολόγιο με την τελική τιμή, την ημερομηνία παράδοσης και τα τραπεζικά μας στοιχεία — συνήθως μέσα σε μία εργάσιμη. Δεν χρεώνεται τίποτα πριν από αυτό.",
        },
        {
          q: "Περιλαμβάνεται ο ΦΠΑ;",
          a: "Όχι, όλες οι τιμές είναι χωρίς ΦΠΑ. Οι πελάτες με έδρα στην Ελλάδα επιβαρύνονται με ΦΠΑ 24%. Οι πελάτες με έδρα σε οποιαδήποτε άλλη χώρα τιμολογούνται χωρίς ελληνικό ΦΠΑ.",
        },
        {
          q: "Σε ποιο νόμισμα είναι οι τιμές;",
          a: "Σε ευρώ (€).",
        },
        {
          q: "Μπορώ να έχω διαφορετικούς όρους πληρωμής σε κάθε παραγγελία;",
          a: "Ναι. Ο λογαριασμός σας έχει προεπιλεγμένους όρους (φαίνονται στον πίνακα ελέγχου) και μπορείτε να διαλέξετε άλλους σε κάθε παραγγελία. Όροι διαφορετικοί από τους προεπιλεγμένους επιβεβαιώνονται μαζί σας πριν ξεκινήσει η παραγωγή.",
        },
      ],
    },
    {
      title: "Αποστολή",
      items: [
        {
          q: "Πού αποστέλλετε;",
          a: "Παντού — σε όλη την Ελλάδα και την Κύπρο, στην Ευρώπη και εκτός.",
        },
        {
          q: "Ποιος πληρώνει τα μεταφορικά και με ποια εταιρεία στέλνετε;",
          a: "Τα μεταφορικά τα πληρώνει ο πελάτης, με τη μεταφορική της επιλογής του. Όταν η παραγγελία είναι έτοιμη σας ρωτάμε σε ποια μεταφορική να την παραδώσουμε — για παράδειγμα στον δικό σας λογαριασμό DHL, ACS ή Γενικής Ταχυδρομικής — και το κόστος είναι αυτό που έχετε συμφωνήσει μαζί της.",
        },
      ],
    },
    {
      title: "Λογαριασμοί Χονδρικής",
      items: [
        {
          q: "Πώς αποκτώ λογαριασμό χονδρικής;",
          a: "Κάντε αίτηση από το «Αίτηση πρόσβασης» με τα στοιχεία της επιχείρησης και το ΑΦΜ σας. Κάθε αίτηση την εξετάζει άνθρωπος, συνήθως μέσα σε 2 εργάσιμες, και μόλις εγκριθεί θα λάβετε email για να ορίσετε κωδικό.",
        },
        {
          q: "Δεν μπορώ να συνδεθώ — τι κάνω;",
          a: `Πατήστε «Ξεχάσατε τον κωδικό;» στη σελίδα σύνδεσης ή στείλτε email στο ${SUPPORT_EMAIL} και θα σας βοηθήσουμε.`,
        },
        {
          q: "Με ποιον μιλάω για τον λογαριασμό ή μια παραγγελία μου;",
          a: `Ο υπεύθυνός σας στη Hector Footwear φαίνεται στον πίνακα ελέγχου, με email και τηλέφωνο. Μπορείτε πάντα να γράψετε και στο ${SUPPORT_EMAIL}.`,
        },
      ],
    },
    {
      title: "Η Συλλογή",
      items: [
        {
          q: "Ποιες κατηγορίες διαθέτετε;",
          a: "Ανδρικά δερμάτινα μοκασίνια, επίσημα και γαμπριάτικα παπούτσια, μποτάκια, sneakers και πέδιλα, σε καλοκαιρινή και χειμερινή συλλογή.",
        },
        {
          q: "Μπορώ να δω τον κατάλογο χωρίς λογαριασμό;",
          a: "Ναι — όλος ο κατάλογος, με φωτογραφίες, κιβώτια και τεχνικά στοιχεία, είναι ανοιχτός σε όλους. Οι τιμές χονδρικής και οι παραγγελίες ανοίγουν μόλις εγκριθεί ο λογαριασμός σας.",
        },
      ],
    },
  ];
}

const GROUPS_BY_LOCALE: Partial<Record<Locale, (days: number) => FaqGroup[]>> = { en: groupsEn, el: groupsEl };

export default async function FaqPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const f = dict.faq;
  const hero = await getHomepageHero();
  const groups = (GROUPS_BY_LOCALE[locale] ?? groupsEn)(hero.productionLeadTimeDays);

  // FAQPage markup makes these questions eligible for rich results. Built from the same
  // `groups` array the page renders for this locale, so the two can never drift apart —
  // marking up an answer that isn't on the page is a policy violation.
  const settings = await getSeoSettings();
  const faqSchema = buildFaqSchema(
    groups.flatMap((group) => group.items),
    settings,
  );

  return (
    <div>
      <JsonLd schema={faqSchema} />
      {/* Bigger, more confident header — same flat left-aligned treatment as /collections,
          sized up rather than a modest text-3xl. */}
      <div className="mx-auto max-w-[900px] px-6 pb-6 pt-16 lg:px-10 lg:pt-24">
        <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">{dict.nav.faq}</span>
        <h1 className="font-display mt-4 text-5xl font-bold uppercase leading-[0.98] tracking-tight text-ink sm:text-6xl">
          {f.heading}
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft">{f.intro}</p>
      </div>

      <section className="mx-auto max-w-[900px] px-6 py-16 lg:py-20 lg:px-10">
        <div className="flex flex-col gap-16">
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className="font-display border-b border-stone-300 pb-4 text-2xl font-bold uppercase tracking-tight text-ink">
                {group.title}
              </h2>
              <div className="mt-2 divide-y divide-stone-200">
                {group.items.map((item) => (
                  <details key={item.q} className="group py-5 transition-colors hover:bg-stone-50">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-1 text-[15px] font-semibold text-ink marker:content-none">
                      {item.q}
                      <span
                        aria-hidden
                        className="relative flex h-6 w-6 shrink-0 items-center justify-center text-ink-soft"
                      >
                        <span className="absolute h-[1.5px] w-3.5 bg-current transition-transform duration-200 group-open:rotate-180" />
                        <span className="absolute h-3.5 w-[1.5px] bg-current transition-transform duration-200 group-open:rotate-90 group-open:opacity-0" />
                      </span>
                    </summary>
                    <p className="mt-3 max-w-[65ch] px-1 text-sm leading-relaxed text-ink-soft">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
              {f.stillHaveQuestions}
            </h2>
            <p className="mt-1 text-sm text-stone-300/80">
              <Link href={withLocale(locale, "/contact")} className="underline underline-offset-2 hover:text-white">
                {f.contactLinkText}
              </Link>{" "}
              {f.contactSuffix}
            </p>
          </div>
          <LinkButton href={withLocale(locale, "/apply")} size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
            {dict.nav.applyForAccess}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
