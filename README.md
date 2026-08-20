# Hector Footwear — Wholesale

B2B wholesale ordering portal for Hector Footwear. Built with Next.js (App Router), TypeScript, and Tailwind CSS v4, backed by Supabase (Postgres + Storage) and Resend for transactional email.

## Running it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Requires a `.env.local` with Supabase and (optionally) Resend credentials — see `.env.local` for the expected variable names.

## Access

Pricing and the catalogue are gated behind login. Approved wholesale accounts sign in at `/login`; new accounts apply at `/apply`, which routes into a real pending → approved → active review flow (an admin approves or declines from `/admin/applications`).

Admin access uses the `ADMIN_EMAIL` / `ADMIN_PASSWORD` credentials configured for this deployment — there are no shared or demo logins.

## Architecture notes

- **Data layer**: `src/lib/data/*` — typed Supabase queries per domain (accounts, styles, orders, journal, SEO, etc.), no mock/in-memory data.
- **Auth/session**: signed opaque session tokens (`src/lib/session.ts`), issued by Server Actions in `src/lib/actions.ts`.
- **Cart**: client-side React context (`src/lib/cart-context.tsx`), persisted to `localStorage` per account.
- **Pricing**: `src/lib/pricing.ts` computes payment-terms-adjusted unit price and order-minimum validation — shared by matrix ordering, quick order, cart, and checkout so they can never disagree.
- **Matrix ordering** (`src/components/matrix/MatrixOrderGrid.tsx`): the colorway × box-type ordering grid, with live stock validation and a sticky order summary bar.
- **Admin**: a full Product Management, Orders, Accounts, SEO, and Journal CMS under `/admin`, with role-based permissions on the Products module.
- **SEO**: dashboard-managed metadata, structured data, redirects, and sitemap — see `src/lib/seo*.ts`.

## Route map

- `/`, `/brand-story`, `/collections`, `/journal` — public marketing and content pages, no pricing
- `/apply`, `/apply/pending`, `/login` — application and auth flow
- `/catalogue`, `/product/[slug]`, `/linesheet`, `/quick-order` — gated browsing and ordering
- `/cart`, `/checkout` — order build-out and submission
- `/dashboard`, `/dashboard/orders/[id]`, `/dashboard/assortments` — buyer account home
- `/admin` — order, product, account, and content management

## Languages and the two domains

The site is **one codebase, one deployment, one database, serving two domains**:

| Domain | Language | URL shape |
|---|---|---|
| `hectorfootwear.gr` | Greek (`el`) | no prefix — `/catalogue` |
| `hectorfootwear.com` | English (`en`) | no prefix — `/catalogue` |
| `hectorfootwear.com` | German, French | prefixed — `/de/catalogue`, `/fr/catalogue` |

Greek is the primary market. There is **no `/el/` or `/en/` in any URL**, and no automatic
geo/IP redirect anywhere — a visitor who types a URL gets that URL's language. The only way
to change language is the switcher (header: EL/EN; footer: all four).

Locale is resolved from the **Host header** in `src/proxy.ts` and rewritten into the
`app/[lang]/…` route tree, so it never appears in the address bar. The mapping lives in one
file, `src/i18n/domains.ts`.

### Running each locale locally

Browsers resolve any `*.localhost` name to 127.0.0.1 with no hosts-file edit, so the real
host-parsing code runs unchanged:

```bash
npm run dev
```

| URL | Serves |
|---|---|
| `http://el.localhost:3000` | Greek (as `hectorfootwear.gr` does) |
| `http://en.localhost:3000` | English (as `hectorfootwear.com` does) |
| `http://de.localhost:3000` | German |
| `http://localhost:3000` | Greek — the fallback for an unrecognised host |

To force a locale on a host that has no opinion (a Vercel preview, bare `localhost`), set
`LOCALE_OVERRIDE` in `.env.local`:

```bash
LOCALE_OVERRIDE=en
```

The two production origins are overridable too, for staging: `NEXT_PUBLIC_ORIGIN_EL` and
`NEXT_PUBLIC_ORIGIN_EN`.

### Adding a new string

1. Add the key to **`src/i18n/dictionaries/en.ts`**. That file's shape *is* the `Dictionary`
   type, so this immediately makes the key required everywhere else.
2. Run `npm run typecheck`. Every other locale now fails to compile until it has the key —
   that is the safety net; there is no runtime "missing translation" fallback.
3. Add it to `el.ts`, `de.ts`, `fr.ts`.

Use `{placeholder}` for interpolation and pass values through `t()` from `src/i18n/format.ts`.
**Never build a sentence by concatenating fragments** — Greek inflects the rest of a clause
with the number and the case, so `"At-once (" + n + " style" + s + ")"` cannot be translated.
Put the whole sentence in the dictionary with a `{count}` in it.

Reading strings:

- **Server components** — `getDictionary(locale)` from the route's `lang` param.
- **Client components** — `useI18n()`, or `useFormat()` for `eur()` / `date()` bound to the
  current locale. Never format currency or dates from the browser's own locale: these render
  on the server and again on hydration, and a mismatch is a hydration error on every price.
- **Server actions / route handlers / email** — `getRequestLocale()` (Host header) or
  `getLocaleForAccount(account.locale)` when writing to a specific buyer.

### Reviewing the Greek

```bash
npx tsx scripts/exportGreekReview.ts     # writes greek-review.csv
npx tsx scripts/applyGreekReview.ts      # reads it back into el.ts
```

The CSV is `namespace, key, English, Greek, char counts, notes`, Excel-safe UTF-8 with a
BOM. The importer refuses to write if the file has lost or gained keys, so a truncated
spreadsheet save cannot silently delete translations.

On Windows PowerShell use `npx.cmd`, not `npx` — the `.ps1` shim is blocked by the default
execution policy.

### Adding a third locale later

1. Add it to `LOCALES` in `src/i18n/config.ts`.
2. Create `src/i18n/dictionaries/<locale>.ts`. Typecheck will list every key it needs.
3. Decide its **domain** in `src/i18n/domains.ts` — either it joins `.com` as a prefixed
   locale (like `de`/`fr`), or it gets its own origin like `el` did. That one file drives
   routing, canonicals, hreflang, the sitemaps and the switcher.
4. Add `OG_LOCALE` and `NUMBER_LOCALE`/`DATE_LOCALE` entries (`src/lib/seo.ts`,
   `src/lib/pricing.ts`, `src/lib/format.ts`).

Nothing else needs touching — no page reads a locale prefix directly.

### Product and journal content

Product prose is per-locale in the database: `styles.tagline_el`, `description_el`,
`features_el`, `materials_el`, `last_note_el`, falling back to English when unwritten. The
gap is counted on `/admin/products`; export and re-import the **Greek copy CSV** from that
page to fill it. Style names, style numbers and colourway names (`TABA`, `Black`) stay
English — they are order codes, not prose.

Journal posts are **single rows per language**, not translations, and are filtered by
`journal_posts.locale`. `translation_group` exists but is unused; populate it if two posts
ever become genuine translations of each other and per-article hreflang is wanted.
