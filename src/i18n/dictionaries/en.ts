const en = {
  /**
   * Shared wholesale UI strings, supplied by the owner alongside the Greek product copy
   * ("Κοινά κείμενα χονδρικής"). Key names are exactly as given in that file.
   *
   * NOTE: `pricing.vat` overlaps `tax.vatExcludedNotice` below. The supplied string
   * hardcodes "24%"; the tax one interpolates {rate} from DEFAULT_VAT_RATE, so it cannot
   * drift from the rate the invoice actually charges. Both are kept for now — see the
   * commit message — but new call sites should use `tax.vatExcludedNotice`.
   */
  availability: {
    available: "Available now",
    preorder: "Pre-order",
    madeToOrder: "Made to order",
  },
  wholesale: {
    only: "Wholesale only",
  },
  box: {
    fixed: "Fixed pre-pack boxes — EU 40–45 run, no broken sizes",
    noSinglePairs: "Single pairs aren't sold wholesale",
    box10: "10-pair box",
    box8: "8-pair box",
  },
  terms: {
    discounts: "Prepay 10% off · Net 30 5% off · Net 60 at list",
  },
  stock: {
    live: "Live stock — availability updates as orders are placed",
  },
  rep: {
    assigned: "Territory rep assigned to every approved account",
  },
  pricing: {
    onApproval: "Trade pricing on approval",
    vat: "All prices are wholesale, excluding 24% VAT",
  },
  apply: {
    review: "Applications are reviewed manually, usually within two business days",
  },
  sizeRun: "EU 40–45",
  /**
   * Messages returned by Server Actions.
   *
   * These were hardcoded English and had no way not to be: a Server Action receives no
   * route params, so under path-based routing there was nothing to read a locale from.
   * Host-based routing gives them one — see getRequestLocale() in src/i18n/requestLocale.ts.
   * A Greek buyer failing a login now fails it in Greek.
   */
  actions: {
    loginFailed: "We couldn't find an active account with that email and password.",
    accountNotActivated: "This account has not been activated yet. Contact your sales rep.",
    resetLinkSent: "If an account exists for that email, we've sent a link to reset your password.",
    enterAccountEmail: "Enter the email address on your wholesale account.",
    passwordsDontMatch: "Passwords don't match.",
    resetLinkInvalid: "This reset link is invalid or has expired. Request a new one.",
    passwordUpdatedSignIn: "Password updated. You can now sign in.",
    requiredFieldsMissing: "Every field marked required needs a value before we can route this to review.",
    invalidEmail: "Enter a valid email address.",
    activationFailed:
      "We couldn't finish setting up your account. Please try again, or email {email} and we'll sort it out.",
    cartInvalid: "Your cart data looks invalid. Please refresh and try again.",
    cartEmpty: "Your cart is empty.",
    selectShipTo: "Select a valid ship-to address.",
    selectPaymentTerms: "Choose one of the available payment terms.",
    profileFieldsRequired: "Business name, contact name, and email are all required.",
    invalidPhone: "Enter a valid phone number, including country code.",
    profileUpdated: "Profile updated.",
    currentPasswordIncorrect: "Current password is incorrect.",
    newPasswordMismatch: "New password and confirmation don't match.",
    passwordUpdated: "Password updated.",
    addressFieldsRequired: "Label, address, city, state, and ZIP are required.",
    addressAdded: "Address added.",
    addressNotFound: "Address not found.",
    addressUpdated: "Address updated.",
    assortmentInvalid: "That assortment's contents looked invalid. Please refresh and try again.",
    assortmentNeedsName: "Give this assortment a name.",
    assortmentNeedsStyle: "Add at least one style before saving.",
    assortmentSaved: "Assortment saved.",
    accountAlreadyExists:
      "An account already exists for this email address. Sign in instead — or use “Forgot password” if you don’t have it.",
  },
  /**
   * The generated PDFs (proforma invoice, spec sheet).
   *
   * Written in the buyer's language for the same reason the emails are: an invoice is the
   * document their accountant handles. Note these render through an embedded font — see
   * src/lib/pdf/fonts.ts — because the built-in Helvetica cannot draw Greek at all.
   */
  pdf: {
    invoice: "Invoice",
    proformaInvoice: "Proforma Invoice",
    statusConfirmed: "Confirmed",
    statusInProduction: "In Production",
    statusShipped: "Shipped",
    statusDelivered: "Delivered",
    billTo: "Bill to",
    shipTo: "Ship to",
    terms: "Terms",
    tracking: "Tracking",
    orderDetail: "Order detail",
    item: "Item",
    qty: "Qty",
    unit: "Unit",
    total: "Total",
    subtotal: "Subtotal",
    vat: "VAT",
    grandTotal: "Total",
    inStock: "In stock",
    production: "Production",
    eta: "ETA",
    boxesAndPairs: "{boxes} boxes · {pairs} pairs",
    termsPrepay: "Prepay — 10% off",
    termsNet30: "Net 30 — 5% off",
    termsNet60: "Net 60 — list price",
    proformaNotice:
      "This is a proforma invoice, not a charge — it reflects stock and production check before your order is confirmed.",
    invoiceFooter:
      "Hector Footwear Wholesale · {email} · All pricing and inventory data on this document is illustrative.",
    // Spec sheet
    specSheet: "Spec Sheet",
    category: "Category",
    gender: "Gender",
    weight: "Weight",
    msrp: "MSRP",
    materials: "Materials",
    sizeBreakdown: "Size breakdown (pairs per box)",
    box: "Box",
    specSheetFooter:
      "Hector Footwear Wholesale · {email}. Materials, weights, and box breakdowns are illustrative and subject to production tolerances.",
    wholesaleEst: "WHOLESALE — EST. 1984",
  },
  /**
   * Transactional email. Written in the recipient's language (accounts.locale), not the
   * domain's — an order confirmation is often sent from a background path with no request
   * to read, and a buyer's own language is the right answer either way.
   *
   * The two ADMIN notifications (new application, new order) are deliberately absent: they
   * go to the business's own inbox, and the admin side of this app is English-only.
   */
  email: {
    /**
     * `{name}` is the contact's first name as stored; `{vocative}` is the Greek address
     * form of it (see src/i18n/greek.ts). A language picks whichever placeholder its
     * grammar needs — English takes `{name}`, Greek takes `{vocative}`.
     * `fallbackName` fills in when there is no name at all.
     */
    greeting: "Hi {name},",
    fallbackName: "there",
    signoff: "Best,\nHector Footwear Wholesale",

    statusSubmitted: "Submitted",
    statusConfirmed: "Confirmed",
    statusInProduction: "In Production",
    statusShipped: "Shipped",
    statusDelivered: "Delivered",

    orderStatusSubject: "Order {id} update — {status}",
    orderStatusBody: "Writing about your order {id}, currently {status}.",

    orderConfirmationSubject: "Order confirmation — {id}",
    orderConfirmationBody: "We've received your order {id}. We'll be in touch as it moves through production.",
    invoiceAttached: "Your proforma invoice is attached as a PDF.",
    madeToOrderNote:
      "Some items in this order weren't in stock and are made to order — expect those in about {days} days.",
    preOrderNote:
      "Some items are on pre-order — they weren't in stock, and we'll confirm ship timing with you once production is scheduled.",
    inStockShipsNote: "Anything on hand ships right away.",

    approvedSubject: "Your Hector Footwear wholesale application — approved",
    approvedBody:
      "Good news — your Hector Footwear wholesale application has been approved. Activate your account to start browsing the full catalog with pricing:",
    repLineWithPhone: "Your dedicated account rep is {name} — reach them directly at {phone}.",
    repLine: "Your dedicated account rep is {name}.",

    declinedSubject: "Your Hector Footwear wholesale application",
    declinedBody:
      "Thanks for your interest in carrying Hector Footwear. After review, we're not able to approve a wholesale account at this time. If your business circumstances change, you're welcome to re-apply.",

    receivedSubject: "We've received your Hector Footwear wholesale application",
    receivedBody:
      "Thanks for applying for a Hector Footwear wholesale account — we've received your application and our team is reviewing it now. Most applications are reviewed within 2 business days, and we'll follow up by email as soon as a decision is made.",

    passwordResetSubject: "Reset your Hector Footwear wholesale password",
    passwordResetBody:
      "We received a request to reset your Hector Footwear wholesale account password. Click the link below to choose a new one — it expires in 1 hour:",
    passwordResetIgnore: "If you didn't request this, you can safely ignore this email.",

    // The branded HTML shell in textToHtml.
    shellEyebrow: "Wholesale Portal",
    shellButton: "Continue →",
    shellFooterLine1: "Hector Footwear Co. — Wholesale accounts only.",
    shellFooterLine2: "This is a transactional email about your wholesale account.",
  },
  /** Cart and checkout — the surfaces where a buyer commits money. */
  checkout: {
    cartEmptyTitle: "Your cart is empty",
    cartEmptyBody: "Build an order from the catalog, linesheet, or quick order.",
    checkoutEmpty: "Your cart is empty — nothing to check out yet.",
    browseCatalogue: "Browse Catalogue",
    emptyCartConfirm: "Empty your entire cart? This removes every line item.",
    emptyCart: "Empty cart",
    colorway: "Colorway",
    pairs: "Pairs",
    decreaseQty: "Decrease quantity",
    increaseQty: "Increase quantity",
    remove: "Remove",
    cartTotalNet60: "Cart total (net-60)",
    pairsCount: "{count} pairs",
    boxesAndPairs: "{boxes} boxes · {pairs} pairs",
    pairsInCart: "{count} pairs in cart",
    overStock: "One or more lines exceed available stock — reduce quantity to check out.",
    removeUnavailable: "Remove the styles that are no longer available before checking out.",
    unavailableOne: "A style in your cart is no longer available",
    unavailableMany: "Some styles in your cart are no longer available",
    unavailableBody: "These were withdrawn after you added them, so they can’t be priced or ordered. They’re not included in your totals — remove them to check out.",

    shipTo: "Ship To",
    paymentTerms: "Payment Terms",
    notesForRep: "Notes for your rep",
    notesPlaceholder: "Delivery instructions, combine shipments, anything your rep should know…",
    estimatedShipping: "Estimated Shipping",
    multipleShipments: "This order will ship in multiple shipments.",
    orderSummary: "Order Summary",
    subtotal: "Subtotal",
    total: "Total",
    requesting: "Requesting…",
    requestProforma: "Request Proforma Invoice",
    submitOrder: "Submit Order",
    submitting: "Submitting…",

    termsPrepay: "Prepay",
    termsNet30: "Net 30",
    termsNet60: "Net 60",
    discountApplied: "{terms} — {percent}% off applied",
    listPrice: "{terms} — list price",
    approvedForTerms: "Your account is currently approved for {terms}. Requesting different terms routes this order to {rep} for credit approval before it ships.",

    atOnceLabel: "At-once ({count} styles):",
    atOnceBody: "ships within 5 business days of confirmation.",
    prebookLabel: "{name} (pre-book):",
    madeToOrderLabel: "Made to order ({count} styles):",
    madeToOrderBody:
      "not fully in stock — ships in about {days} days. Exact per-item status is confirmed after you submit.",
    preOrderLabel: "Pre-order ({count} styles):",
    preOrderBody: "not fully in stock — no fixed ship date yet. {rep} will confirm timing once production is scheduled.",
  },
  auth: {
    // Login
    portalEyebrow: "Wholesale Portal",
    portalHeadline: "Everything your store needs to buy Hector Footwear, in one place.",
    portalBody:
      "Matrix ordering, terms-based pricing, pre-book and at-once inventory, net terms, and a direct line to your rep — the way the wholesale channel should run.",
    estBadge: "EST. 1984",
    seasonsBadge: "2 SEASONS",
    termsBadge: "NET 30 / 60",
    loginHeading: "Buyer Login",
    loginIntroPre: "Approved wholesale accounts only. Not a buyer yet?",
    applyForAccess: "Apply for access",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    signIn: "Sign In",
    signingIn: "Signing in…",
    // Forgot / reset
    forgotHeading: "Reset your password",
    forgotIntro: "Enter the email on your wholesale account and we'll send you a link to reset your password.",
    sendResetLink: "Send reset link",
    sending: "Sending…",
    backToSignIn: "Back to sign in",
    goToSignIn: "Go to sign in",
    chooseNewPassword: "Choose a new password",
    passwordMinLength: "Must be at least {min} characters.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    resetPassword: "Reset password",
    saving: "Saving…",
  },
  product: {
    description: "Description",
    features: "Features",
    specifications: "Specifications",
    sizeRunAndBox: "Size run & box breakdown",
    orderingShippingReturns: "Ordering, shipping & returns",
    downloads: "Downloads",
    repNote: "Rep note",
    styleNumber: "Style number",
    brand: "Brand",
    category: "Category",
    materials: "Materials",
    weight: "Weight",
    weightValue: "{oz} oz per pair",
    msrp: "MSRP",
    msrpValue: "{price} — suggested retail",
    soldAs: "Sold as",
    soldAsValue: "{sizes}-pair pre-pack boxes",
    sizeRunLabel: "Size run",
    dimensions: "Dimensions",
    gtin: "GTIN",
    mpn: "MPN",
    orderMinimum: "Order minimum",
    orderMinimumValue: "{pairs} pairs, mixable across any styles",
    availability: "Availability",
    availableNowValue: "Available now — ships from current stock",
    prebookValue: "Pre-book",
    prebookValueWithWindow: "Pre-book — ships {window}",
    paymentTerms: "Payment terms",
    pricingShown: "Pricing shown",
    pricingShownValue: "Excludes VAT ({rate}%), applied at invoicing",
    shippingClass: "Shipping class",
    fullTermsPre: "Full shipping, returns and account terms are on the",
    fullTermsPost: ". Your territory rep can confirm anything specific to your account.",
    specSheet: "Spec sheet (PDF)",
    specSheetDesc: "pricing, size run, materials",
  },
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
