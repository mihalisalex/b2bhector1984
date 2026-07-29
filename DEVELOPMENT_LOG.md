# Development Log — Autonomous Mode

Running log of unsupervised work. Newest entries at the top of each section.
Started 2026-07-29 during "Autonomous Development Mode" — see git log for exact
diffs; this file is the narrative index.

## Pending Actions (need your credentials/approval — everything else proceeds without you)

_Nothing outstanding — migration 0018 (favorites) confirmed run and verified live
2026-07-29 (favoriting persists, shows on /dashboard/favorites). Will add new entries
here as they come up._

## Completed

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
