-- Hector 1984 Wholesale — buyer-facing wishlist/favorites (part of the storefront
-- UX overhaul, 2026-07-29). A real per-account, per-style saved-product list —
-- distinct from Saved Assortments (which save a named group of styles for
-- reordering), this is the simple heart-toggle "favorite this product" buyers
-- expect from any modern B2B catalog.
-- Run once in the Supabase SQL Editor, after 0001-0017.

create table favorites (
  account_id text not null references accounts(id) on delete cascade,
  style_id text not null references styles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (account_id, style_id)
);

create index favorites_account_id_idx on favorites(account_id);

alter table favorites enable row level security; -- service-role only, same posture as orders/accounts
