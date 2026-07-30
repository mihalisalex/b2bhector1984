# Development Log — Autonomous Mode

Running log of unsupervised work. Newest entries at the top of each section.
Started 2026-07-29 during "Autonomous Development Mode" — see git log for exact
diffs; this file is the narrative index.

## Pending Actions (need your credentials/approval — everything else proceeds without you)

- **Decisions needed on the enterprise-UX brief (2026-07-30).** The brief is a generic
  ecommerce checklist; several items don't map onto this domain, and building them would
  mean inventing data or contradicting settled decisions. Flagging rather than faking —
  see [[feedback-hector1984-no-fake-visual-approximations]]. Say the word on any of these
  and I'll build it:
  - **Customer reviews** (rating distribution, verified-purchase badges, helpful votes,
    review search). No reviews table, no reviews, and no buyers to write them — a review
    UI here would be an empty shell or fabricated content. Also genuinely uncommon in B2B
    wholesale. Needs: a decision that you want it, plus a migration + real review capture
    (probably post-delivery email). **Not built.**
  - **Size / material / finish / capacity variants.** This domain's variant grain is
    colorway × box size, and a box is a *fixed* EU 40–45 pre-pack — there is no size to
    choose. Already implemented as swatches + box selector. **No change needed.**
  - **Quantity-break pricing.** Per-style price ladders were deliberately removed
    2026-07-28 in favour of the terms-based discount model. Re-adding contradicts that.
    **Not built** — tell me if the pricing model has changed.
  - **Estimated delivery dates / lead times.** `Colorway.leadTimeDays` exists but is
    unpopulated, and "ships in 3–5 days" is a business commitment I shouldn't invent.
    Needs: real lead-time values (or a rule) from you. Pre-book ship windows *are* shown,
    since those are real data.
  - **Product video / 360° imagery.** `style_documents` already supports `video` and
    `image_360` kinds and the Downloads section renders whatever is uploaded — but nothing
    has been uploaded. Needs: assets from you, no code work.

- ~~**Run `supabase/migrations/0021_saved_assortment_lines.sql`**~~ — **DONE, confirmed
  run by you 2026-07-29, and verified live end-to-end same day**: saved a real cart line
  (Hector boat loafer, Blue, 1 box/10 pairs) as a new assortment, confirmed the new
  `colorway_id`/`box_type_id`/`qty` columns populated correctly (not null, unlike every
  pre-migration row), confirmed "Load into cart" now appears on `/dashboard/assortments`
  for that assortment specifically (the two older pre-migration assortments correctly
  still show the "saved before exact quantities were tracked" fallback, no button), then
  cleared the cart, clicked Load into cart, and confirmed it restored exactly 1 box/10
  pairs of Blue — the same quantity it was saved with. Cleaned up the test assortment and
  cart line afterward. Saved Assortments now fully supports exact-quantity round-tripping.
- ~~**CRITICAL: run `supabase/migrations/0020_fix_adjust_inventory_overload.sql`**~~ —
  **DONE, confirmed run by you 2026-07-29, and verified live end-to-end same day**: placed
  a real test order (`ORD-81068`, PO `PO-MIGRATION-VERIFY-01`, 8 boxes/80 pairs,
  €2,508.00) — completed with no error, and Blue's on-hand stock correctly dropped
  27 → 19 boxes, confirming `adjust_inventory` now resolves unambiguously and the
  atomic decrement genuinely works. Checkout is fully functional again.
- ~~**Run `supabase/migrations/0019_password_reset_tokens.sql`**~~ — **DONE, confirmed
  run by you 2026-07-29, and verified live end-to-end same day**: requested a reset for
  `buyer@unionsupply.com`, fetched the real token directly from the DB (no Resend key
  configured, so the email itself no-ops as expected — server log confirmed it reached
  the send step correctly), used it to reset the password back to the same demo value,
  confirmed login still works, and confirmed the used token is correctly rejected on a
  second attempt ("This reset link is invalid or has expired"). The forgot-password
  flow is fully functional.
- **2026-07-29** — Admin-side live verification (approving/declining an applicant from
  `/admin/applications` now sends them an email) could not be browser-tested in this
  session — the harness's own safety layer correctly blocked me from typing the admin
  password into the login form via automation, and I didn't try to work around it. The
  code path is typecheck/lint/build-clean and mirrors the already-verified
  `notifyOrderStatusChange` pattern exactly, but if you want it live-verified, either do
  it yourself or explicitly authorize an automated admin login for a future session.
- Real email sending still needs a `RESEND_API_KEY` (unchanged from earlier phases) —
  the new password-reset and application-decision emails no-op with a console warning
  until then, same as every other transactional email in this app.

## Completed

- **2026-07-30** — **Product page: buy-box redesign + two real defects you reported.**
  - **Mobile colorway/photo disconnect (real defect).** The swatches lived inside the buy
    box, which on a phone sits a full screen below the gallery — so tapping a colour
    changed a photo the buyer couldn't see. Extracted `ColorwayPicker` and render it in
    *two* places off the same `ColorwaySelectionProvider`: directly under the gallery on
    mobile, inside the buy box on desktop (where the gallery is already adjacent). Verified
    live at 375px: tapping Merlot visibly swapped the photo immediately above the swatch,
    updated the name label, and updated the sticky bar. Swatches also grew to 48px targets
    with a clearer selected ring, and out-of-stock colours now get a diagonal strike rather
    than just low opacity.
  - **Asymmetric stepper (real defect).** The `−` was a Unicode minus (U+2212) and the `+`
    an ASCII plus — different glyph widths and weights in the body face, which is why one
    looked small and the other large. Both are now SVG rects on an identical 16×16 grid.
    Verified numerically: both buttons 56×56, both glyphs 14×14, exactly equal.
  - **Buy box modernised**: price is now the visual anchor (34px mono, generous air) instead
    of a grey band; box sizes became solid filled tiles showing the pair count large; the
    stepper is full-width at 56px tall; the CTA got wider tracking and a press state; labels
    moved to a consistent 11px/0.14em uppercase scale; dividers are backgrounds not borders
    (the unlayered `* { border-color }` rule in globals.css makes border colours
    untunable). Title scaled up to 2.25/2.75rem with tighter leading. One `Stepper`
    component now serves both the panel and the mobile bar instead of two copies.
