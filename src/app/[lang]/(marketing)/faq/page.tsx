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

const GROUPS_EN: FaqGroup[] = [
  {
    title: "Ordering & Box Policy",
    items: [
      {
        q: "Can I order single pairs?",
        a: "No — Hector Footwear sells wholesale only in fixed pre-pack boxes (8, 10, or 12 pairs), never as single pairs. Every box spans EU sizes 40–45 in a set ratio, so the box is the ordering unit, not the individual size.",
      },
      {
        q: "What if I only need a few pairs in one size?",
        a: "Every box already spreads sizes 40–45 across the printed ratio for that box type — you can't pick a single size out of a box. Choose the box size (8/10/12-pair) that best matches the size run your floor sells.",
      },
      {
        q: "Is there a minimum order?",
        a: "Yes — a single order-wide minimum of 40 pairs, not a per-style minimum. Mix as many styles, colorways, and box sizes as you like across your cart to reach it; your cart shows a running pair count as you go.",
      },
      {
        q: "What's the difference between Quick Order and the Catalogue?",
        a: "Quick Order is a fast, table-style view for building box quantities across many styles at once. The Catalogue and individual product pages give you the full matrix ordering screen for one style at a time, with more detail and photography.",
      },
    ],
  },
  {
    title: "Pricing & Payment Terms",
    items: [
      {
        q: "How is my price calculated?",
        a: "One simple rule, no account tiers: pay in full (prepay) for 10% off, net-30 for 5% off, or net-60 at list price. You choose your terms at checkout, and the total updates live.",
      },
      {
        q: "Can I use different payment terms on different orders?",
        a: "Yes. Your account has a default (shown on your dashboard), but you can select different terms per order at checkout. Requesting terms other than your account's default routes that order to your rep for credit approval before it ships.",
      },
      {
        q: "What currency is pricing shown in?",
        a: "All wholesale pricing on this site is in EUR (€).",
      },
      {
        q: "Are the prices I see in Quick Order or the Catalogue final?",
        a: "Those screens show list price (net-60) as a reference while you build your order. The final per-pair price — with any prepay or net-30 discount applied — is calculated at checkout once you select payment terms.",
      },
    ],
  },
  {
    title: "Wholesale Accounts",
    items: [
      {
        q: "How do I get a wholesale account?",
        a: "Apply from \"Apply for Wholesale Access\" with your store and resale certificate details. Our team typically reviews applications within 2 business days. Once approved, you're provisioned with a login and a territory rep.",
      },
      {
        q: "I can't log in — what do I do?",
        a: `Reach out to your territory rep (listed on your dashboard) or ${SUPPORT_EMAIL} and we'll help sort out access.`,
      },
      {
        q: "Who do I talk to about my account?",
        a: "Every approved account has a dedicated rep, shown on your dashboard with direct email and phone. That's the fastest way to reach us on anything account-specific.",
      },
    ],
  },
  {
    title: "Shipping & Delivery",
    items: [
      {
        q: "What's the difference between \"Available now\" and \"Pre-book\"?",
        a: "Available now styles ship within about 5 business days of order confirmation. Pre-book styles have a stated ship window (shown on the product page) and may arrive in a separate shipment if your order also includes at-once styles.",
      },
      {
        q: "Where do you ship?",
        a: `Shipping details vary by territory — contact your rep or ${SUPPORT_EMAIL} to confirm coverage and lead times for your location.`,
      },
    ],
  },
  {
    title: "The Collection",
    items: [
      {
        q: "What categories do you carry?",
        a: "Two seasonal collections: Summer (Loafers, Wedding, Sneakers, Sandals) and Winter (Boots, Sneakers, Formal, Anatomic).",
      },
      {
        q: "Can I browse without an account?",
        a: "Yes — the Collections lookbook is open to everyone. Wholesale pricing and matrix ordering unlock once you're signed in with an approved account.",
      },
      {
        q: "Does every style come in all three box sizes?",
        a: "Not always. Each product page lists \"Sold as\" — the specific box sizes (8/10/12-pair) offered for that style.",
      },
    ],
  },
];

