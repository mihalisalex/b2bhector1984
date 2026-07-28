-- Hector 1984 Wholesale — enterprise Product Management module, part 1/3: catalog core.
-- Brands, suppliers, collections, tags, status/publish scheduling, SEO fields,
-- related-product overrides, documents/media, custom attributes, variant (colorway)
-- identifiers. Run once in the Supabase SQL Editor, after 0001-0012.

create table brands (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  lead_time_days int,
  created_at timestamptz not null default now()
);

create table collections (
  id text primary key,
  name text not null,
  slug text unique not null,
  sort_order int not null default 0
);

create table style_collections (
  style_id text not null references styles(id) on delete cascade,
  collection_id text not null references collections(id) on delete cascade,
  primary key (style_id, collection_id)
);

-- Seed the one existing brand up front so `brand_id` can default to it below —
-- this app is single-brand today but the schema doesn't hardcode that.
insert into brands (id, name) values ('hector-1984', 'Hector 1984');

alter table styles
  add column brand_id text not null default 'hector-1984' references brands(id),
  add column supplier_id uuid references suppliers(id),
  add column product_type text not null default 'Footwear',
  add column tags text[] not null default '{}',
  add column status text not null default 'active' check (status in ('active', 'draft', 'archived', 'private')),
  add column featured boolean not null default false,
  add column publish_at timestamptz,
  add column seo_title text,
  add column meta_description text,
  add column seo_keywords text[] not null default '{}',
  add column canonical_url text,
  add column robots text not null default 'index,follow',
  add column og_title text,
  add column og_description text,
  add column og_image_url text,
  add column twitter_card text not null default 'summary_large_image',
  add column structured_data jsonb;

-- Variant-level identifiers. This app's "variant" grain is colorway x box-type
-- (box-only wholesale ordering, a deliberate/settled part of this domain — see
-- BOX_TYPES/getAvailableBoxTypes) rather than per-pair SKUs, so SKU/barcode live
-- on the colorway, the actual sellable unit.
alter table colorways
  add column sku text,
  add column barcode text;

create table style_relations (
  id uuid primary key default gen_random_uuid(),
  style_id text not null references styles(id) on delete cascade,
  related_style_id text not null references styles(id) on delete cascade,
  relation_type text not null check (relation_type in ('related', 'cross_sell', 'upsell', 'frequently_bought', 'accessory')),
  sort_order int not null default 0,
  unique (style_id, related_style_id, relation_type)
);
create index style_relations_style_id_idx on style_relations(style_id);

-- Manuals/datasheets/certificates/installation guides/warranty docs/video/360°
-- images — same signed-URL storage pipeline as style_images, different bucket.
create table style_documents (
  id uuid primary key default gen_random_uuid(),
  style_id text not null references styles(id) on delete cascade,
  kind text not null check (kind in ('manual', 'datasheet', 'certificate', 'installation_guide', 'warranty', 'video', 'image_360', 'other')),
  storage_path text not null,
  label text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index style_documents_style_id_idx on style_documents(style_id);

-- Unlimited custom attributes (Material, Finish, Country of Origin, Warranty, ...).
create table style_attributes (
  id uuid primary key default gen_random_uuid(),
  style_id text not null references styles(id) on delete cascade,
  key text not null,
  value text not null,
  sort_order int not null default 0
);
create index style_attributes_style_id_idx on style_attributes(style_id);

alter table brands enable row level security;
create policy "Public read" on brands for select using (true);

alter table suppliers enable row level security; -- no policy: service-role only, admin-internal data

alter table collections enable row level security;
create policy "Public read" on collections for select using (true);

alter table style_collections enable row level security;
create policy "Public read" on style_collections for select using (true);

alter table style_relations enable row level security;
create policy "Public read" on style_relations for select using (true);

alter table style_documents enable row level security;
create policy "Public read" on style_documents for select using (true);

alter table style_attributes enable row level security;
create policy "Public read" on style_attributes for select using (true);