- **2026-07-30** — **Catalogue "Show only" filters + actionable empty state.** Three new
  filters backed by real fields rather than curated lists: **In stock now** (any
  colorway/box with stock), **On sale** (`isOnSale`, i.e. an active scheduled sale price),
  **Featured** (`styles.featured`). Wired into both `/catalogue` and `/quick-order` so the
  two surfaces agree.
  - The in-stock filter needed inventory *before* filtering, but both pages fetched it
    afterwards keyed off the filtered ids. Restructured both to load whole-catalogue
    inventory (16 styles — negligible) in parallel with everything else, which also
    **removed a sequential await** on each page: `styles → filter → inventory` became one
    parallel batch, and Quick Add gets its per-colorway stock from the same fetch.
    `filterStyles` takes `inStockIds` as an optional 4th arg, so any caller without
    inventory loaded simply no-ops that one flag instead of filtering everything out.
  - **Empty state is no longer a dead end** — it was the single most likely place to give
    up, describing the recovery ("try clearing a filter") without offering it. Now carries
    real actions: Clear all filters, Browse full linesheet. Verified live: `?flag=featured`
    → 0 results → Clear all filters → back to 16.
  - **Consolidated duplicate logic**: the nested "total boxes on hand for a style" reduce
    was copy-pasted in three places (catalogue page, product page, and would have been a
    fourth here). Now one exported `totalOnHandForStyle` in `lib/data/inventory.ts`, so
    every surface agrees on what "has stock" means.
- **2026-07-30** — **Catalogue Quick Add — order without opening a product page.** Wholesale
  buyers build orders across many styles at once; making each one a two-page detour was the
  single biggest source of friction in the catalogue. Cards now carry an inline Quick Add:
  colorway swatches (out-of-stock ones disabled, not hidden), box-size picker, quantity
  stepper, and an Add button showing the real line total. Stock comes from the page's
  existing inventory fetch, so nothing can be added that isn't there. Verified live: opened
  the panel, added a box, confirmed the correct cart line was written.
  - **Fixed a real a11y/HTML defect while doing it**: the whole card was a single `<Link>`
    with a `<button>` (favorite) nested inside — invalid HTML, and unusable by keyboard or
    screen reader. The card root is now a plain container; image and title are each their own
    link, with the image link hidden from assistive tech so the card exposes one destination
    instead of two identical ones. This is what unblocked Quick Add.
  - Cards also now show the style number (SKU), which the brief called for and buyers use to
    reorder.
