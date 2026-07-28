-- Hector 1984 Wholesale — enterprise Product Management module, part 3/3:
-- per-product view analytics, role-based permissions for the admin Products
-- module, and per-customer-group price overrides.
-- Run once in the Supabase SQL Editor, after 0013-0014.

-- Real page-view tracking (there was none before) — one row per product-page
-- visit, aggregated in the editor's Analytics tab alongside real order data.
create table style_views (
  id uuid primary key default gen_random_uuid(),
  style_id text not null references styles(id) on delete cascade,
  account_id text references accounts(id) on delete set null,
  viewed_at timestamptz not null default now()
);
create index style_views_style_id_idx on style_views(style_id, viewed_at desc);
alter table style_views enable row level security; -- service-role only (written by a server action)

-- Admin staff sub-roles, distinct from the buyer/admin `role` column. Only
-- meaningful when role = 'admin'. Existing admin accounts default to
-- super_admin (unrestricted) so nobody is locked out by this migration.
alter table accounts add column admin_role text
  check (admin_role in ('super_admin', 'admin', 'inventory_manager', 'sales_manager', 'marketing', 'content_editor'));
update accounts set admin_role = 'super_admin' where role = 'admin';

-- Configurable permission matrix for the Products module. `role` values match
-- accounts.admin_role above. Checked server-side in productActions.ts before
-- every mutation — see requirePermission().
create table role_permissions (
  role text not null,
  permission_key text not null,
  allowed boolean not null default true,
  primary key (role, permission_key)
);

insert into role_permissions (role, permission_key, allowed) values
  ('super_admin', 'products.view', true), ('super_admin', 'products.create', true), ('super_admin', 'products.edit', true),
  ('super_admin', 'products.delete', true), ('super_admin', 'products.pricing', true), ('super_admin', 'products.inventory', true),
  ('super_admin', 'products.seo', true), ('super_admin', 'products.bulk', true), ('super_admin', 'products.import_export', true),
  ('super_admin', 'products.permissions', true),
  ('admin', 'products.view', true), ('admin', 'products.create', true), ('admin', 'products.edit', true),
  ('admin', 'products.delete', true), ('admin', 'products.pricing', true), ('admin', 'products.inventory', true),
  ('admin', 'products.seo', true), ('admin', 'products.bulk', true), ('admin', 'products.import_export', true),
  ('admin', 'products.permissions', false),
  ('inventory_manager', 'products.view', true), ('inventory_manager', 'products.create', false), ('inventory_manager', 'products.edit', false),
  ('inventory_manager', 'products.delete', false), ('inventory_manager', 'products.pricing', false), ('inventory_manager', 'products.inventory', true),
  ('inventory_manager', 'products.seo', false), ('inventory_manager', 'products.bulk', false), ('inventory_manager', 'products.import_export', true),
  ('inventory_manager', 'products.permissions', false),
  ('sales_manager', 'products.view', true), ('sales_manager', 'products.create', false), ('sales_manager', 'products.edit', true),
  ('sales_manager', 'products.delete', false), ('sales_manager', 'products.pricing', true), ('sales_manager', 'products.inventory', false),
  ('sales_manager', 'products.seo', false), ('sales_manager', 'products.bulk', true), ('sales_manager', 'products.import_export', true),
  ('sales_manager', 'products.permissions', false),
  ('marketing', 'products.view', true), ('marketing', 'products.create', false), ('marketing', 'products.edit', true),
  ('marketing', 'products.delete', false), ('marketing', 'products.pricing', false), ('marketing', 'products.inventory', false),
  ('marketing', 'products.seo', true), ('marketing', 'products.bulk', false), ('marketing', 'products.import_export', false),
  ('marketing', 'products.permissions', false),
  ('content_editor', 'products.view', true), ('content_editor', 'products.create', false), ('content_editor', 'products.edit', true),
  ('content_editor', 'products.delete', false), ('content_editor', 'products.pricing', false), ('content_editor', 'products.inventory', false),
  ('content_editor', 'products.seo', true), ('content_editor', 'products.bulk', false), ('content_editor', 'products.import_export', false),
  ('content_editor', 'products.permissions', false);

alter table role_permissions enable row level security; -- service-role only

-- Per-customer-group product price overrides. Stored/editable/displayed in
-- the Pricing tab; deliberately NOT wired into the live checkout pricing
-- engine (src/lib/pricing.ts), which stays on the settled
-- payment-terms-discount-only model — see that file's header comment before
-- changing this.
create table customer_group_prices (
  id uuid primary key default gen_random_uuid(),
  style_id text not null references styles(id) on delete cascade,
  group_name text not null,
  price numeric not null,
  unique (style_id, group_name)
);
create index customer_group_prices_style_id_idx on customer_group_prices(style_id);
alter table customer_group_prices enable row level security; -- service-role only
