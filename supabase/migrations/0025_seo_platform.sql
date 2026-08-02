-- Hector 1984 Wholesale — enterprise SEO platform
-- Run once in the Supabase SQL Editor, after 0001-0024.
--
-- Four new tables plus a handful of columns on `styles`. The design principle
-- throughout: every SEO decision that a non-technical admin might reasonably
-- want to change lives in the database, not in code. `robots.ts`, `sitemap.ts`,
-- `proxy.ts` and every page's `generateMetadata` read from here.
--
-- Everything degrades gracefully if this migration hasn't been run yet — the
-- data layer catches missing-table/column errors and falls back to the values
-- that were hardcoded before (see src/lib/data/seoSettings.ts).

-- ---------------------------------------------------------------------------
-- 1. Global SEO settings — a single row, same singleton pattern as site_content
-- ---------------------------------------------------------------------------

create table seo_settings (
  id text primary key default 'global' check (id = 'global'),

  -- Identity / defaults
  site_name text not null default 'Hector 1984',
  title_template text not null default '%s — Hector 1984 Wholesale',
  default_title text not null default 'Hector 1984 — Wholesale Footwear',
  default_description text not null default
    'Full-grain leather footwear for wholesale buyers. Two seasonal collections, box-only ordering, trade terms.',
  default_og_image_url text,
  twitter_site text,
  twitter_creator text,
  default_twitter_card text not null default 'summary_large_image',

  -- Indexing policy. `commerce_indexable` is the single lever that decides
  -- whether the gated trade surfaces (catalogue, product, quick-order,
  -- linesheet) are advertised to search engines at all. It is FALSE by default
  -- and must stay that way unless the business decides to expose a public
  -- catalogue tier — wholesale pricing must not be indexed. Flipping it here
  -- changes robots.txt, the sitemap and every product page's robots meta tag
  -- together, so the three can never drift apart.
  commerce_indexable boolean not null default false,
  robots_enabled boolean not null default true,
  extra_disallow text[] not null default '{}',
  extra_allow text[] not null default '{}',
  crawl_delay integer,
  sitemap_enabled boolean not null default true,
  sitemap_include_images boolean not null default true,

  -- Organization / LocalBusiness structured data
  organization_legal_name text not null default 'Hector 1984',
  organization_logo_url text,
  organization_email text,
  organization_phone text,
  organization_street text,
  organization_city text,
  organization_region text,
  organization_postal_code text,
  organization_country text not null default 'GR',
  organization_founding_year text,
  social_profiles text[] not null default '{}',
  local_business_enabled boolean not null default false,
  opening_hours text,

  -- Structured-data feature switches, so an admin can turn an individual
  -- schema type off if Search Console ever flags it.
  schema_organization boolean not null default true,
  schema_website boolean not null default true,
  schema_breadcrumbs boolean not null default true,
  schema_product boolean not null default true,
  schema_faq boolean not null default true,

  -- Search-engine verification tokens (rendered as <meta> in the root layout)
  google_site_verification text,
  bing_site_verification text,

  updated_at timestamptz not null default now()
);

insert into seo_settings (id) values ('global');

alter table seo_settings enable row level security;
-- Public read: robots.txt/sitemap.xml are themselves public documents, and the
-- storefront's metadata resolver needs these values on every render.
create policy "Public read" on seo_settings for select using (true);

-- ---------------------------------------------------------------------------
-- 2. Redirect manager
-- ---------------------------------------------------------------------------

create table seo_redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  status_code integer not null default 301 check (status_code in (301, 302, 307, 308)),
  enabled boolean not null default true,
  -- Redirects created automatically when a product slug changes are marked
  -- so the admin UI can distinguish them from hand-authored ones (and so a
  -- bulk delete of manual rules never silently breaks old product links).
  source text not null default 'manual' check (source in ('manual', 'slug_change', 'import')),
  notes text,
  hit_count integer not null default 0,
  last_hit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index seo_redirects_enabled_idx on seo_redirects (enabled) where enabled;