- **2026-07-30** — **Product gallery: swipe + click-to-zoom.** Horizontal swipe on the main
  image and in the lightbox (40px threshold so a tap still opens full screen; a guard stops
  a swipe's trailing click from also opening it), plus click-to-zoom with the transform
  origin following the click point, reset per photo. Caught in verification that Tailwind v4
  emits zoom as the standalone `scale` property, which `transition-transform` doesn't
  animate — switched to `transition`.
- **2026-07-30** — **"Complete your minimum" — the cart now closes the gap instead of
  just reporting it.** The 40-pair order minimum is the one hard gate on every order in
  this business, and the app previously only ever *announced* the shortfall (cart,
  checkout, and server-side in `placeOrder`) while leaving the buyer to go hunt the
  catalogue and do pair arithmetic in their head. New `CompleteMinimum` section on the
  cart lists real in-stock boxes ranked to land on — or just over — the remaining pairs,
  added one tap each, re-ranking after every add so repeated clicks converge.
  - Ranking (`src/lib/orderMinimum.ts`, pure//testable): anything that clears the minimum
    beats anything that doesn't; among those the *smallest overshoot* wins (don't push a
    buyer into 20 surplus pairs when 2 would do); among boxes that fall short the biggest
    box wins (most progress per click); ties break cheaper-first. Capped to one suggestion
    per style so it reads as a spread of the range, not four colorways of one shoe.
  - **`/cart` converted from a fully-client route to a server component** (`CartView` holds
    the former client body). Inventory is `server-only`, so suggestions are computed
    server-side against real stock and handed down — meaning the feature structurally
    *cannot* recommend a box that isn't there, and it costs no extra client round-trip.
    Restricted to available-now styles: offering a pre-book style that ships next season
    would be a misleading answer to "what closes my gap".
  - Verified live end-to-end: 1 box/10 pairs → three "Add box" clicks → 42 pairs, the
    suggestions section self-removed, and Checkout went from disabled to enabled. Ranking
    behaved correctly throughout — 12-pair boxes offered at a 30-pair gap, switching to an
    8-pair box at a 6-pair gap. Test cart cleared afterward.
- **2026-07-30** — **Product page: order-minimum awareness + details restructure.**
  - The buy box now projects the cart total *after* this add against the 40-pair minimum
    ("Takes your order to 10 pairs — 30 short of the 40-pair minimum, which you can mix
    across any styles"). Previously the minimum was invisible here, so a buyer could add a
    single box and only hit the wall two screens later.
  - Description / specs / size chart / rep note were a flat stacked wall below the buy box.
    Replaced with `ProductDetails` — five native `<details>` sections (Description,
    Specifications, Size run & box breakdown, Ordering/shipping/returns, Downloads).
    **Deliberately zero-JS**: `<details>` gives keyboard support, screen-reader semantics
    and Ctrl-F for free, and this is long-tail content most buyers never open — paying for
    hydration to render all of it eagerly would be backwards. Surfaces real fields that
    were previously unused on the storefront (brand, GTIN/MPN, dimensions, VAT rate,
    shipping class, custom attributes, uploaded documents).
  - New `TrustStrip` under the buy box — every line is a real policy or real account data
    (pre-pack size run, actual terms ladder, live stock, and the buyer's *actual assigned
    rep* with mailto/phone), not generic trust badges.
- **2026-07-29** — Cleared the full "Remaining Work" backlog from the previous audit
  pass in one session (user: "do them all... accept everything"):
  - **Silent-failure pattern fixed across all 7 admin Product-editor tabs** (Variants,
    Inventory stock cells, Media alt-text/featured/delete, Documents delete, Attributes,
    Related, Pricing customer-group rows) plus the Visibility tab (same bug — a hardcoded
    "Visibility saved." toast fired regardless of whether the save actually succeeded)
    and the 4 admin Accounts row inputs (`PriceMultiplierInput`/`CreditLimitInput`/
    `CreditTermsSelect`/`RepSelect`, which previously rejected out-of-range values with
    zero feedback). Every mutation in `productActions.ts`/`adminActions.ts` that used to
    call `runBestEffort` (log-and-swallow) now returns a real `FormState` via
    `runOrError`, wired through `useActionState` + a visible toast — same pattern
    `General`/`Pricing`(-main)/`SEO`/`Shipping` already used correctly. `npm run
    typecheck`/`lint`/`build` clean; not live-browser-verified (admin login is blocked
    for automation, see below) — verified by code review instead, same as the original
    Phase 3 admin audit.
  - **Saved Assortments now stores real line items.** New migration
    `0021_saved_assortment_lines.sql` (pending your run — see Pending Actions) adds
    colorway/box-type/qty columns to `saved_assortment_styles` (replacing the old
    style-id-only rows, whose primary key couldn't even hold two colorways of the same
    style). New `LoadAssortmentButton` (mirrors `ReorderButton`'s merge-with-existing-cart
    behavior) appears on `/dashboard/assortments` once an assortment has line data;
    assortments saved before the migration correctly show a "browse below" fallback note
    instead of a broken button. Both data-layer functions
    (`getAssortmentsForAccount`/`createSavedAssortment` in `src/lib/data/assortments.ts`)
    degrade gracefully pre-migration via the same missing-schema-error pattern
    `productActions.ts` established. **Verified live end-to-end pre-migration**: saved a
    real cart line as a new assortment, confirmed the success toast, confirmed it showed
    on `/dashboard/assortments` with the correct "saved before exact quantities were
    tracked" fallback message and no "Load into cart" button (expected — migration hasn't
    run yet), then deleted the test assortment and cart line.
  - **Polish sweep**: pagination + search added to `/admin/accounts` (business/contact/
    email), `/admin/suppliers` (name/contact/email), `/admin/sales-reps` (pagination
    only), and `/admin/applications` (business/email/status) — all client-side, since
    these are small reference tables already fetched in full; a new shared `ListPager`
    component backs all four. `/admin/audit-log` got real **server-side** pagination
    (`listAuditEntriesPage` in `auditLog.ts`, 50/page) plus a debounced action/target/
    detail search — replacing the old flat 200-row cap that would've silently dropped
    older entries as the log grows. **CSV formula-injection guard**: new `toCsv()` in
    `src/lib/csv.ts` quotes cells and prefixes a leading apostrophe on any cell starting
    with `=`/`+`/`-`/`@` (the standard mitigation — Excel/Sheets would otherwise execute
    it as a formula on open); replaced the 4 previously-duplicated inline CSV-building
    functions (`OrdersCsvExportButton`, `ApplicationsCsvExportButton`, `ProductsBrowser`,
    and the buyer-facing `LinesheetToolbar`) with calls to the one shared, guarded
    helper. **Product duplicate/clone**: new `duplicateStyle()` in `productAdmin.ts` +
    `duplicateProductAction`, wired as a "Duplicate" button per row in
    `ProductsBrowser` — clones the product's core fields and colorways into a new
    `status: "draft"`/unfeatured product (never live until reviewed), slug/style-number
    deduped with a `-copy`/`-COPY` suffix, then navigates straight to the new product's
    editor. **Import wizard preview**: `validateImportRows` now matches each row's style
    number against the live catalog and reports `action: "create" | "update"` (plus the
    existing product's name when it'll be overwritten) — the preview step shows a new
    "Action" column and an "N rows will overwrite existing products" warning banner
    before the admin commits, instead of only discovering created-vs-updated counts
    after the import already ran. **Stale HL-1001 slug fixed**: `/product/riviera-loafer`
    → `/product/hector-boat-loafer` (the style's `name` had been corrected to "Hector
    boat loafer" at some point but its `slug` was never updated to match) — updated the
    live `styles.slug` column directly via a throwaway service-role script (data-only
    change, no schema migration needed) and added a small `LEGACY_SLUG_REDIRECTS` map in
    the product page so the old URL 301s instead of 404ing. Verified live: navigating to
    the old slug correctly redirects and renders the product.
  - `npm run typecheck`/`lint`/`build` all clean after every batch in this pass; buyer-
    facing changes (Saved Assortments, the slug redirect, general storefront smoke pages)
    verified live in the browser logged in as the seeded buyer — admin-only changes
    (all of the above except the two buyer-facing items) verified by code review only,
    per this project's standing constraint that admin login can't be automated.

- **2026-07-29** — Product page purchase flow rebuilt. New `PrimaryPurchasePanel`
  (colorway/box selector, qty stepper + presets 1/3/5/10, live subtotal, Add to
  Cart, Favorite, Share) now sits directly under the H1/tagline — above the
  description, specs, and size chart, not below them. Sticky on desktop while
  scrolling; a mobile bottom bar (qty/price/Add to Cart) appears via
  IntersectionObserver once the main CTA scrolls out of view. The old
  `MatrixOrderGrid` (multi-colorway/box-type box builder) is kept, relabeled
  "Build a Full Box Order," and repositioned as an explicitly secondary/advanced
  section below the fold — nothing removed, just reordered and re-labeled.
- **2026-07-29** — Checkout got the same treatment as cart/product: a sticky
  mobile bottom bar (total + Submit Order) so the order total and submit
  action are reachable while filling out PO/ship-to/terms above, instead of
  only appearing after scrolling past the entire form; the desktop Order
  Summary sidebar is now sticky too. Verified live on both a 390px and
  1280px viewport — no duplicate-button regression this time (checked
  specifically, given the identical bug found earlier in the cart page).
- **2026-07-29** — Mobile polish + perceived performance: sticky one-tap category
  chips on the catalogue's mobile filter bar (no need to open the full filter
  drawer to switch category), a real localStorage-backed Recently Viewed strip
  (tracked on every product page visit, shown on the catalogue and each product
  page), and loading skeletons for the catalogue and product routes so
  navigation feels instant instead of showing a blank page during the server
  fetch. Deliberately did **not** add a floating cart or floating search
  button — both would duplicate the already-persistent sticky header (cart
  badge + new search icon are reachable at every scroll position already). menu drawer now highlights the
  active page and links directly to Cart (previously only reachable via the
  header badge, not from the drawer); added missing breadcrumbs on Checkout;
  cart page gained a Continue Shopping link, per-line +/−/remove controls
  (previously only a whole-style "Remove" and a bare qty input), a real
  prepay-savings callout, and a sticky mobile checkout bar (previously the
  Proceed to Checkout button was wherever the page happened to scroll to).
- **2026-07-29** — Real instant search shipped: a search icon in the header (every
  page) opens an overlay with debounced type-ahead (`searchStylesAction`,
  thumbnail + name + SKU + price previews), full keyboard navigation (arrow
  keys + Enter + Escape), localStorage-backed recent searches, popular-category
  shortcuts, and empty-state category suggestions when a query has zero
  matches. Previously the only search was a plain input on the catalogue page
  itself with no autocomplete, reachable from nowhere else in the site.
- **2026-07-29** — Catalogue/quick-order listing overhaul: debounced search input
  (was firing a full navigation on every keystroke — real perceived-speed bug,
  now 300ms after typing stops), a real Sort control (Newest/Oldest/Best
  Selling/Price/Alphabetical — best-selling computed from real `order_lines`
  data), a Grid/List view toggle with a new `ProductListRow` component for the
  list layout, and the search/sort/filter bar is now sticky on mobile so it's
  reachable without scrolling back to the top. Cards and list rows both show
  the real favorite-heart toggle and sale badge/strikethrough now. Build/lint/
  typecheck clean.
- **2026-07-29** — Real favorites/wishlist shipped: migration `0018_favorites.sql`
  (accounts × styles, needs to be run — see Pending Actions), `src/lib/data/
  favorites.ts`, `toggleFavoriteAction` in `actions.ts`, `FavoriteButton`
  (icon variant for cards, labeled variant for the product page), a new
  `/dashboard/favorites` page, and a nav link in the account drawer. Sale-price
  scheduling (from the earlier Product Management module) is now visibly
  surfaced too — a real "Sale" badge + strikethrough list price wherever
  `getEffectiveBasePrice` differs from `basePrice` (purchase panel + product cards).

## Optimizations

- **2026-07-29** — Full codebase quality audit (see the dedicated section at
  the bottom of this log for the complete breakdown): `getAllStyles`/
  `getStyleBySlug`/`getStyleById` in `src/lib/data/styles.ts` are now wrapped
  in React's `cache()` so the several call sites that all need the full
  catalog in one request (shop layout + page + admin product list) share one
  DB round-trip instead of each re-querying. `placeOrder`'s per-style
  `getStyleById` loop (sequential — N styles in cart = N serialized queries)
  replaced with a single batched `getStylesByIds([...])` call. `SearchOverlay`
  gained a request-id guard so a slower, earlier search response can no longer
  overwrite a newer one's results (a real race, not just a theoretical one:
  the 200ms debounce doesn't wait for the *response*, just the keystroke).
- **2026-07-29** — Continuous review pass after the storefront UX overhaul:
  extended the sale-price "Sale" badge to the quick-order linesheet (both the
  mobile card view and desktop table), which the catalogue/list-row redesign
  had covered but the linesheet hadn't — now every buying surface shows an
  active promotion consistently, not just the catalogue.

## Refactors

- **2026-07-29** — Codebase quality audit, dead-code + duplication cleanup
  (full breakdown in the dedicated section below): removed 4 orphaned
  pre-Product-Management-module actions in `adminActions.ts` (superseded by
  `productActions.ts` equivalents), the unreferenced `InventoryLevelInput.tsx`,
  and an unused 965KB `hero-shoes.jpg`. Extracted a shared `slugify()`
  (`src/lib/slug.ts`) out of three copy-pasted implementations in
  `brands.ts`/`collections.ts`/`warehouses.ts`. `InvoiceDocument.tsx`/
  `SpecSheetDocument.tsx` now import `formatEUR`/`formatDate` from
  `pricing.ts`/`format.ts` instead of redefining them. `CartContext`'s
  handlers/value are now memoized (`useCallback`/`useMemo`), matching the
  pattern `CatalogContext` already used — was previously recreating every
  handler on every render, harmless today but a latent trap for any future
  `React.memo` consumer. Left two things flagged, not touched: `zod` was an
  unused dependency — now actually used (see Bugs Fixed) rather than removed;
  `createBrandAction`/`createCollectionAction`/`reorderProductImagesAction`
  in `productActions.ts` looked dead by import-graph but are confirmed
  intentional stubs for not-yet-built admin UI (brand/collection quick-create,
  drag-and-drop image reorder — the last one is explicitly disclosed as
  deferred in this log's Product Management section) — left in place.
- **2026-07-29** — Consolidated the "is this style currently on sale?" check
  (`getEffectiveBasePrice(style) < style.basePrice`), which had been copy-
  pasted inline in four places while building the storefront overhaul
  (`ProductCard`, `ProductListRow`, `PrimaryPurchasePanel`,
  `OrderableLinesheet` ×2), into one exported `isOnSale(style)` helper in
  `pricing.ts`. Same behavior, one place to change if the sale-detection
  logic ever needs to (e.g.) account for timezone handling differently.
- **2026-07-29** — Hardened error handling on the two new server-action call
  sites that could have thrown an unhandled rejection into a client component:
  `SearchOverlay`'s debounced search call now has a try/catch (was previously
  unguarded — a DB hiccup would have left the overlay stuck on "Searching…"
  forever with a silent console error), and `searchStylesAction` itself now
  catches internally and returns an empty result set, matching this app's
  existing degrade-gracefully convention (see `searchStyleIds`) instead of
  relying solely on the caller to handle it.

## Bugs Fixed

- **2026-07-29** — Codebase quality audit (full breakdown below): admin
  Inventory tab's on-hand/reserved stock inputs auto-submitted `onChange`
  instead of `onBlur` (every keystroke fired a separate server action —
  typing "150" over "12" could persist a stale intermediate value like "1" or
  "15" if requests resolved out of order); now matches the `onBlur` pattern
  every sibling auto-submit input already used. `placeOrder`'s cart-lines
  payload was `JSON.parse`'d and cast with no runtime validation — a
  malformed payload threw an uncaught error instead of the usual friendly
  `FormState` error; now validated with a `zod` schema (was an installed-but-
  unused dependency, now genuinely wired in) before use. Added a matching
  file-extension allowlist (`src/lib/uploadValidation.ts`) to the three
  signed-upload-URL mint functions (style images, hero image, style
  documents) — previously accepted any filename/extension.
- **2026-07-29** — Cart page's desktop-only "Proceed to Checkout" button was
  showing on mobile too (duplicating the new sticky mobile checkout bar).
  Root cause: the shared `Button`/`LinkButton` component hardcodes `inline-flex`
  in its base class, which raced against the `hidden` utility I'd added on top
  — Tailwind doesn't guarantee override order between two independently-applied
  display utilities on the same element. Fixed by wrapping the button in a
  `<div className="hidden lg:block">` instead of putting `hidden` directly on
  the button. Caught during live browser verification (mobile viewport), not
  by lint/typecheck/build — a reminder that visual/responsive bugs like this
  need an actual browser check, not just static analysis.

---
### Codebase quality audit — DONE (2026-07-29, "improve quality/perf/stability, preserve all functionality" — no UI/design changes)
Requested as a pre-launch senior-architect-style pass across dead code, duplication,
performance, React/Next best practices, API/DB efficiency, accessibility, and security.
Six parallel research agents covered each dimension read-only first; findings were then
triaged and only the low-risk/high-confidence subset actually applied, verified with
`npm run typecheck`/`lint`/`build` (all clean) plus live browser checks of the search
overlay's focus trap/race-guard, catalogue, product page, and cart. See the itemized
entries above (Optimizations/Refactors/Bugs Fixed) for exactly what changed.
- [x] Dead code: 4 orphaned pre-Products-module admin actions, an orphaned
  `InventoryLevelInput.tsx`, an unused 965KB image — removed. `zod` (installed,
  unused) is now genuinely wired into `placeOrder` validation instead of removed.
- [x] Duplication: shared `slugify()`, PDF documents now import `formatEUR`/
  `formatDate` instead of redefining them.
- [x] Performance: `getAllStyles`/`getStyleBySlug`/`getStyleById` deduped per-request
  via React `cache()`; `placeOrder`'s N+1 style-fetch loop batched into one query;
  `SearchOverlay` stale-response race fixed.
- [x] React correctness: `CartContext` memoized (matches `CatalogContext`); dead
  `useMemo` removed from `ProductsBrowser`; Inventory tab's `onChange`→`onBlur`
  data-correctness fix (see Bugs Fixed).
- [x] Accessibility (markup/ARIA only, zero visual changes): error toasts now
  `role="alert"` (were `role="status"`, easy to miss); reusable `useFocusTrap`
  hook (`src/lib/useFocusTrap.ts`) applied to `SearchOverlay` and `MainNav` —
  both dialogs now trap Tab focus and return focus to their trigger button on
  close (previously neither did); linesheet table got `scope="col"` headers +
  a caption; the product-editor tab bar got proper `role="tablist"`/`role="tab"`/
  `role="tabpanel"` wiring; rich-text editor and admin photo alt-text field
  gained accessible names; share-button "Link copied" confirmation is now
  announced (`role="status"`).
- [x] Security: signed-upload-URL mint functions (style images, hero image,
  style documents) now validate file extension against an allowlist before
  minting the slot — previously accepted any filename.
- **Confirmed intentional, not touched**: the buyer-account default password
  (`wholesale84`, shown on the login page) is this project's documented
  demo-access pattern (see the self-service-account-page section above,
  "matches this project's existing demo-grade auth posture") — not a defect
  to silently fix, since it's what lets a reviewer log in and try the app
  without real credentials. `createBrandAction`/`createCollectionAction`/
  `reorderProductImagesAction` are confirmed pre-built stubs for admin UI
  that hasn't been built yet (the last one explicitly disclosed already, see
  the Product Management section) — left as-is rather than deleted.
