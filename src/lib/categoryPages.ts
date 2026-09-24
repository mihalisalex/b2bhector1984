import type { Locale } from "@/i18n/config";
import type { Category } from "@/lib/types";

/**
 * Category landing pages — /collections/<slug>.
 *
 * Why these exist: buyers search by category ("ανδρικά δερμάτινα σανδάλια χονδρική",
 * "men's leather boots wholesale"), and until now a category was only a filter on
 * /collections and /catalogue — a query string, which Google treats as the same page. Each
 * category now has one indexable URL with its own title, copy and product list.
 *
 * Every claim here is checked against the data or confirmed by the owner (Hector makes its
 * own shoes — confirmed 2026-09-24; production location deliberately not stated):
 *  - box format is fixed per style, never chosen: 8 pairs (EU 40–44) or 10 pairs (EU 40–45),
 *    and the product page says which (see scripts/fixBoxSizeClaims.ts for why this matters);
 *  - the minimum is per account, in pairs, across the whole order — styles can be mixed;
 *  - availability is pre-order or made to order, as set per style;
 *  - prices are shown to approved, signed-in accounts only.
 * If any of those change, change the copy with them.
 *
 * Only categories that have products get a page. `wedding` and `anatomic` exist in the
 * schema but are empty; groom shoes currently live under `formal`, so that page covers them.
 */

export interface CategoryFaq {
  q: string;
  a: string;
}

export interface CategoryPageCopy {
  /** <title>. Kept within ~60 characters on its own. */
  title: string;
  /** Meta description, ≤155 characters. */
  description: string;
  h1: string;
  /** Short label for links and breadcrumbs. */
  label: string;
  intro: string[];
  faq: CategoryFaq[];
}

export interface CategoryPage {
  category: Category;
  slug: string;
  copy: Record<Locale, CategoryPageCopy>;
}

const BOX_EL =
  "Κάθε μοντέλο πωλείται σε ένα σταθερό κιβώτιο πλήρους σειράς μεγεθών: είτε 8 ζευγαριών με νούμερα 40–44 είτε 10 ζευγαριών με νούμερα 40–45. Η σελίδα κάθε προϊόντος δείχνει ποιο ισχύει.";
const BOX_EN =
  "Every style ships in one fixed, full size-run box: either 8 pairs in EU 40–44 or 10 pairs in EU 40–45. Each product page shows which.";
const BOX_DE =
  "Jedes Modell wird in einem festen Karton mit kompletter Größenserie geliefert: 8 Paar in EU 40–44 oder 10 Paar in EU 40–45. Die Produktseite zeigt, welcher gilt.";
const BOX_FR =
  "Chaque modèle est livré dans un carton fixe à série de tailles complète : 8 paires en 40–44 ou 10 paires en 40–45. La fiche produit indique lequel.";

const MIN_EL: CategoryFaq = {
  q: "Ποια είναι η ελάχιστη παραγγελία;",
  a: "Η ελάχιστη παραγγελία ορίζεται σε ζευγάρια ανά λογαριασμό και ισχύει για όλη την παραγγελία, όχι ανά μοντέλο — μπορείτε να συνδυάσετε μοντέλα και χρώματα από όλες τις κατηγορίες. Το ακριβές όριο εμφανίζεται στο ταμείο και το συμφωνείτε με τον πωλητή σας.",
};
const MIN_EN: CategoryFaq = {
  q: "What is the minimum order?",
  a: "The minimum is set in pairs per account and applies to the whole order, not to each style — you can mix styles and colours from every category. The exact figure is shown at checkout and agreed with your sales rep.",
};
const MIN_DE: CategoryFaq = {
  q: "Wie hoch ist die Mindestbestellmenge?",
  a: "Die Mindestmenge gilt in Paaren pro Konto für die gesamte Bestellung, nicht pro Modell — Modelle und Farben aus allen Kategorien lassen sich kombinieren. Der genaue Wert steht an der Kasse und wird mit Ihrem Ansprechpartner vereinbart.",
};
const MIN_FR: CategoryFaq = {
  q: "Quel est le minimum de commande ?",
  a: "Le minimum est fixé en paires par compte et s'applique à toute la commande, pas à chaque modèle : vous pouvez combiner modèles et coloris de toutes les catégories. Le chiffre exact s'affiche au moment de la commande et se convient avec votre commercial.",
};

