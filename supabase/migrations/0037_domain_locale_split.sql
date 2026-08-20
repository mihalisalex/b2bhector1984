-- 0037 — the locale dimension, for the .gr/.com domain split.
--
-- Run once in the Supabase SQL Editor, after 0001-0036.
--
-- Up to now the app has had four locales in the UI and exactly one in the database. Every
-- product's prose, every journal article, every admin SEO override and the homepage hero
-- were single-valued, so a Greek page rendered Greek chrome around English content. That
-- is not merely untidy: a page whose body copy is English is *classified* as English, which
-- would defeat the entire point of giving Greek its own domain.
--
-- Five independent changes, grouped here because they are one decision and running them as
-- five migrations against populated data later would cost five times the care:
--
--   1. accounts.locale          — which language to write this buyer's email in
--   2. journal_posts.locale     — which site an article belongs to (+ translation_group)
--   3. styles._el columns       — Greek product copy, with fallback
--   4. site_content._el columns — Greek homepage hero
--   5. seo_* locale dimension   — per-locale titles/descriptions and per-domain verification
--
-- Everything added here is nullable or defaulted, and every read added alongside it falls
-- back to the pre-migration value. The app is correct at every point during the rollout,
-- including the window between running this and deploying the code that uses it.

-- ---------------------------------------------------------------------------
-- 1. accounts.locale — drives transactional email language
-- ---------------------------------------------------------------------------
-- Not a cosmetic preference. A buyer in Düsseldorf receiving a Greek order confirmation
-- gets a document they cannot act on: they cannot check the totals, the payment terms or
-- the ship window. So this is backfilled with a real heuristic rather than a blanket
-- default, and every guess is recorded so a human can correct it.
--
-- `locale_inferred` is the flag: true means nobody has confirmed this value. The admin
-- account list can surface it, and it is the column to filter on when reviewing.

alter table accounts add column locale text not null default 'el'
  check (locale in ('en', 'de', 'fr', 'el'));
alter table accounts add column locale_inferred boolean not null default true;

-- Greek if store_location contains Greek script at all, or names a Greek town in Latin
-- transliteration. `store_location` is the only geographic signal on the table — there is
-- no country column — so this is genuinely a heuristic.
--
-- The place stems are loose on purpose. A first pass used `heraklio|iraklio` and misread a
-- real Cretan account whose store_location reads "Heraclion" as English. Buyers type their
-- own town from memory; matching only the correct spelling matches the wrong thing.
update accounts
   set locale = 'el', locale_inferred = false
 where store_location ~ '[Α-Ωα-ωΆ-ώ]';

update accounts
   set locale = 'el', locale_inferred = false
 where locale_inferred
   and store_location ~* '(athen|αθήν|thessalonik|salonik|θεσσαλον|herakl|heracl|irakl|iracl|ηράκλει|crete|kriti|κρήτ|patra|πάτρα|larissa|larisa|λάρισα|volos|βόλο|rhodes|rodos|ρόδο|chania|hania|χανι|ioannina|ιωάννιν|kavala|καβάλα|serres|σέρρε|katerini|κατερίν|kalamata|καλαμάτ|corfu|kerkyra|κέρκυρ|piraeus|pireas|πειραι|greece|ελλάδ|hellas)';

-- Cyprus is Greek-speaking but is not Greece, and whether a Cypriot retailer should be
-- served the Greek site is a market decision, not a linguistic one. Set to Greek (the
-- language is right) but left flagged, so it appears in the review list rather than being
-- silently decided here.
update accounts
   set locale = 'el'
 where locale_inferred
   and store_location ~* '(cypr|κύπρ|larnac|λάρνακ|nicosia|λευκωσ|limassol|λεμεσ|paphos|πάφο|famagusta|αμμόχωστ)';

-- Everything still unmatched: English, and flagged. Of the two possible errors, sending
-- Greek to a non-Greek buyer is the one that produces a document they cannot act on, so
-- the genuinely unknown case defaults away from Greek.
update accounts
   set locale = 'en'
 where locale_inferred
   and coalesce(trim(store_location), '') <> ''
   and store_location !~* '(cypr|κύπρ|larnac|λάρνακ|nicosia|λευκωσ|limassol|λεμεσ|paphos|πάφο|famagusta|αμμόχωστ)';

-- ---------------------------------------------------------------------------
-- 2. journal_posts.locale + translation_group
-- ---------------------------------------------------------------------------
-- 0027 gave the journal a single `slug unique` and no language, on the assumption that an
-- article is an article. Eight of the eighteen published posts are Greek, and both
-- /journal and /el/journal render all eighteen — so a Greek retailer is shown ten English
-- cards, and an English one eight Greek. Under domain routing that becomes the .gr site
-- publicly serving English content, which is exactly the classification risk above.
--
-- Backfilled from the title's script, not from a hardcoded slug list: the Greek posts have
-- Greek titles, and deriving it means a post added between writing and running this
-- migration is still classified correctly.
--
-- Slugs are deliberately NOT touched. The transliterated Greek slugs
-- (odigos-agoras-dermatinon-andrikon-papoutsion-chondrikis and friends) are indexed and
-- stay exactly as they are.

alter table journal_posts add column locale text not null default 'en'
  check (locale in ('en', 'de', 'fr', 'el'));

update journal_posts set locale = 'el' where title ~ '[Α-Ωα-ωΆ-ώ]';

create index journal_posts_locale_idx on journal_posts (locale);

-- Pairs a Greek article with its English counterpart when they are the same article in two
-- languages. Deliberately left entirely null and with no UI: the column exists so that
-- per-article hreflang can be emitted later without a second migration against a table
-- that will by then be much larger. Two posts sharing a translation_group are translations
-- of each other; null means "this article stands alone", which is the honest state today.
alter table journal_posts add column translation_group uuid;

