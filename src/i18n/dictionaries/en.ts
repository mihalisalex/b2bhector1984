const en = {
  tax: {
    /** Shown on every surface that displays a price. `{rate}` is VAT_PERCENT. */
    vatExcludedNotice: "All prices are wholesale, excluding {rate}% VAT.",
    /** Used only when items on one page carry different VAT rates, so no single
     * percentage can be stated truthfully. */
    vatExcludedMixed: "All prices are wholesale, excluding VAT.",
    /** Compact form, for table footers and PDF footers where the full line won't fit. */
    vatExcludedShort: "Excl. {rate}% VAT",
    /** Line item label on the order summary and invoice. */
    vatLabel: "VAT ({rate}%)",
    netTotal: "Total excl. VAT",
    grossTotal: "Total incl. VAT",
    afm: "Tax ID (ΑΦΜ)",
    doy: "Tax office (ΔΟΥ)",
    euVatId: "EU VAT number",
  },
  nav: {
    home: "Home",
    quickOrder: "Quick Order",
    catalogue: "Catalogue",
    collections: "Collections",
    accountRequired: "Account required",
    theBrand: "The Brand",
    journal: "Journal",
    faq: "FAQ",
    contact: "Contact",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    mainMenu: "Main menu",
    applyForAccess: "Apply for Access",
    buyerLogin: "Buyer Login",
    homeAriaLabel: "Hector Footwear home",
  },
  account: {
    dashboard: "Dashboard",
    cart: "Cart",
    accountSettings: "Account settings",
    favorites: "Favorites",
    savedAssortments: "Saved assortments",
    signOut: "Sign out",
    accountMenu: "Account menu",
    accountLabel: "Account",
    logIn: "Log in",
  },
  cart: {
    title: "Cart",
    close: "Close cart",
    pair: "pair",
    pairs: "pairs",
    empty: "Your cart is empty",
    emptyHint: "Build an order from the catalogue.",
    browseCatalogue: "Browse Catalogue",
    cartTotal: "Cart total (net-60)",
    plusVatTotal: "+ VAT {vat} = {total}",
    goToCart: "Go to cart",
    remove: "Remove",
    unavailableNoticeSingular: "A style in your cart is no longer available.",
    unavailableHintSingular: "Remove it on the cart page to check out.",
    unavailableNoticePlural: "Some styles in your cart are no longer available.",
    unavailableHintPlural: "Remove them on the cart page to check out.",
  },
  footer: {
    tagline: "Full-grain leather footwear, wholesaled the way serious retailers expect. Est. 1984.",
    wholesale: "Wholesale",
    company: "Company",
    contact: "Contact",
    legal: "Legal",
    applyForAccess: "Apply for access",
    buyerLogin: "Buyer login",
    catalogue: "Catalogue",
    theBrand: "The brand",
    materialsAndCraft: "Materials & craft",
    journal: "Journal",
    faq: "FAQ",
    contactUs: "Contact us",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    cookieNotice: "Cookie Notice",
    copyright: "© {year} Hector Footwear Co. Wholesale accounts only.",
    disclaimer: "All pricing and inventory data on this site is illustrative.",
  },
  shopFooter: {
    yourRep: "Your rep: {name} · {email} · {phone}",
    /** Used when no rep is assigned yet, so there is no phone number to show. */
    yourRepNoPhone: "Your rep: {name} · {email}",
    dashboard: "Dashboard",
    support: "Support",
  },
  languageSwitcher: {
    label: "Language",
  },
  seo: {
    homeTitle: "Men's Leather Shoes Wholesale | Hector Footwear",
    homeDescription:
      "Hector Footwear is a men's leather footwear wholesaler, est. 1984 — full-grain loafers, boots, formal shoes and sneakers for independent retailers. Box-only ordering, terms-based pricing.",
    collectionsTitle: "Men's Leather Shoes Wholesale",
    collectionsDescription:
      "Men's leather loafers, boots, formal shoes, sneakers and sandals, wholesale — full-grain leather, box-only ordering. Sign in for wholesale pricing or apply for a trade account.",
    // Deliberately NOT the same target as /collections. Both pages became publicly
    // indexable on 18 Aug and both list the same products, so pointing them at one
    // keyword would have them competing with each other. /collections is the seasonal
    // lookbook and owns the head term; /catalogue is the complete index and owns the
    // "full range / browse every style" intent.
    catalogueTitle: "Wholesale Catalogue — Every Men's Leather Shoe Style",
    catalogueDescription:
      "Browse the complete Hector Footwear range — men's leather loafers, boots, formal shoes, sneakers and sandals, filterable by category, colourway and season. Box-only wholesale; trade pricing shown to approved accounts.",
    catalogueHeading: "The Full Wholesale Catalogue",
    catalogueIntro:
      "Every men's leather shoe we make, filterable by category, colourway, season and delivery window. Wholesale pricing and box quantities are shown to approved trade accounts.",
    brandStoryTitle: "About Us — Men's Leather Footwear Wholesaler Since 1984",
    brandStoryDescription:
      "Hector Footwear has built full-grain men's leather footwear — loafers, boots, formal and more — for independent retailers since 1984. Wholesale only, no DTC.",
    faqTitle: "Wholesale FAQ — Ordering, Pricing & Shipping",
    faqDescription:
      "Answers for wholesale buyers ordering men's leather footwear from Hector Footwear — box policy, terms-based pricing, accounts, and shipping.",
    contactTitle: "Contact — Wholesale Inquiries",
    contactDescription:
      "Get in touch with Hector Footwear about a men's leather footwear wholesale account — general inquiries, new accounts, and existing buyer support.",
    journalTitle: "Journal — Wholesale Footwear Buying Guides",
    journalDescription:
      "Buyer guides, sourcing advice and market insights for retailers buying men's leather footwear wholesale, from Hector Footwear.",
    applyTitle: "Apply for a Wholesale Account",
    applyDescription:
      "Apply for a Hector Footwear wholesale account to buy men's leather footwear at trade pricing. Most applications are reviewed within 2 business days.",
    loginTitle: "Buyer Login",
    loginDescription:
      "Sign in to your Hector Footwear wholesale account for full men's leather footwear pricing, matrix ordering, and order history.",
  },
  contact: {
    eyebrow: "Get in touch",
    heading: "Talk to a real person,\nnot a bot.",
    intro: "Every inquiry is answered by someone on the Hector Footwear team — usually within two business days.",
    generalTitle: "General Inquiries",
    generalBody: "Questions about the brand, existing orders, or anything else.",
    newAccountsTitle: "New Wholesale Accounts",
    newAccountsBody: "Ready to apply, or have questions before you do? Reach the accounts team directly.",
    existingBuyersTitle: "Existing Buyers",
    existingBuyersBody: "Already have an account? Your territory rep is listed on your dashboard and is the fastest way to reach us.",
    goToDashboard: "Go to your dashboard",
    applicationsReviewed: "Applications reviewed by a real person, not a bot.",
  },
  faq: {
    heading: "Questions, answered.",
    intro: "Everything about ordering, pricing, and wholesale accounts. Can’t find it here? We’re a real team, not a bot.",
    stillHaveQuestions: "Still have questions?",
    contactLinkText: "Contact us",
    contactSuffix: "— every inquiry is answered by someone on the team, usually within two business days.",
  },
  brandStory: {
    estSince: "Est. 1984",
    heroHeading: "Built for the trials.\nBuilt to last a season\nof reorders.",
    intro1:
      "Hector Footwear started in a shared shop space behind a downtown shoemaker, three weeks before that year’s trade show. The first pair off the last was a hand-lasted loafer built for a local retailer who needed a shoe that could hold its shape on a shop-owner’s budget — and it sold out of the store that carried it twice before the season ended.",
    intro2:
      "Four decades later, the construction standards haven’t moved: full-grain leathers and suedes sourced from tanneries we’ve worked with for over twenty years, and outsole compounds built for a floor, not a lookbook. What has changed is the range — a Summer collection (loafers, wedding, sneakers, sandals) and a Winter collection (boots, sneakers, formal, anatomic), each built on the same last philosophy and QC standard.",
    intro3:
      "We sell wholesale only, direct to independent and regional retailers who know their floor and their customer. No DTC discounting undercutting the accounts who carry us all year. That’s the deal we’ve kept since 1984.",
    materialsHeading: "Materials & Craft",
    material1Title: "Full-grain leather & suede",
    material1Body: "Sourced from tanneries we’ve worked with for two decades. Consistent hand, consistent break-in, every case.",
    material2Title: "Wedge-cupsole construction",
    material2Body: "The same midsole-to-outsole geometry from the original 1984 mold, updated with modern EVA and rubber compounds.",
    material3Title: "Built to a QC standard, not a season",
    material3Body: "Every style passes the same flex, abrasion, and bond-strength testing before it ships to your floor.",
    ctaHeading: "See the current collection",
    ctaBody: "Full pricing unlocks with an approved wholesale account.",
    ctaButton: "View the Lookbook",
  },
  collections: {
    eyebrow: "Wholesale Lookbook",
    heading: "Men's Leather Shoes, Wholesale",
    intro: "Full-grain men's leather footwear for independent retailers.",
    allSeasons: "All Seasons",
    allCategories: "All Categories",
    signInForPricing: "Sign in for wholesale pricing",
    notWholesaleYet: "Not a wholesale account yet?",
    filterLabel: "Filter",
    filterAll: "All Styles",
    sortLabel: "Sort",
    sortNewest: "Newest",
    sortFeatured: "Featured",
    sortNameAsc: "Name A–Z",
    resultsCount: "{count} styles",
    noResults: "No styles match this filter.",
  },
  home: {
    heroEyebrow: "Wholesale Only — Est. 1984",
    heroHeading: "Men's Leather Footwear\nWholesale, Since 1984.",
    heroBody:
      "Full-grain men's leather footwear — loafers to boots — wholesaled the way independent retailers expect. Box-only ordering, terms-based pricing, no DTC discounting.",
    heroImageAlt: "Full-grain leather men's shoes from the Hector Footwear wholesale collection",
    /** Hero CTA labels. The DB's primary/secondary_cta_label columns are English-only, and
     * the hero rendered them verbatim under every locale — the Greek homepage shipped an
     * "Apply for access" button. These are the translated fallbacks; migration 0037's _el
     * columns override them when the admin writes Greek. */
    heroPrimaryCta: "Apply for access",
    viewCollectionFirst: "View the collection first",
    step1Title: "Apply",
    step1Body: "Tell us about your store — takes 2 minutes.",
    step1Cta: "Apply now",
    step2Title: "Log in",
    step2Body: "Once approved, sign in to unlock full wholesale pricing.",
    step2Cta: "Buyer login",
    step3Title: "Order",
    step3Body: "Browse Quick Order or the Catalogue and check out.",
    step3Cta: "Quick Order",
    currentDrop: "The current drop",
    alsoAvailable: "Also available",
    stylesCount: "{count} styles · {categories}. Full pricing and matrix ordering unlock once your wholesale account is approved.",
    viewLookbook: "View lookbook",
    operatorsHeading: "A storefront up front. An ordering engine underneath.",
    feature1Title: "Matrix Ordering",
    feature1Body: "Build a full colorway × size-run order on one screen, with live case-pack validation.",
    feature2Title: "Terms-Based Pricing",
    feature2Body: "Pay in full for 10% off, net-30 for 5% off, or net-60 at list price — the same simple rule for every account.",
    feature3Title: "Pre-Book & At-Once",
    feature3Body: "Every style is tagged with its delivery window, so you always know what ships now versus next season.",
    feature4Title: "Net Terms, Real Reps",
    feature4Body: "Request net-30 or net-60 at checkout and reach your territory rep directly from your dashboard.",
    ctaHeading: "Ready to carry Hector Footwear?",
    ctaBody: "Applications reviewed by a real person, not a bot.",
    ctaButton: "Apply for Wholesale Access",
  },
};

export default en;
export type Dictionary = typeof en;