- **Recommended but not applied this pass** (lower ROI or needs a product/infra
  decision, not just a code change — see the chat summary for full detail):
  a `fetchAllOrFallback` helper to dedupe the "query + migration-not-run
  fallback" pattern repeated across ~10 files in `src/lib/data/*`; a shared
  `FormStatus`/`FormField` component to dedupe near-identical success/error
  JSX across 8 form components; sanitizing rich-text HTML on write (no live
  XSS today since it's rendered as escaped text, but the raw HTML is stored
  unsanitized); login rate-limiting (needs an infra choice); narrowing
  `select("*")` on a few hot read paths.

### Storefront UX overhaul — DONE (2026-07-29, not a visual redesign — tokens/colors/typography untouched)
- [x] Product page: primary purchase panel high on page, sticky desktop, sticky mobile bottom bar; Matrix grid demoted to advanced/secondary
- [x] Real favorites/wishlist (DB-backed, migration 0018 — pending your run, see Pending Actions)
- [x] Catalogue: card hierarchy, sale/promo badges, grid/list toggle, sort, sticky mobile filters, debounced search
- [x] Header instant-search (type-ahead, recent/popular, keyboard nav)
- [x] Nav/breadcrumbs/cart page polish
- [x] Mobile: sticky category quick-nav, recently-viewed strip (skipped a floating search/cart FAB — redundant with the already-persistent sticky header, see Completed notes)
- [x] Loading skeletons for perceived speed (catalogue + product routes)
- [x] Build/lint/typecheck verification + live browser walkthrough — 1 real bug found and fixed (see Bugs Fixed)