create index journal_posts_translation_group_idx on journal_posts (translation_group)
  where translation_group is not null;

-- ---------------------------------------------------------------------------
-- 3. styles — Greek product copy
-- ---------------------------------------------------------------------------
-- Null means "no Greek written yet, fall back to the English column". The fallback is in
-- the data layer (src/lib/data/styles.ts), so a half-translated catalogue renders rather
-- than showing blanks — but see the admin product list, which now counts and badges the
-- styles still missing Greek so the fallback cannot quietly become permanent.
--
-- Deliberately NOT given _el columns:
--   * `name`        — "Hector Boat Loafer" is a product name, not a phrase to translate.
--   * `style_number`— an order code.
--   * colorways.name— "TABA", "Black" are how retailers actually order. A Greek
--                     transliteration would be a different colour as far as a buyer is
--                     concerned, and would break phone and WhatsApp orders.
-- `last_note` DOES get one, since it is prose about fit — but a last/fit code inside it
-- (e.g. a numeric last) should be carried across untranslated when the Greek is written.

alter table styles add column tagline_el text;
alter table styles add column description_el text;
alter table styles add column materials_el text[];
alter table styles add column last_note_el text;

-- ---------------------------------------------------------------------------
-- 4. site_content — Greek homepage hero
-- ---------------------------------------------------------------------------
-- Left empty on purpose. This is the first thing a Greek retailer reads and the owner is
-- writing it; /admin/content shows the two languages side by side. The pre-launch
-- checklist carries it as a blocking item, and until it is filled the hero falls back to
-- English exactly as the product copy does.
--
-- The CTA *hrefs* are shared, not duplicated: they are routes, and both languages point at
-- the same page on their own domain.

alter table site_content add column eyebrow_el text;
alter table site_content add column heading_el text;
alter table site_content add column body_el text;
alter table site_content add column primary_cta_label_el text;
alter table site_content add column secondary_cta_label_el text;

-- ---------------------------------------------------------------------------
-- 5a. seo_entity_meta — one override per page PER LOCALE
-- ---------------------------------------------------------------------------
-- A single seo_title shared across four locales meant the Greek homepage advertised an
-- English title to Greek searchers. The primary key grows a locale column.
--
-- Existing rows are tagged 'en', not 'el'. They contain English text, written for the
-- English site — tagging them Greek would hand every Greek page an English admin override
-- that outranks the Greek in-code default, reintroducing the exact mixed-language page
-- this migration exists to prevent. See the note in src/lib/seo.ts: there is deliberately
-- NO cross-locale fallback for these overrides. A missing Greek override falls through to
-- the Greek in-code default (real Greek copy from the dictionary), never to another
-- language's override.

alter table seo_entity_meta add column locale text not null default 'en'
  check (locale in ('en', 'de', 'fr', 'el'));

alter table seo_entity_meta drop constraint seo_entity_meta_pkey;
alter table seo_entity_meta add primary key (entity_type, entity_key, locale);

-- ---------------------------------------------------------------------------
-- 5b. seo_settings — per-locale defaults, per-domain verification
-- ---------------------------------------------------------------------------
-- seo_settings stays the global singleton it is. What belongs there is *policy*
-- (robots_enabled, commerce_indexable, sitemap switches, schema toggles) — those govern
-- both domains identically and duplicating them per locale would let the two sites drift
-- into contradicting each other, which is the failure 0025 was written to prevent.
--
-- What does NOT belong there is copy. Title templates, default titles/descriptions and the
-- postal address all differ per language, so they move to a per-locale table. Rows are
-- seeded from the current global values for 'en' and left null elsewhere, so nothing
-- changes for English until someone edits it.

create table seo_settings_locale (
  locale text primary key check (locale in ('en', 'de', 'fr', 'el')),

  title_template text,
  default_title text,
  default_description text,

  -- The organisation's address, written in the reader's language. The Greek site should
  -- carry the Heraklion address in Greek; the same string transliterated is not the same
  -- signal to a Greek searcher, and Google reads this as the LocalBusiness address.
  organization_street text,
  organization_city text,
  organization_region text,
  opening_hours text,

  updated_at timestamptz not null default now()
);

insert into seo_settings_locale (locale, title_template, default_title, default_description,
                                 organization_street, organization_city, organization_region, opening_hours)
select 'en', title_template, default_title, default_description,
       organization_street, organization_city, organization_region, opening_hours
  from seo_settings where id = 'global';

insert into seo_settings_locale (locale) values ('de'), ('fr'), ('el');

alter table seo_settings_locale enable row level security;
-- Public read, matching seo_settings: the storefront's metadata resolver needs these on
-- every render, and they are rendered into a public <head> regardless.
create policy "Public read" on seo_settings_locale for select using (true);

-- Search Console verification is per *domain*, not per locale — .com is a separate
-- property from .gr and gets its own token, but en/de/fr all live on .com and share one.
-- Keeping the existing columns as the .gr pair and adding a .com pair says that plainly;
-- putting verification in the per-locale table above would have implied de and fr need
-- their own tokens, which they do not.
alter table seo_settings add column google_site_verification_com text;
alter table seo_settings add column bing_site_verification_com text;

-- ---------------------------------------------------------------------------
-- 6. Greek tax identity
-- ---------------------------------------------------------------------------
-- ΑΦΜ / ΔΟΥ / EU VAT number, needed on invoices and in LocalBusiness JSON-LD. Stored
-- rather than hardcoded so the owner can fill them in without a deploy. Null until then;
-- src/lib/tax.ts renders a visible placeholder so a blank can never ship unnoticed.
alter table seo_settings add column tax_afm text;
alter table seo_settings add column tax_doy text;
alter table seo_settings add column tax_eu_vat_id text;
