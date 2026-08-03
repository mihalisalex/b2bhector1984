-- Hector 1984 Wholesale — Journal (SEO content hub)
-- Run once in the Supabase SQL Editor, after 0001-0026.
--
-- A single table, deliberately not modeled after the Product Management
-- module's many-tables-per-concern shape (0013-0017) — a journal post has no
-- variants/inventory/pricing to normalize out, so every field lives on one
-- row, closer to `site_content`'s singleton pattern than `styles`'. SEO fields
-- (seo_title/meta_description/og_image_url/canonical_url/robots) are
-- first-class columns here, mirroring how `styles` carries its own SEO
-- columns directly rather than going through the polymorphic
-- `seo_entity_meta` table — an article, like a product, is a real row with
-- its own identity, unlike a category or a marketing page.
--
-- Degrades gracefully if this hasn't been run yet: src/lib/data/journalPosts.ts
-- catches missing-table errors and returns empty lists / undefined, same
-- pattern as every other post-launch migration in this app.

create table journal_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content_html text not null default '',
  featured_image_path text,
  featured_image_url text,
  author_name text not null default 'Hector 1984 Team',
  category text not null default 'Industry Insights' check (
    category in (
      'Industry Insights',
      'Market Trends',
      'Buyer Guides',
      'Supplier Guides',
      'Procurement Insights',
      'Case Studies',
      'Marketplace Updates'
    )
  ),
  tags text[] not null default '{}',
  featured boolean not null default false,

  -- Draft/publish/schedule — same shape and same manual-flip caveat as
  -- styles.status/publish_at (0013): scheduling stores an intent, it doesn't
  -- run a background job that flips the row at that time.
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled', 'archived')),
  publish_at timestamptz,
  published_at timestamptz,

  -- SEO
  seo_title text,
  meta_description text,
  og_image_url text,
  canonical_url text,
  robots text not null default 'index,follow',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index journal_posts_status_idx on journal_posts (status);
create index journal_posts_category_idx on journal_posts (category);
create index journal_posts_published_at_idx on journal_posts (published_at desc);

alter table journal_posts enable row level security;
-- Public read: the journal is a public content hub, not a gated commerce
-- surface — every published page (listing, article, sitemap) reads this
-- directly. Only the service-role key (supabaseAdmin) can write.
create policy "Public read" on journal_posts for select using (true);

-- ---------------------------------------------------------------------------
-- Storage bucket for featured images (same signed-upload-URL pattern as
-- site-content / style-images — never a direct form-action file upload)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('journal-images', 'journal-images', true)
on conflict (id) do nothing;

create policy "Public read journal images"
  on storage.objects for select
  using (bucket_id = 'journal-images');
