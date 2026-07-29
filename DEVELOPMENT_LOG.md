# Development Log — Autonomous Mode

Running log of unsupervised work. Newest entries at the top of each section.
Started 2026-07-29 during "Autonomous Development Mode" — see git log for exact
diffs; this file is the narrative index.

## Pending Actions (need your credentials/approval — everything else proceeds without you)

- **2026-07-29 — 🔴 CRITICAL, RUN THIS FIRST: `supabase/migrations/0020_fix_adjust_inventory_overload.sql`.**
  **Checkout is currently broken in production** — every real order submission
  fails with an uncaught server error. Root cause: migration 0014 added a second
  `adjust_inventory(...)` function with a 5th `p_warehouse_id` parameter, intending
  it to transparently replace the original 4-parameter version from migration
  0008. `create or replace function` only replaces a function with the *identical*
  argument signature, so Postgres kept both — every checkout call (which passes
  4 args) now matches both overloads ambiguously and errors with "Could not
  choose the best candidate function." Reproduced live via a real checkout
  attempt in this audit. The fix migration drops the stale 4-arg overload,
  leaving only the warehouse-aware version (the application code has also been
  updated to pass `p_warehouse_id: "main"` explicitly rather than relying on
  its default). **Run this in the Supabase SQL Editor immediately** — until you
  do, no buyer can place an order on the live site.
- **2026-07-29** — **Run `supabase/migrations/0019_password_reset_tokens.sql`** in the
  Supabase SQL Editor (after 0001-0018) to make the new "Forgot password?" flow actually
  work — until then it degrades gracefully (generic success message / friendly "invalid
  link" error, verified live, no crash) but doesn't really create or honor reset tokens.
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

### Phase 3: Page-by-page production audit — IN PROGRESS (started 2026-07-29)
User asked for an exhaustive, page-by-page functional/UX/a11y/perf review across the
whole site — verify every button/form/link/filter/table/modal, think like a PM about
missing marketplace features, fix real issues before moving to the next page. This is
a large, multi-session effort (~29 distinct page experiences); each page gets a live
browser check (desktop + mobile, console/network, every interactive element) plus a
code read, not just a code read. Working in buyer-journey order: marketing/public →
core shop → buyer dashboard → admin.

**Pages Completed** (this session): Home (`/`), Login (`/login`), Apply + Apply Pending
(`/apply`, `/apply/pending`), Brand Story, Collections, Contact, FAQ, Privacy, Terms,
Cookies, Catalogue (`/catalogue`), Product detail (`/product/[slug]`), Quick Order
(`/quick-order`) + the `/linesheet` redirect stub.

**Issues Found**
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
- Homepage LCP image priority fix (above).

**UX Improvements**
- "Forgot password?" link on the login form (previously absent entirely).
- No more pointless "sign in again" form shown to already-authenticated users on
  `/login`/`/apply`.
- Catalogue/Quick Order filters, sort, search, grid/list toggle, and favoriting all
  spot-checked live and confirmed working correctly (no changes needed there).

**Remaining Work**
- 18 more page groups queued: Cart, Checkout, buyer Dashboard + Account/Assortments/
  Favorites/Order detail, and the full admin module (orders, products, accounts, sales
  reps, suppliers, applications, analytics, audit log, content, permissions).
  Continuing in the same order (buyer-facing first, admin last).
- A duplicated-logic cleanup landed as a side effect of this pass: `SITE_URL` was
  defined identically in three places (`layout.tsx`, `robots.ts`, `sitemap.ts`) —
  consolidated into `src/lib/siteUrl.ts`, now also used by the new reset-password email
  link.
- Worth a future look, not urgent: `getStyleBySlug`'s slug for HL-1001 is
  `riviera-loafer` while the style's actual name is "Hector boat loafer" — a stale slug
  from an earlier rename, cosmetically odd in the URL but not broken (not touched this
  pass — renaming a live slug risks breaking bookmarks/backlinks without a redirect).

**Pending Actions Requiring Your Credentials**: see the "Pending Actions" section at
the top of this file (migration 0019, admin-login live verification, Resend API key).

**Test residue**: submitting the real Apply form live (to verify it end-to-end) created
one real test application — "Riverside Boot Co" / Jordan Rivera, status "pending" — in
the live `applications` table. Left in place (harmless demo data, same "verify live"
philosophy as the checkout test order documented earlier in this log); safe to approve,
decline, or delete from `/admin/applications` whenever convenient.