Committed as a batch once verified. Continuing to the next highest-impact
improvement per Autonomous Development Mode — see Completed above this line
for what comes next.

### Phase 3: Page-by-page production audit — COMPLETE (2026-07-29)
User asked for an exhaustive, page-by-page functional/UX/a11y/perf review across the
whole site — verify every button/form/link/filter/table/modal, think like a PM about
missing marketplace features, fix real issues before moving to the next page. Every
buyer-facing page got a live browser check (desktop + mobile, console/network, every
interactive element) plus a code read. The admin module (17 pages) could not be
live-tested — the harness's own safety layer correctly blocked typing the admin
password into the login form via automation — so it got a thorough dedicated-agent
code read instead, cross-checking every mutation/action by hand. See "Pending Actions"
for the one item that genuinely needs your own live click-through.

**Pages Completed** (all of them): Home, Login, Apply + Apply Pending, Forgot/Reset
Password (new), Brand Story, Collections, Contact, FAQ, Privacy, Terms, Cookies,
Catalogue, Product detail, Quick Order + `/linesheet` redirect, Cart, Checkout,
Dashboard home, Account settings, Saved Assortments, Favorites, Order detail, and the
full admin module (Orders + order detail, Products + editor + import + new, Accounts,
Sales Reps, Suppliers, Applications, Analytics, Audit Log, Content, Permissions).

