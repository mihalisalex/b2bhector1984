-- Hector 1984 Wholesale — initial schema
-- Run once in the Supabase SQL Editor (Project > SQL Editor > New query > paste > Run).
--
-- Trust model: this app's Next.js server is the only client that ever talks to
-- Supabase, always with the service role key (never exposed to the browser).
-- Buyer/session auth stays in our own cookie-based system, not Supabase Auth.
-- RLS is enabled everywhere as a safety net; reference/catalog tables allow
-- public read (needed for the public marketing pages), everything else has
-- no policies for anon/authenticated, so only the service role can reach it.
--
-- Primary keys: styles, colorways, accounts, ship_to_addresses, and orders use
-- `text` ids matching the app's existing stable identifiers (e.g. "st-01",
-- "acct-001", "ORD-59090") rather than generated uuids, so the app layer needs
-- no id-translation step. Join-only rows (order_lines, style_images, sales
-- reps, applications, saved assortments) use generated uuids since nothing
-- hardcodes their ids.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference tables
-- ---------------------------------------------------------------------------

create table pricing_tiers (
  id text primary key,                       -- 'standard' | 'preferred' | 'vip'
  label text not null,
  description text not null,
  price_multiplier numeric not null,
  moq_multiplier numeric not null,
  discount_badge text not null,
  sort_order int not null default 0
);

create table box_types (
  id text primary key,                        -- 'box8' | 'box10' | 'box12'
  label text not null,
  total_pairs int not null,
  size_breakdown jsonb not null,               -- { "40": 1, "41": 2, ... }
  sort_order int not null default 0
);

create table sales_reps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  email text not null,
  phone text not null,
  initials text not null,
  territory text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table styles (
  id text primary key,                         -- e.g. "st-01"
  slug text unique not null,
  style_number text unique not null,
  name text not null,
  category text not null check (category in ('running', 'court', 'trail')),
  gender text not null check (gender in ('mens', 'womens', 'unisex')),
  availability text not null check (availability in ('available', 'prebook')),
  ship_window text,
  tagline text not null,
  description text not null,
  materials text[] not null default '{}',
  base_price numeric not null,
  msrp numeric not null,
  price_breaks jsonb not null,                 -- [{ "minUnits": 1, "multiplier": 1 }, ...]
  moq_boxes int not null default 1,
  tier_eligibility text[] not null default '{standard,preferred,vip}',
  weight_oz numeric,
  last_note text,
  created_at timestamptz not null default now()
);

create table colorways (
  id text primary key,                         -- e.g. "st-01-c1" (unique across styles)
  style_id text not null references styles(id) on delete cascade,
  name text not null,
  sku_suffix text not null,
  swatch_1 text not null,
  swatch_2 text,
  sort_order int not null default 0
);

create index colorways_style_id_idx on colorways(style_id);

create table style_images (
  id uuid primary key default gen_random_uuid(),
  style_id text not null references styles(id) on delete cascade,
  colorway_id text references colorways(id) on delete set null,
  storage_path text not null,                  -- path within the "style-images" storage bucket
  alt_text text not null default '',
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index style_images_style_id_idx on style_images(style_id);

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------

create table accounts (
  id text primary key,                         -- e.g. "acct-001"
  business_name text not null,
  contact_name text not null,
  email text unique not null,
  password text not null,                      -- demo-grade plain storage; see note below
  tier text not null references pricing_tiers(id),
  status text not null check (status in ('pending', 'approved', 'active', 'declined')),
  credit_terms text not null check (credit_terms in ('prepay', 'net30', 'net60')),
  credit_limit numeric not null default 0,
  resale_cert_id text not null,
  business_type text not null,
  store_location text not null,
  expected_volume text not null,
  applied_at timestamptz not null default now(),
  approved_at timestamptz,
  rep_id uuid references sales_reps(id),
  role text not null default 'buyer' check (role in ('buyer', 'admin')),
  created_at timestamptz not null default now()
);
-- NOTE: passwords are stored in plain text to match this project's existing
-- demo posture (mock credentials are shown directly on the login screen).
-- Before any real launch, replace with Supabase Auth or hashed credentials.

create table ship_to_addresses (
  id text primary key,                         -- e.g. "acct-001-ship-1"
  account_id text not null references accounts(id) on delete cascade,
  label text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  zip text not null,
  is_default boolean not null default false
);

create index ship_to_addresses_account_id_idx on ship_to_addresses(account_id);

create table applications (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  resale_cert_id text not null,
  business_type text not null,
  store_location text not null,
  address_line1 text not null,
  city text not null,
  state text not null,
  zip text not null,
  expected_volume text not null,
  website text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'active', 'declined')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table saved_assortments (
  id uuid primary key default gen_random_uuid(),
  account_id text not null references accounts(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table saved_assortment_styles (
  assortment_id uuid not null references saved_assortments(id) on delete cascade,
  style_id text not null references styles(id) on delete cascade,
  primary key (assortment_id, style_id)
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table orders (
  id text primary key,                         -- e.g. "ORD-59090"
  account_id text not null references accounts(id),
  po_number text not null,
  placed_at timestamptz not null default now(),
  status text not null default 'submitted'
    check (status in ('submitted', 'confirmed', 'in_production', 'shipped', 'delivered')),
  terms text not null check (terms in ('prepay', 'net30', 'net60')),
  ship_to_id text references ship_to_addresses(id),
  notes text,
  invoice_url text
);

create index orders_account_id_idx on orders(account_id);

create table order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  style_id text not null references styles(id),
  colorway_id text not null references colorways(id),
  box_type_id text not null references box_types(id),
  qty int not null check (qty > 0),
  unit_price numeric not null
);

create index order_lines_order_id_idx on order_lines(order_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table pricing_tiers enable row level security;
alter table box_types enable row level security;
alter table sales_reps enable row level security;
alter table styles enable row level security;
alter table colorways enable row level security;
alter table style_images enable row level security;
alter table accounts enable row level security;
alter table ship_to_addresses enable row level security;
alter table applications enable row level security;
alter table saved_assortments enable row level security;
alter table saved_assortment_styles enable row level security;
alter table orders enable row level security;
alter table order_lines enable row level security;

-- Public read on reference/catalog data only (the public lookbook pages need
-- this; pricing gating is enforced by the app, same as before). Everything
-- else has RLS enabled with no policies, which denies all access to the
-- anon/authenticated roles by default — only the service role (used
-- exclusively server-side by this app) can reach it.
create policy "Public read" on pricing_tiers for select using (true);
create policy "Public read" on box_types for select using (true);
create policy "Public read" on styles for select using (true);
create policy "Public read" on colorways for select using (true);
create policy "Public read" on style_images for select using (true);

-- ---------------------------------------------------------------------------
-- Storage bucket for admin-uploaded product photography
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('style-images', 'style-images', true)
on conflict (id) do nothing;

create policy "Public read style images"
  on storage.objects for select
  using (bucket_id = 'style-images');
