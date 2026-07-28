-- Hector 1984 Wholesale — enterprise Product Management module, part 2/3: pricing
-- depth, identifiers, warehouses, and inventory movement history.
-- Run once in the Supabase SQL Editor, after 0013.
--
-- NOTE on pricing: `base_price` stays the one field the live checkout/catalog
-- pricing engine reads (see src/lib/pricing.ts) — not duplicated here as a
-- "wholesale_price" column, since that would just be a second field with no
-- effect. `sale_price`/`sale_start_at`/`sale_end_at` DO get wired into the real
-- effective price (see getEffectiveBasePrice in pricing.ts). `distributor_price`
-- is stored/displayed only — this app has no distributor account type today.
-- `cost_price` is real and drives the margin calculation in the editor.

alter table styles
  add column cost_price numeric not null default 0,
  add column distributor_price numeric,
  add column sale_price numeric,
  add column sale_start_at timestamptz,
  add column sale_end_at timestamptz,
  add column currency text not null default 'EUR',
  add column tax_class text not null default 'standard',
  add column vat_rate numeric not null default 0.24,
  add column barcode text,
  add column gtin text,
  add column upc text,
  add column mpn text,
  add column low_stock_threshold int not null default 5,
  add column track_inventory boolean not null default true,
  add column allow_backorder boolean not null default false,
  add column incoming_stock int not null default 0;

create table warehouses (
  id text primary key,
  name text not null,
  location text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
insert into warehouses (id, name, location, is_default) values ('main', 'Main Warehouse', 'Athens, GR', true);

alter table inventory add column warehouse_id text not null default 'main' references warehouses(id);
alter table inventory add column reserved int not null default 0 check (reserved >= 0);

alter table inventory drop constraint inventory_style_id_colorway_id_box_type_id_key;
alter table inventory add constraint inventory_style_colorway_box_warehouse_key
  unique (style_id, colorway_id, box_type_id, warehouse_id);

-- Extend adjust_inventory with a warehouse dimension, defaulting to 'main' so
-- every existing call site (decrementInventoryForOrder etc) keeps working
-- unchanged against the same single warehouse checkout has always used.
create or replace function adjust_inventory(
  p_style_id text,
  p_colorway_id text,
  p_box_type_id text,
  p_qty int,
  p_warehouse_id text default 'main'
) returns boolean
language plpgsql
as $$
declare
  affected int;
begin
  update inventory
  set on_hand = on_hand - p_qty
  where style_id = p_style_id
    and colorway_id = p_colorway_id
    and box_type_id = p_box_type_id
    and warehouse_id = p_warehouse_id
    and on_hand >= p_qty;
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

-- Real stock history / inventory movements log — every on-hand change (manual
-- admin edit, order decrement, restock) gets a row.
create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  style_id text not null references styles(id) on delete cascade,
  colorway_id text not null references colorways(id) on delete cascade,
  box_type_id text not null references box_types(id),
  warehouse_id text not null references warehouses(id),
  qty_delta int not null,
  reason text not null,
  actor_account_id text references accounts(id) on delete set null,
  created_at timestamptz not null default now()
);
create index inventory_movements_style_id_idx on inventory_movements(style_id, created_at desc);

alter table warehouses enable row level security;
create policy "Public read" on warehouses for select using (true);

alter table inventory_movements enable row level security; -- service-role only