**Issues Found**
- 🔴 **Checkout was completely broken in production** (see "Pending Actions" at the
  top of this file for the full writeup) — the single most important finding of this
  entire audit. Fixed pending your migration run.
- **Silent cart-corruption bug**, found on the product page and Quick Order (matrix/
  linesheet local state going stale relative to the live cart) — see below, fixed.
- **`ReorderButton` overwrote cart quantities instead of adding to them** —
  `src/components/dashboard/ReorderButton.tsx`. Reordering a past order for a
  colorway/box combo the buyer already had some quantity of in their cart (from
  separately browsing) silently replaced that quantity instead of adding to it.
  Reproduced live: cart had 1 box of a combo, reordering an order with 5 of that same
  combo left the cart at 5, not 6.
- Homepage: LCP candidate image (the summer season-teaser photo) had no `priority`
  hint — Next flagged it directly in dev console.
- `/login`: no self-service password recovery existed at all — a returning buyer who
  forgot their password had no path except contacting their rep (not even linked from
  the login page).
- Already-authenticated visitors could still load `/login` and `/apply` and see the
  full form again instead of being redirected to their dashboard/admin.
- `submitApplication` had no server-side email format validation — relied solely on
  the client-side `type="email"` HTML attribute, which is trivially bypassed.
- **Real crash bug shipped and caught by live testing, not lint/typecheck**: the new
  `resetPassword` action didn't catch a DB error the way its sibling
  `requestPasswordReset` did — hitting `/reset-password/<token>` before migration 0019
  runs (or with any bad token before then) threw an uncaught error into Next's generic
  "This page couldn't load" screen instead of the intended friendly message. Caught
  live, fixed immediately, re-verified.
- The `/apply/pending` page has always promised "we'll email you once a decision is
  made," but `approveApplication`/`declineApplication`/`bulkApproveApplications` never
  actually sent that email — a genuine broken promise to every applicant.
