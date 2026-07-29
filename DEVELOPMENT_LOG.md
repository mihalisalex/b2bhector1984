# Development Log — Autonomous Mode

Running log of unsupervised work. Newest entries at the top of each section.
Started 2026-07-29 during "Autonomous Development Mode" — see git log for exact
diffs; this file is the narrative index.

## Pending Actions (need your credentials/approval — everything else proceeds without you)

1. **Run `supabase/migrations/0018_favorites.sql`** in the Supabase SQL Editor (same
   process as 0013-0017 — paste, run, in order after 0017). Until then, the
   heart/favorite toggle on product pages and cards will show a friendly error
   instead of saving — everything else on the site is unaffected.

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

- **2026-07-29** — Continuous review pass after the storefront UX overhaul:
  extended the sale-price "Sale" badge to the quick-order linesheet (both the
  mobile card view and desktop table), which the catalogue/list-row redesign
  had covered but the linesheet hadn't — now every buying surface shows an
  active promotion consistently, not just the catalogue.

## Refactors

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