const PRICE_EL: CategoryFaq = {
  q: "Πού βλέπω τις τιμές χονδρικής;",
  a: "Οι τιμές εμφανίζονται μόνο σε εγκεκριμένους επαγγελματικούς λογαριασμούς. Κάντε αίτηση online — οι περισσότερες αιτήσεις αξιολογούνται μέσα σε 2 εργάσιμες ημέρες — και μετά την έγκριση βλέπετε τιμές και παραγγέλνετε απευθείας από τον κατάλογο.",
};
const PRICE_EN: CategoryFaq = {
  q: "Where can I see wholesale prices?",
  a: "Prices are shown only to approved trade accounts. Apply online — most applications are reviewed within 2 working days — and once approved you see prices and order directly from the catalogue.",
};
const PRICE_DE: CategoryFaq = {
  q: "Wo sehe ich die Großhandelspreise?",
  a: "Preise sehen nur freigegebene Händlerkonten. Beantragen Sie ein Konto online — die meisten Anträge werden innerhalb von 2 Werktagen geprüft — und bestellen Sie danach direkt aus dem Katalog.",
};
const PRICE_FR: CategoryFaq = {
  q: "Où voir les prix de gros ?",
  a: "Les prix sont réservés aux comptes professionnels validés. Faites votre demande en ligne — la plupart sont examinées sous 2 jours ouvrés — puis commandez directement depuis le catalogue.",
};