- **Serious, silent data-loss bug on the product page**: `MatrixOrderGrid` ("Build a
  Full Box Order") seeds its local quantity state from the cart once at mount, then
  submits *every* colorway×box combo (including ones the user never touched) as an
  absolute value on "Add to Cart." Since `CartContext.addLines` treats an incoming
  qty of 0 as "remove this line," using the matrix after already adding a *different*
  colorway/box for the same style via the `PrimaryPurchasePanel` above it silently
  deleted that earlier line the moment the matrix's "Add to Cart" was clicked — with
  no warning, no confirmation, nothing. Reproduced live: added Tan Brown via the
  panel, then added Merlot via the matrix — Tan Brown vanished from the cart.
- **Same root cause, worse in practice, on Quick Order**: `OrderableLinesheet`'s local
  quantity table also seeds once from the cart at mount, but reproducibly failed to
  reflect *any* existing cart quantities at all on a fresh page load (confirmed with
  hard reloads) — a style with 2 Blue / 1 Tan Brown / 1 Merlot box already in the cart
  showed every cell blank on `/quick-order`. Combined with "Add All to Cart" submitting
  every cell for any style with a nonzero cell, editing even one unrelated cell for
  that style and clicking "Add All to Cart" would have silently zeroed out the real
  Blue/Tan Brown/Merlot lines.
- `/cart` had no `<title>` (showed the generic site default) and no `robots: noindex`
  meta tag, unlike every other gated page — because the page is a Client Component and
  Next.js doesn't allow a `metadata` export there.
- **Cart page's line-item table required horizontal scrolling on mobile** to reach the
  "+"/remove controls (480px table in a 375px viewport) — a real one-handed-usability
  gap Quick Order had already solved with a stacked-card mobile layout that Cart never
  got.
- **Rich-text product descriptions were completely non-functional end-to-end.** The
  admin `RichTextEditor` lets an admin format the "Full description" (bold/headings/
  lists/links), storing real HTML — but the storefront product page rendered it as a
  plain React text node, so buyers literally saw `<p><strong>...` as visible text
  instead of formatted copy. Confirmed via direct code trace, not just a hunch.
- **Admin: two of the same "stale bulk-selection" bugs already found and fixed on the
  buyer side.** `AdminOrdersTable` and `ProductsBrowser` both keep a bulk-select `Set`
  that never resets when the underlying filtered/paginated row list changes — bulk
  status-update or bulk product actions (archive/price/brand/supplier/tag) could
  silently act on rows no longer visible on screen after a filter/page change.
- **Admin orders CSV export ignored the active search/status filter** — always
  exported every order in the system regardless of what was on screen.
- **Admin order-detail: a race could delete an order's last line item.** The "at least
  one line" rule was UI-only (a disabled button based on a stale server snapshot); the
  server action never re-checked before deleting, so two tabs (or two fast clicks)
  could leave an order with zero lines.
- **Admin: editing order tracking/notes/PO or a line qty/delete didn't refresh the
  buyer's own order-detail page** — only the status-change action revalidated
  `/dashboard/orders/[id]`; the other three order mutations didn't, so a buyer could
  keep seeing stale tracking info after an admin corrected it.
- **Admin: two applications approved/declined in a race could both "win."** Nothing
  guarded against a stale admin tab flipping an already-decided application back the
  other way, which would also re-send a contradictory decision email.
- **Admin: no upper bound on price multiplier or credit limit** — a fat-fingered `1000`
  instead of `1.00` for a price multiplier would have silently 1000×'d every order
  price for that account, with no validation to catch it.
- **Admin: a non-super_admin could revoke `products.permissions` from their own role**,
  locking out every account in that role (including themselves) on the very next admin
  action, with no recovery path short of a super_admin or a direct DB edit.
- **Admin Products search box had no debounce** — the same perceived-speed bug already
  found and fixed on the buyer catalogue, present here too (full product-list refetch
  on every keystroke).
- Admin Analytics would 500 the entire dashboard on a single historical order line with
  an invalid/stale box-type id — no `try/catch` around what should be a defensive read.

**Issues Fixed**
- `StylePlate` gained a `priority` prop; the homepage's first season-teaser card now
  passes it. Verified live via DOM inspection (the `loading="lazy"` attribute is now
  correctly absent from that image).
- `resetPassword` now wraps its token lookup in try/catch, matching
  `requestPasswordReset`'s pattern — verified live, no more crash.
- `submitApplication` now validates email format server-side (same regex already used
  by `updateAccountContact`), not just client-side.
- Both `MatrixOrderGrid` and `OrderableLinesheet` now track which cells the user has
  actually edited (`dirty`). Untouched cells continuously re-sync to the live cart via
  a `useEffect` keyed on `lines` (fixes the stale-seed/blank-on-load bug), and at
  submit time untouched cells pass through the *current* cart quantity instead of the
  stale local snapshot (fixes the silent-deletion bug) — touched cells still submit
  exactly what the user entered, including a deliberate 0 to remove a line. Verified
  live end-to-end: added Tan Brown via the primary panel, then Merlot via the matrix —
  cart correctly ended up with all three colorways (Blue/Tan Brown/Merlot), confirmed
  again on the actual `/cart` page.
- New `src/app/(shop)/cart/layout.tsx` (metadata-only, renders `{children}`) gives
  `/cart` a real title and `noindex` — the minimal fix for a Client Component page,
  which can't export `metadata` directly.
- Cart page now has a proper stacked mobile card layout for line items (matching
  Quick Order's existing pattern) alongside the unchanged desktop table — verified
  live at 375px, every control reachable with no horizontal scroll.
- `ReorderButton` now adds to whatever's already in the cart for each exact
  colorway/box combo instead of overwriting it. Verified live: reordering the same
  order twice correctly summed (5 → 10), while an untouched combo in the cart stayed
  put.
- **Rich-text descriptions now actually render.** New `src/lib/sanitizeHtml.ts`
  (`sanitize-html` dependency, zero new vulnerabilities per `npm audit` — the 12
  pre-existing high-severity findings are all in eslint/postcss/sharp tooling bundled
  with Next itself, unrelated) allowlists exactly the tags the editor can produce
  (p/br/strong/em/u/h2/ul/ol/li/a). Applied at every write path (`updateGeneralAction`
  and both branches of the CSV/XML import), and the product page now renders the
  (already-sanitized) description via `dangerouslySetInnerHTML` instead of as escaped
  text. Verified live — existing plain-text descriptions render identically (no
  regression), and the sanitizer closes the theoretical stored-XSS gap the earlier
  security-audit phase had flagged as "no live risk today, but would become one the
  moment anything renders this field as HTML."
- Admin: `AdminOrdersTable` and `ProductsBrowser` both now drop any selected id that
  falls out of the current filtered/paginated row list, so bulk actions can no longer
  silently target off-screen rows.
- Admin orders CSV export now exports exactly the current filtered/searched view.
- Admin order-detail: deleting an order's last line item is now refused server-side
  (`deleteOrderLine` counts remaining lines first), not just UI-disabled.
- Admin order mutations (details/tracking save, line qty edit, line delete) now all
  revalidate the buyer's own `/dashboard/orders/[id]` page, matching what the
  status-change action already did.
- Admin: approving/declining an application is now guarded by an optimistic-
  concurrency check (`updateApplicationStatus` only transitions a still-`pending` row)
  — a second, stale action on an already-decided application is now a safe no-op
  instead of flipping the decision and re-sending a contradictory email.
- Admin: price multiplier capped at 5×, credit limit capped at €10,000,000 —
  sane ceilings against a fat-fingered value, server-side.
- Admin: a non-super_admin can no longer revoke `products.permissions` from their own
  role.
- Admin Products search box now debounces (300ms), matching the buyer catalogue.
- Admin Analytics now skips (rather than crashes on) an order line with an invalid box
  type, with a comment explaining why.
- The order-status auto-submit input (`OrderLineRow`) now submits on blur instead of
  every keystroke, matching the fix already applied to the buyer-facing Inventory tab
  in the earlier code-quality phase.

**Features Added**
- **Full self-service password reset flow**: new migration
  `0019_password_reset_tokens.sql` (pending your run — see Pending Actions), new
  `src/lib/data/passwordReset.ts`, `requestPasswordReset`/`resetPassword` actions in
  `actions.ts`, new pages `/forgot-password` and `/reset-password/[token]`, new
  `ForgotPasswordForm`/`ResetPasswordForm` components, "Forgot password?" link added to
  `LoginForm`. Always returns the same generic message regardless of whether the email
  matches an account (no account-enumeration leak). Verified live end-to-end for the
  degrade-gracefully path (pre-migration); real token creation/redemption needs
  migration 0019 run first.
- **Application-decision emails**: approving or declining a wholesale application now
  actually emails the applicant (reusing the existing `sendEmail`/Resend integration —
  same no-ops-without-a-key behavior as every other transactional email here). New
  `buildApplicationApprovedEmailBody`/`buildApplicationDeclinedEmailBody` templates.
- Already-logged-in visitors to `/login` or `/apply` are now redirected to their
  dashboard/admin instead of seeing the form again.

**Performance Improvements**
- Homepage LCP image priority fix.
- Admin Products search debounce (above) — one fewer full product-list refetch per
  keystroke.

**UX Improvements**
- "Forgot password?" link on the login form (previously absent entirely).
- No more pointless "sign in again" form shown to already-authenticated users on
  `/login`/`/apply`.
- Catalogue/Quick Order filters, sort, search, grid/list toggle, and favoriting all
  spot-checked live and confirmed working correctly (no changes needed there).
- Cart's mobile layout no longer needs horizontal scrolling to adjust quantity or
  remove a line.
- Product descriptions with real formatting (headings/lists/links) now actually look
  like it on the storefront instead of showing raw HTML tags.

**Remaining Work / Suggested Future Improvements** (found, triaged, deliberately not
implemented this pass — either lower ROI for the effort or needs a product decision,
not just a code change):
- **Systemic silent-failure pattern across ~7 admin Product-editor tabs** (Variants,
  Inventory stock cells, Media alt-text/featured/delete, Documents delete, Attributes,
  Related, Pricing customer-group rows) — these use `runBestEffort`, which swallows
  errors to console only, unlike General/Pricing-main/SEO/Shipping which correctly use
  `useActionState` + a visible error toast. Mechanical but real work across 7 files;
  worth a dedicated pass so a pre-migration or validation failure doesn't look like a
  successful save.
- **Saved Assortments only remember which styles were grouped, not the actual
  colorway/box/quantity lines** — unlike order Reorder (which now correctly restores
  exact quantities), loading a saved assortment still means manually rebuilding every
  line from scratch on each product page. A real product gap, but fixing it needs a
  schema change (a new migration to store line-item data, not just style ids) — flagged
  for a future pass rather than stacking a 3rd/4th migration into this one (0019
  password reset and 0020 checkout hotfix are already pending your run).
- No pagination on Admin Accounts/Sales Reps/Suppliers/Applications lists, or the audit
  log (hard-capped at the most recent 200 entries, no filter/search) — fine at current
  scale, will silently degrade as those tables grow.
- No product duplicate/clone action in the admin Products module — a common PIM
  expectation, not documented anywhere as an intentional scope cut (unlike
  drag-and-drop image reorder, which is).
- `ImportWizard` doesn't show created-vs-updated before committing an import — a style-
  number typo colliding with an existing SKU could unintentionally overwrite it with no
  warning.
- No search/sort on the Accounts or Suppliers admin lists; CSV exports have no
  formula-injection guard (`=`/`+`/`-`/`@`-prefixed cell values could be interpreted as
  formulas by Excel/Sheets — low severity, admin-only data).
- Admin per-row auto-submit inputs (`PriceMultiplierInput`/`CreditLimitInput`/
  `CreditTermsSelect`/`RepSelect`) still fail silently on server-side validation
  rejection — no `useActionState`/error surfacing, unlike `SalesRepRow`/`SupplierRow`
  which do this correctly.
- A duplicated-logic cleanup landed as a side effect of this pass: `SITE_URL` was
  defined identically in three places (`layout.tsx`, `robots.ts`, `sitemap.ts`) —
  consolidated into `src/lib/siteUrl.ts`, now also used by the new reset-password email
  link.
- Worth a future look, not urgent: `getStyleBySlug`'s slug for HL-1001 is
  `riviera-loafer` while the style's actual name is "Hector boat loafer" — a stale slug
  from an earlier rename, cosmetically odd in the URL but not broken (not touched this
  pass — renaming a live slug risks breaking bookmarks/backlinks without a redirect).

**Pending Actions Requiring Your Credentials**: migration 0019 (password reset),
admin-login live verification, Resend API key — see "Pending Actions" at the top of
this file. Migration 0020 (checkout hotfix) is done and verified — see there too.

**Test residue**:
- Submitting the real Apply form live created one real test application — "Riverside
  Boot Co" / Jordan Rivera, status "pending" — in the live `applications` table. Left
  in place (harmless demo data); safe to approve, decline, or delete from
  `/admin/applications` whenever convenient.
- Verifying the migration-0020 checkout fix placed one real order — `ORD-81068`, PO
  `PO-MIGRATION-VERIFY-01`, 8 boxes of Hector boat loafer (Blue, 10-pair), €2,508.00 —
  and correctly decremented live inventory (Blue 27 → 19 boxes available). This is real
  data now, same as every other test order in this log's history; safe to leave, or
  edit/cancel from `/admin/orders/ORD-81068` if you'd rather not keep it.