alter table seo_redirects enable row level security;
-- Service-role only. The proxy reads these through the service client, and
-- nothing in the browser has any reason to enumerate the redirect table.

-- Carry over the one hard-coded legacy redirect that used to live in
-- src/app/(shop)/product/[slug]/page.tsx, so the redirect manager is the single
-- place these are maintained from now on. The in-code map stays as a
-- pre-migration fallback and is documented as such.
insert into seo_redirects (from_path, to_path, status_code, source, notes) values
  ('/product/riviera-loafer', '/product/hector-boat-loafer', 301, 'slug_change',
   'HL-1001 — corrected 2026-07-29, migrated out of the hard-coded map in the product page.');

-- Atomic hit counter. Called fire-and-forget from the proxy, so it must never
-- be able to block or fail a redirect — hence a function rather than a
-- read-modify-write from application code.
create or replace function bump_redirect_hit(p_id uuid)
returns void
language sql
as $$
  update seo_redirects
     set hit_count = hit_count + 1,
         last_hit_at = now()
   where id = p_id;
$$;

-- ---------------------------------------------------------------------------
-- 3. Per-entity SEO overrides
-- ---------------------------------------------------------------------------
-- Categories, seasons and marketing pages are not database rows in this app —
-- categories are a TypeScript union, marketing pages are files. They still need
-- editable metadata, so this table is keyed by (type, key) rather than by a
-- foreign key. Collections/brands/suppliers ARE real rows, and use their uuid
-- as the key.

create table seo_entity_meta (
  entity_type text not null check (
    entity_type in ('category', 'collection', 'brand', 'supplier', 'season', 'page')
  ),
  entity_key text not null,

  seo_title text,
  meta_description text,
  focus_keyword text,
  secondary_keywords text[] not null default '{}',
  canonical_url text,
  robots text not null default 'index,follow',
  og_title text,
  og_description text,
  og_image_url text,
  twitter_title text,
  twitter_description text,
  twitter_image_url text,
  twitter_card text not null default 'summary_large_image',
  structured_data jsonb,
  updated_at timestamptz not null default now(),

  primary key (entity_type, entity_key)
);

alter table seo_entity_meta enable row level security;
create policy "Public read" on seo_entity_meta for select using (true);

-- ---------------------------------------------------------------------------
-- 4. Slug history
-- ---------------------------------------------------------------------------
-- Every slug a product has ever had. Written on create and on every rename;
-- the rename path also inserts a matching row into seo_redirects so old links
-- keep working. Kept separate from seo_redirects so that "what did this
-- product used to be called" survives an admin deleting the redirect.

create table style_slug_history (
  id uuid primary key default gen_random_uuid(),
  style_id text not null references styles(id) on delete cascade,
  slug text not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create index style_slug_history_slug_idx on style_slug_history (slug);
create index style_slug_history_style_idx on style_slug_history (style_id);

-- Seed with every existing product's current slug so the history is complete
-- from day one rather than only recording changes made after this migration.
insert into style_slug_history (style_id, slug, is_current)
select id, slug, true from styles;

alter table style_slug_history enable row level security;

-- ---------------------------------------------------------------------------
-- 5. Product SEO fields that 0013 didn't cover
-- ---------------------------------------------------------------------------
-- 0013 added seo_title/meta_description/seo_keywords/canonical_url/robots/
-- og_* /twitter_card/structured_data. These are the genuinely missing ones:
-- a distinguished focus keyword (the term the page is actually optimised for,
-- which drives the audit engine's keyword checks), and Twitter card fields
-- that can differ from the Open Graph ones.

alter table styles
  add column focus_keyword text,
  add column secondary_keywords text[] not null default '{}',
  add column twitter_title text,
  add column twitter_description text,
  add column twitter_image_url text;

-- Image captions, for the image sitemap and the media library. Alt text
-- already exists on style_images (0001).
alter table style_images
  add column caption text not null default '';