export const CATEGORY_PAGES: CategoryPage[] = [
  {
    category: "loafers",
    slug: "loafers",
    copy: {
      el: {
        title: "Ανδρικά Δερμάτινα Μοκασίνια & Loafers Χονδρική",
        description:
          "Ανδρικά loafers, boat shoes και εσπαντρίγιες από γνήσιο δέρμα και καστόρι, χονδρική ανά κιβώτιο για καταστήματα. Κατασκευή Hector Footwear από το 1984.",
        h1: "Ανδρικά Μοκασίνια & Loafers Χονδρική",
        label: "Μοκασίνια & Loafers",
        intro: [
          "Τα loafers είναι η μεγαλύτερη κατηγορία της Hector Footwear και το παπούτσι που κρατά την καλοκαιρινή βιτρίνα ενός ανδρικού καταστήματος. Η σειρά περιλαμβάνει κλασικά δερμάτινα loafers, boat shoes και μοκασίνια από καστόρι σε ταμπά, μπεζ και μπλε, καθώς και δερμάτινες εσπαντρίγιες για τους πιο ζεστούς μήνες. Όλα τα μοντέλα είναι δικής μας κατασκευής.",
          "Τα περισσότερα μοντέλα έχουν επάνω μέρος από γνήσιο δέρμα ή καστόρι, εσωτερική φόδρα που αναπνέει και αντιολισθητική σόλα — ελαφριά κατασκευή που φοριέται όλη μέρα χωρίς κάλτσα. Διατίθενται σε ουδέτερα χρώματα που συνδυάζονται εύκολα με λινό και chino, ώστε να πουλιούνται σε ευρύ κοινό.",
          `${BOX_EL} Τα loafers παραγγέλνονται ως προπαραγγελία, και ο χρόνος αποστολής επιβεβαιώνεται μόλις προγραμματιστεί η παραγωγή — γι' αυτό αξίζει να κλείνετε την καλοκαιρινή παραγγελία νωρίς.`,
        ],
        faq: [
          {
            q: "Πότε πρέπει να παραγγείλω loafers για το καλοκαίρι;",
            a: "Τα loafers πωλούνται ως προπαραγγελία, οπότε η παραγγελία που κλείνεται νωρίτερα μπαίνει νωρίτερα στην παραγωγή. Προτείνουμε να κλείνετε την καλοκαιρινή παραγγελία στα τέλη του χειμώνα.",
          },
          MIN_EL,
          PRICE_EL,
        ],
      },
      en: {
        title: "Men's Leather Loafers Wholesale",
        description:
          "Men's leather and suede loafers, boat shoes and espadrilles, wholesale by the box for independent retailers. Made by Hector Footwear since 1984.",
        h1: "Men's Leather Loafers Wholesale",
        label: "Loafers",
        intro: [
          "Loafers are Hector Footwear's largest category and the shoe that carries a menswear store's summer window. The range covers classic leather loafers, boat shoes and suede slip-ons in taba, beige and blue, plus leather espadrilles for the warmest months. Every style is made by us.",
          "Most styles pair a genuine leather or suede upper with a breathable lining and a slip-resistant outsole — a light build that can be worn all day without socks. The colours are deliberately neutral, so they sit easily with linen and chinos and sell to a broad customer.",
          `${BOX_EN} Loafers are sold on pre-order, with shipping timed once production is scheduled — so the summer buy is worth placing early.`,
        ],
        faq: [
          {
            q: "When should I order loafers for summer?",
            a: "Loafers are sold on pre-order, so an order placed earlier goes into production earlier. We suggest placing the summer buy in late winter.",
          },
          MIN_EN,
          PRICE_EN,
        ],
      },
      de: {
        title: "Herren-Loafer aus Leder im Großhandel",
        description:
          "Herren-Loafer, Bootsschuhe und Espadrilles aus Leder und Veloursleder im Großhandel, kartonweise. Hergestellt von Hector Footwear seit 1984.",
        h1: "Herren-Loafer aus Leder im Großhandel",
        label: "Loafer",
        intro: [
          "Loafer sind die größte Kategorie von Hector Footwear: klassische Leder-Loafer, Bootsschuhe und Slipper aus Veloursleder in Taba, Beige und Blau, dazu Leder-Espadrilles für die warmen Monate. Alle Modelle stammen aus eigener Herstellung.",
          "Die meisten Modelle kombinieren ein Obermaterial aus echtem Leder oder Veloursleder mit atmungsaktivem Futter und rutschfester Laufsohle. Die neutralen Farben passen zu Leinen und Chinos und sprechen eine breite Kundschaft an.",
          `${BOX_DE} Loafer werden auf Vorbestellung verkauft; der Versandtermin wird bestätigt, sobald die Produktion eingeplant ist.`,
        ],
        faq: [MIN_DE, PRICE_DE],
      },
      fr: {
        title: "Mocassins homme en cuir en gros",
        description:
          "Mocassins, chaussures bateau et espadrilles homme en cuir et daim, en gros par carton pour les détaillants. Fabriqué par Hector Footwear depuis 1984.",
        h1: "Mocassins homme en cuir en gros",
        label: "Mocassins",
        intro: [
          "Les mocassins sont la plus grande catégorie de Hector Footwear : mocassins en cuir classiques, chaussures bateau et slip-on en daim en taba, beige et bleu, ainsi que des espadrilles en cuir pour les mois chauds. Tous les modèles sont de notre propre fabrication.",
          "La plupart des modèles associent une tige en cuir véritable ou en daim, une doublure respirante et une semelle antidérapante. Les coloris neutres s'accordent au lin et au chino et plaisent à une large clientèle.",
          `${BOX_FR} Les mocassins sont vendus en précommande ; la date d'expédition est confirmée dès que la production est planifiée.`,
        ],
        faq: [MIN_FR, PRICE_FR],
      },
    },
  },
  {
    category: "formal",
    slug: "formal-shoes",
    copy: {
      el: {
        title: "Ανδρικά Επίσημα Παπούτσια & Παπούτσια Γαμπρού Χονδρική",
        description:
          "Ανδρικά επίσημα δετά, επίσημα loafers και παπούτσια γαμπρού από γνήσιο δέρμα, χονδρική ανά κιβώτιο για καταστήματα. Κατασκευή Hector Footwear από το 1984.",
        h1: "Ανδρικά Επίσημα Παπούτσια & Παπούτσια Γαμπρού",
        label: "Επίσημα & Γαμπρού",
        intro: [
          "Τα επίσημα παπούτσια είναι η κατηγορία που πουλά όλο τον χρόνο: γάμοι, βαπτίσεις, τελετές και το καθημερινό κοστούμι του γραφείου. Η σειρά της Hector Footwear περιλαμβάνει κλασικά δετά σε μαύρο, καφέ και κάμελ, επίσημα loafers και παπούτσια γαμπρού σε μαύρο και ταμπά. Όλα τα μοντέλα είναι δικής μας κατασκευής.",
          "Τα παπούτσια γαμπρού ταιριάζουν με μπλε, γκρι ή μπεζ κοστούμι και είναι φτιαγμένα για πολλές ώρες ορθοστασίας. Όλα τα μοντέλα έχουν επάνω μέρος από γνήσιο δέρμα, φόδρα που αναπνέει και αντιολισθητική σόλα — ορισμένα με σόλα από φυσικό καουτσούκ.",
          `${BOX_EL} Ανάλογα με το μοντέλο, τα επίσημα πωλούνται ως προπαραγγελία ή κατασκευάζονται κατόπιν παραγγελίας, με εκτιμώμενη ημερομηνία που εμφανίζεται στην παραγγελία. Για τη γαμήλια σεζόν, παραγγείλετε με αρκετό περιθώριο πριν από την άνοιξη.`,
        ],
        faq: [
          {
            q: "Έχετε παπούτσια γαμπρού;",
            a: "Ναι. Τα παπούτσια γαμπρού βρίσκονται σε αυτή την κατηγορία, σε μαύρο και ταμπά δέρμα, μαζί με τα υπόλοιπα επίσημα μοντέλα.",
          },
          MIN_EL,
          PRICE_EL,
        ],
      },
      en: {
        title: "Men's Formal & Groom Shoes Wholesale",
        description:
          "Men's leather lace-ups, formal loafers and groom's shoes, wholesale by the box for independent retailers. Made by Hector Footwear since 1984.",
        h1: "Men's Formal & Groom Shoes Wholesale",
        label: "Formal & Groom",
        intro: [
          "Formal shoes sell all year round: weddings, christenings, ceremonies and the everyday office suit. Hector Footwear's range covers classic lace-ups in black, brown and tan, formal loafers, and groom's shoes in black and taba. Every style is made by us.",
          "The groom's shoes are built for long hours on your feet and suit a navy, grey or beige suit. Every style has a genuine leather upper, a breathable lining and a slip-resistant outsole — some on a real rubber sole.",
          `${BOX_EN} Depending on the style, formal shoes are sold on pre-order or made to order, with an estimated date shown on your order. For wedding season, order well ahead of spring.`,
        ],
        faq: [
          {
            q: "Do you sell groom's shoes?",
            a: "Yes. Groom's shoes are in this category, in black and taba leather, alongside the rest of the formal range.",
          },
          MIN_EN,
          PRICE_EN,
        ],
      },
      de: {
        title: "Elegante Herrenschuhe & Hochzeitsschuhe im Großhandel",
        description:
          "Herren-Schnürschuhe, Business-Loafer und Hochzeitsschuhe aus Leder im Großhandel, kartonweise. Hergestellt von Hector Footwear seit 1984.",
        h1: "Elegante Herrenschuhe & Hochzeitsschuhe",
        label: "Elegant & Hochzeit",
        intro: [
          "Elegante Schuhe verkaufen sich das ganze Jahr: Hochzeiten, Taufen, Feiern und der Anzug im Büro. Das Sortiment umfasst klassische Schnürschuhe in Schwarz, Braun und Tan, elegante Loafer sowie Hochzeitsschuhe in Schwarz und Taba. Alle Modelle stammen aus eigener Herstellung.",
          "Alle Modelle haben ein Obermaterial aus echtem Leder, atmungsaktives Futter und eine rutschfeste Laufsohle — einige mit Sohle aus Naturkautschuk.",
          `${BOX_DE} Je nach Modell auf Vorbestellung oder als Anfertigung nach Auftrag, mit voraussichtlichem Termin in der Bestellung.`,
        ],
        faq: [MIN_DE, PRICE_DE],
      },
      fr: {
        title: "Chaussures habillées et de mariage homme en gros",
        description:
          "Richelieus, mocassins habillés et chaussures de mariage homme en cuir, en gros par carton pour les détaillants. Fabriqué par Hector Footwear depuis 1984.",
        h1: "Chaussures habillées et de mariage homme",
        label: "Habillées & mariage",
        intro: [
          "Les chaussures habillées se vendent toute l'année : mariages, baptêmes, cérémonies et costume de bureau. La gamme comprend des richelieus classiques en noir, marron et camel, des mocassins habillés et des chaussures de mariage en noir et taba. Tous les modèles sont de notre propre fabrication.",
          "Tous les modèles ont une tige en cuir véritable, une doublure respirante et une semelle antidérapante — certains sur semelle en caoutchouc naturel.",
          `${BOX_FR} Selon le modèle, vente en précommande ou fabrication à la commande, avec une date estimée indiquée sur la commande.`,
        ],
        faq: [MIN_FR, PRICE_FR],
      },
    },
  },
  {
    category: "boots",
    slug: "boots",
    copy: {
      el: {
        title: "Ανδρικά Δερμάτινα Μποτάκια Χονδρική",
        description:
          "Ανδρικά δερμάτινα μποτάκια, casual και επίσημα, σε μαύρο, καφέ και ταμπά. Χονδρική ανά κιβώτιο για καταστήματα. Κατασκευή Hector Footwear από το 1984.",
        h1: "Ανδρικά Δερμάτινα Μποτάκια Χονδρική",
        label: "Μποτάκια",
        intro: [
          "Τα δερμάτινα μποτάκια είναι το βασικό παπούτσι της χειμερινής σεζόν. Η Hector Footwear προσφέρει ανδρικά μποτάκια σε μαύρο, καφέ και ταμπά — από casual σχέδια για τζιν μέχρι επίσημα μποτάκια που φοριούνται με κοστούμι. Όλα τα μοντέλα είναι δικής μας κατασκευής.",
          "Όλα τα μοντέλα έχουν επάνω μέρος από γνήσιο δέρμα, φόδρα που αναπνέει και αντιολισθητική σόλα για βρεγμένα πεζοδρόμια.",
          `${BOX_EL} Τα μποτάκια κατασκευάζονται κατόπιν παραγγελίας, με εκτιμώμενη ημερομηνία αποστολής που εμφανίζεται στην παραγγελία — γι' αυτό η χειμερινή παραγγελία αξίζει να κλείνει από το καλοκαίρι.`,
        ],
        faq: [
          {
            q: "Πόσο νωρίς να παραγγείλω μποτάκια για τον χειμώνα;",
            a: "Επειδή τα μποτάκια κατασκευάζονται κατόπιν παραγγελίας, προτείνουμε να κλείνετε τη χειμερινή παραγγελία μέσα στο καλοκαίρι, ώστε να φτάσουν πριν ξεκινήσει η σεζόν.",
          },
          MIN_EL,
          PRICE_EL,
        ],
      },
      en: {
        title: "Men's Leather Boots Wholesale",
        description:
          "Men's leather boots, casual and formal, in black, brown and taba. Wholesale by the box for independent retailers. Made by Hector Footwear since 1984.",
        h1: "Men's Leather Boots Wholesale",
        label: "Boots",
        intro: [
          "Leather boots are the backbone of the winter season. Hector Footwear offers men's boots in black, brown and taba — from casual styles for denim to formal boots worn with a suit. Every style is made by us.",
          "Every style has a genuine leather upper, a breathable lining and a slip-resistant outsole for wet pavements.",
          `${BOX_EN} Boots are made to order, with an estimated ship date shown on your order — so the winter buy is best placed during summer.`,
        ],
        faq: [
          {
            q: "How early should I order boots for winter?",
            a: "Because boots are made to order, we suggest placing the winter buy during summer so stock arrives before the season starts.",
          },
          MIN_EN,
          PRICE_EN,
        ],
      },
      de: {
        title: "Herren-Lederstiefel im Großhandel",
        description:
          "Herren-Stiefel aus Leder, casual und elegant, in Schwarz, Braun und Taba. Großhandel kartonweise. Hergestellt von Hector Footwear seit 1984.",
        h1: "Herren-Lederstiefel im Großhandel",
        label: "Stiefel",
        intro: [
          "Lederstiefel tragen die Wintersaison. Hector Footwear bietet Herrenstiefel in Schwarz, Braun und Taba — von Casual-Modellen zur Jeans bis zu eleganten Stiefeletten zum Anzug. Alle Modelle stammen aus eigener Herstellung.",
          "Alle Modelle haben ein Obermaterial aus echtem Leder, atmungsaktives Futter und eine rutschfeste Laufsohle.",
          `${BOX_DE} Stiefel werden nach Auftrag gefertigt, mit voraussichtlichem Versandtermin in der Bestellung — die Winterorder lohnt sich daher schon im Sommer.`,
        ],
        faq: [MIN_DE, PRICE_DE],
      },
      fr: {
        title: "Bottes homme en cuir en gros",
        description:
          "Bottes homme en cuir, casual et habillées, en noir, marron et taba. En gros par carton pour les détaillants. Fabriqué par Hector Footwear depuis 1984.",
        h1: "Bottes homme en cuir en gros",
        label: "Bottes",
        intro: [
          "Les bottes en cuir portent la saison d'hiver. Hector Footwear propose des bottes homme en noir, marron et taba — du modèle casuel pour le jean à la bottine habillée pour le costume. Tous les modèles sont de notre propre fabrication.",
          "Tous les modèles ont une tige en cuir véritable, une doublure respirante et une semelle antidérapante.",
          `${BOX_FR} Les bottes sont fabriquées à la commande, avec une date d'expédition estimée sur la commande — mieux vaut passer la commande d'hiver dès l'été.`,
        ],
        faq: [MIN_FR, PRICE_FR],
      },
    },
  },
  {
    category: "sneakers",
    slug: "sneakers",
    copy: {
      el: {
        title: "Ανδρικά Δερμάτινα Sneakers Χονδρική",
        description:
          "Ανδρικά sneakers από γνήσιο δέρμα και καστόρι σε μπεζ, γκρι και καφέ, με σόλα από καουτσούκ. Χονδρική ανά κιβώτιο. Κατασκευή Hector Footwear από το 1984.",
        h1: "Ανδρικά Δερμάτινα Sneakers Χονδρική",
        label: "Sneakers",
        intro: [
          "Τα δερμάτινα sneakers γεφυρώνουν το casual με το smart — το παπούτσι που ο πελάτης φορά από το γραφείο μέχρι το βράδυ. Η σειρά της Hector Footwear περιλαμβάνει sneakers από γνήσιο δέρμα και καστόρι σε μπεζ, γκρι και καφέ. Όλα τα μοντέλα είναι δικής μας κατασκευής.",
          "Έχουν φόδρα που αναπνέει και σόλα από καουτσούκ, με καθαρές γραμμές που ταιριάζουν τόσο με τζιν όσο και με chino.",
          `${BOX_EL} Τα sneakers παραγγέλνονται ως προπαραγγελία, και ο χρόνος αποστολής επιβεβαιώνεται μόλις προγραμματιστεί η παραγωγή.`,
        ],
        faq: [MIN_EL, PRICE_EL],
      },
      en: {
        title: "Men's Leather Sneakers Wholesale",
        description:
          "Men's leather and suede sneakers in beige, grey and brown on a rubber outsole. Wholesale by the box for retailers. Made by Hector Footwear since 1984.",
        h1: "Men's Leather Sneakers Wholesale",
        label: "Sneakers",
        intro: [
          "Leather sneakers bridge casual and smart — the shoe a customer wears from the office into the evening. Hector Footwear's range includes sneakers in genuine leather and suede, in beige, grey and brown. Every style is made by us.",
          "They have a breathable lining and a rubber outsole, with clean lines that work with denim and chinos alike.",
          `${BOX_EN} Sneakers are sold on pre-order, with shipping timed once production is scheduled.`,
        ],
        faq: [MIN_EN, PRICE_EN],
      },
      de: {
        title: "Herren-Ledersneaker im Großhandel",
        description:
          "Herren-Sneaker aus Leder und Veloursleder in Beige, Grau und Braun mit Gummisohle. Großhandel kartonweise für den Fachhandel. Hector Footwear.",
        h1: "Herren-Ledersneaker im Großhandel",
        label: "Sneaker",
        intro: [
          "Leder-Sneaker verbinden Casual und Smart — der Schuh vom Büro bis in den Abend. Das Sortiment umfasst Sneaker aus echtem Leder und Veloursleder in Beige, Grau und Braun. Alle Modelle stammen aus eigener Herstellung.",
          "Atmungsaktives Futter, Gummilaufsohle und klare Linien, die zu Jeans und Chinos passen.",
          `${BOX_DE} Sneaker werden auf Vorbestellung verkauft; der Versandtermin wird bestätigt, sobald die Produktion eingeplant ist.`,
        ],
        faq: [MIN_DE, PRICE_DE],
      },
      fr: {
        title: "Sneakers homme en cuir en gros",
        description:
          "Sneakers homme en cuir et daim, beige, gris et marron, sur semelle caoutchouc. En gros par carton pour les détaillants. Hector Footwear.",
        h1: "Sneakers homme en cuir en gros",
        label: "Sneakers",
        intro: [
          "Les sneakers en cuir font le lien entre casual et habillé — la chaussure qu'on porte du bureau jusqu'au soir. La gamme comprend des sneakers en cuir véritable et en daim, en beige, gris et marron. Tous les modèles sont de notre propre fabrication.",
          "Doublure respirante, semelle en caoutchouc et lignes épurées qui vont avec le jean comme avec le chino.",
          `${BOX_FR} Les sneakers sont vendues en précommande ; la date d'expédition est confirmée dès que la production est planifiée.`,
        ],
        faq: [MIN_FR, PRICE_FR],
      },
    },
  },
  {
    category: "sandals",
    slug: "sandals",
    copy: {
      el: {
        title: "Ανδρικά Δερμάτινα Σανδάλια Χονδρική",
        description:
          "Ανδρικά δερμάτινα σανδάλια σε μαύρο και καφέ, με ανατομικό πάτο. Χονδρική ανά κιβώτιο 10 ζευγαριών, νούμερα 40–45. Κατασκευή Hector Footwear από το 1984.",
        h1: "Ανδρικά Δερμάτινα Σανδάλια Χονδρική",
        label: "Σανδάλια",
        intro: [
          "Τα ανδρικά δερμάτινα σανδάλια είναι από τα πρώτα παπούτσια που ζητά ο πελάτης μόλις ανεβεί η θερμοκρασία — και στην Ελλάδα η σεζόν τους κρατά μήνες. Η Hector Footwear προσφέρει σανδάλια με λουριά από γνήσιο δέρμα σε μαύρο και καφέ. Όλα τα μοντέλα είναι δικής μας κατασκευής.",
          "Ο ανατομικός πάτος με επένδυση και η αντιολισθητική σόλα τα κάνουν άνετα για όλη μέρα, στην πόλη ή στο νησί.",
          "Τα σανδάλια πωλούνται σε κιβώτιο 10 ζευγαριών με νούμερα 40–45 και παραγγέλνονται ως προπαραγγελία, με χρόνο αποστολής που επιβεβαιώνεται μόλις προγραμματιστεί η παραγωγή — γι' αυτό η καλοκαιρινή παραγγελία αξίζει να κλείνει νωρίς.",
        ],
        faq: [
          {
            q: "Σε ποια νούμερα έρχονται τα σανδάλια;",
            a: "Τα σανδάλια πωλούνται σε κιβώτιο 10 ζευγαριών με πλήρη σειρά νούμερων 40–45.",
          },
          MIN_EL,
          PRICE_EL,
        ],
      },
      en: {
        title: "Men's Leather Sandals Wholesale",
        description:
          "Men's leather sandals in black and brown with a cushioned footbed. Wholesale in 10-pair boxes, EU 40–45, for retailers. Made by Hector Footwear since 1984.",
        h1: "Men's Leather Sandals Wholesale",
        label: "Sandals",
        intro: [
          "Men's leather sandals are among the first shoes customers ask for once the weather turns, and in southern markets the season runs for months. Hector Footwear offers sandals with genuine leather straps in black and brown. Every style is made by us.",
          "A contoured, cushioned footbed and a slip-resistant outsole make them comfortable all day, in town or on holiday.",
          "Sandals ship in a 10-pair box running EU 40–45 and are sold on pre-order, with shipping timed once production is scheduled — so the summer buy is worth placing early.",
        ],
        faq: [
          {
            q: "What sizes do the sandals come in?",
            a: "Sandals ship in a 10-pair box with a full EU 40–45 size run.",
          },
          MIN_EN,
          PRICE_EN,
        ],
      },
      de: {
        title: "Herren-Ledersandalen im Großhandel",
        description:
          "Herren-Sandalen aus Leder in Schwarz und Braun mit gepolstertem Fußbett. Großhandel im 10-Paar-Karton, EU 40–45. Hergestellt von Hector Footwear seit 1984.",
        h1: "Herren-Ledersandalen im Großhandel",
        label: "Sandalen",
        intro: [
          "Herren-Ledersandalen gehören zu den ersten Schuhen, nach denen Kunden bei warmem Wetter fragen. Hector Footwear bietet Sandalen mit Riemen aus echtem Leder in Schwarz und Braun. Alle Modelle stammen aus eigener Herstellung.",
          "Ein anatomisch geformtes, gepolstertes Fußbett und eine rutschfeste Laufsohle sorgen für ganztägigen Komfort.",
          "Sandalen werden im 10-Paar-Karton (EU 40–45) auf Vorbestellung verkauft; der Versandtermin wird bestätigt, sobald die Produktion eingeplant ist.",
        ],
        faq: [MIN_DE, PRICE_DE],
      },
      fr: {
        title: "Sandales homme en cuir en gros",
        description:
          "Sandales homme en cuir noir et marron avec semelle intérieure rembourrée. En gros par carton de 10 paires, 40–45. Fabriqué par Hector Footwear depuis 1984.",
        h1: "Sandales homme en cuir en gros",
        label: "Sandales",
        intro: [
          "Les sandales homme en cuir sont parmi les premières chaussures demandées dès les beaux jours. Hector Footwear propose des sandales à brides en cuir véritable, en noir et marron. Tous les modèles sont de notre propre fabrication.",
          "Une semelle intérieure anatomique rembourrée et une semelle antidérapante assurent le confort toute la journée.",
          "Les sandales sont vendues en carton de 10 paires (40–45) et en précommande ; la date d'expédition est confirmée dès que la production est planifiée.",
        ],
        faq: [MIN_FR, PRICE_FR],
      },
    },
  },
];

export function getCategoryPageBySlug(slug: string): CategoryPage | undefined {
  return CATEGORY_PAGES.find((page) => page.slug === slug);
}

export function getCategoryPageForCategory(category: Category): CategoryPage | undefined {
  return CATEGORY_PAGES.find((page) => page.category === category);
}