// Real, natural Greek B2B copy — not a machine translation of GROUPS_EN — since Greek is
// this site's priority locale for both traditional and AI search. German/French readers
// currently still see the English array (GROUPS_BY_LOCALE below) until those get the same
// treatment.
const GROUPS_EL: FaqGroup[] = [
  {
    title: "Παραγγελίες & Πολιτική Κιβωτίων",
    items: [
      {
        q: "Μπορώ να παραγγείλω μεμονωμένα ζευγάρια;",
        a: "Όχι — η Hector Footwear πουλάει αποκλειστικά χονδρική, σε σταθερά προσυσκευασμένα κιβώτια (8, 10 ή 12 ζευγάρια), ποτέ ένα-ένα ζευγάρι. Κάθε κιβώτιο καλύπτει τα ευρωπαϊκά νούμερα 40–45 σε συγκεκριμένη αναλογία, οπότε η μονάδα παραγγελίας είναι το κιβώτιο, όχι το μεμονωμένο νούμερο.",
      },
      {
        q: "Τι γίνεται αν χρειάζομαι λίγα ζευγάρια σε ένα μόνο νούμερο;",
        a: "Κάθε κιβώτιο διανέμει ήδη τα νούμερα 40–45 σύμφωνα με την τυπωμένη αναλογία του — δεν μπορείτε να επιλέξετε ένα μόνο νούμερο ξεχωριστά. Επιλέξτε το μέγεθος κιβωτίου (8/10/12 ζευγάρια) που ταιριάζει καλύτερα στην πωλησιμότητα του καταστήματός σας.",
      },
      {
        q: "Υπάρχει ελάχιστη παραγγελία;",
        a: "Ναι — ένα ενιαίο ελάχιστο 40 ζευγαριών ανά παραγγελία, όχι ανά μοντέλο. Συνδυάστε όσα μοντέλα, χρώματα και μεγέθη κιβωτίων θέλετε στο καλάθι σας για να το φτάσετε· το καλάθι δείχνει τον τρέχοντα αριθμό ζευγαριών καθώς προσθέτετε.",
      },
      {
        q: "Ποια είναι η διαφορά μεταξύ Γρήγορης Παραγγελίας και Καταλόγου;",
        a: "Η Γρήγορη Παραγγελία είναι μια γρήγορη προβολή τύπου πίνακα για να χτίσετε ποσότητες κιβωτίων σε πολλά μοντέλα ταυτόχρονα. Ο Κατάλογος και οι σελίδες μεμονωμένων προϊόντων προσφέρουν την πλήρη οθόνη παραγγελίας πίνακα για ένα μοντέλο τη φορά, με περισσότερες λεπτομέρειες και φωτογραφίες.",
      },
    ],
  },
  {
    title: "Τιμές & Όροι Πληρωμής",
    items: [
      {
        q: "Πώς υπολογίζεται η τιμή μου;",
        a: "Ένας απλός κανόνας, χωρίς κατηγορίες λογαριασμού: εξόφληση τοις μετρητοίς (prepay) για 10% έκπτωση, εξόφληση σε 30 ημέρες για 5% έκπτωση, ή τιμή καταλόγου για εξόφληση σε 60 ημέρες. Επιλέγετε τους όρους σας κατά την ολοκλήρωση παραγγελίας και το σύνολο ενημερώνεται άμεσα.",
      },
      {
        q: "Μπορώ να χρησιμοποιήσω διαφορετικούς όρους πληρωμής σε διαφορετικές παραγγελίες;",
        a: "Ναι. Ο λογαριασμός σας έχει έναν προεπιλεγμένο όρο (εμφανίζεται στον πίνακα ελέγχου σας), αλλά μπορείτε να επιλέξετε διαφορετικούς όρους ανά παραγγελία κατά την ολοκλήρωση. Αίτημα για όρους διαφορετικούς από την προεπιλογή του λογαριασμού σας δρομολογεί την παραγγελία στον εκπρόσωπό σας για έγκριση πίστωσης πριν αποσταλεί.",
      },
      {
        q: "Σε ποιο νόμισμα εμφανίζονται οι τιμές;",
        a: "Όλες οι τιμές χονδρικής στον ιστότοπο είναι σε ευρώ (€).",
      },
      {
        q: "Οι τιμές που βλέπω στη Γρήγορη Παραγγελία ή τον Κατάλογο είναι τελικές;",
        a: "Αυτές οι οθόνες δείχνουν την τιμή καταλόγου (εξόφληση σε 60 ημέρες) ως σημείο αναφοράς καθώς χτίζετε την παραγγελία σας. Η τελική τιμή ανά ζευγάρι — με τυχόν έκπτωση prepay ή 30 ημερών — υπολογίζεται κατά την ολοκλήρωση παραγγελίας, μόλις επιλέξετε τους όρους πληρωμής.",
      },
    ],
  },
  {
    title: "Λογαριασμοί Χονδρικής",
    items: [
      {
        q: "Πώς αποκτώ λογαριασμό χονδρικής;",
        a: "Υποβάλετε αίτηση από την «Αίτηση πρόσβασης» με τα στοιχεία του καταστήματός σας και το φορολογικό/επαγγελματικό σας προφίλ. Η ομάδα μας συνήθως αξιολογεί τις αιτήσεις εντός 2 εργάσιμων ημερών. Μόλις εγκριθείτε, αποκτάτε στοιχεία σύνδεσης και έναν εκπρόσωπο περιοχής.",
      },
      {
        q: "Δεν μπορώ να συνδεθώ — τι κάνω;",
        a: `Επικοινωνήστε με τον εκπρόσωπο της περιοχής σας (αναγράφεται στον πίνακα ελέγχου σας) ή στο ${SUPPORT_EMAIL} και θα σας βοηθήσουμε να αποκαταστήσετε την πρόσβαση.`,
      },
      {
        q: "Με ποιον μιλάω για τον λογαριασμό μου;",
        a: "Κάθε εγκεκριμένος λογαριασμός έχει έναν αποκλειστικό εκπρόσωπο, με στοιχεία επικοινωνίας ορατά στον πίνακα ελέγχου σας. Είναι ο πιο γρήγορος τρόπος επικοινωνίας για οτιδήποτε αφορά τον λογαριασμό σας.",
      },
    ],
  },
  {
    title: "Αποστολές & Παράδοση",
    items: [
      {
        q: "Ποια είναι η διαφορά μεταξύ «Άμεσα διαθέσιμο» και «Προπαραγγελία»;",
        a: "Τα μοντέλα «Άμεσα διαθέσιμα» αποστέλλονται εντός περίπου 5 εργάσιμων ημερών από την επιβεβαίωση της παραγγελίας. Τα μοντέλα «Προπαραγγελίας» έχουν συγκεκριμένο χρονικό παράθυρο αποστολής (αναγράφεται στη σελίδα του προϊόντος) και ενδέχεται να αποσταλούν ξεχωριστά αν η παραγγελία σας περιλαμβάνει και άμεσα διαθέσιμα μοντέλα.",
      },
      {
        q: "Σε ποιες περιοχές αποστέλλετε;",
        a: `Οι λεπτομέρειες αποστολής διαφέρουν ανά περιοχή — επικοινωνήστε με τον εκπρόσωπό σας ή στο ${SUPPORT_EMAIL} για να επιβεβαιώσετε κάλυψη και χρόνους παράδοσης για την τοποθεσία σας.`,
      },
    ],
  },
  {
    title: "Η Συλλογή",
    items: [
      {
        q: "Ποιες κατηγορίες διαθέτετε;",
        a: "Δύο εποχιακές συλλογές: Καλοκαιρινή (Loafers, Γαμήλια, Sneakers, Σανδάλια) και Χειμερινή (Μπότες, Sneakers, Επίσημα, Ανατομικά).",
      },
      {
        q: "Μπορώ να περιηγηθώ χωρίς λογαριασμό;",
        a: "Ναι — το lookbook της συλλογής είναι ανοιχτό σε όλους. Οι τιμές χονδρικής και η παραγγελία πίνακα ξεκλειδώνουν μόλις συνδεθείτε με εγκεκριμένο λογαριασμό.",
      },
      {
        q: "Κάθε μοντέλο διατίθεται και στα τρία μεγέθη κιβωτίου;",
        a: "Όχι πάντα. Κάθε σελίδα προϊόντος αναγράφει «Διατίθεται σε» — τα συγκεκριμένα μεγέθη κιβωτίου (8/10/12 ζευγάρια) που προσφέρονται για το συγκεκριμένο μοντέλο.",
      },
    ],
  },
];

const GROUPS_BY_LOCALE: Partial<Record<Locale, FaqGroup[]>> = { en: GROUPS_EN, el: GROUPS_EL };

export default async function FaqPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const f = dict.faq;
  const groups = GROUPS_BY_LOCALE[locale] ?? GROUPS_EN;

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
