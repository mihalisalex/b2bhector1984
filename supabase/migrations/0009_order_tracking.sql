-- Hector 1984 Wholesale — order status history + shipment tracking.
-- Status changes previously just overwrote `orders.status` with no record of
-- who/when/what-changed; there was also nowhere to record a tracking number
-- or carrier once an order shipped.
-- Run once in the Supabase SQL Editor, after 0001-0008.

alter table orders add column tracking_number text;
alter table orders add column carrier text;

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  status text not null check (status in ('submitted', 'confirmed', 'in_production', 'shipped', 'delivered')),
  changed_at timestamptz not null default now()
);

create index order_status_history_order_id_idx on order_status_history(order_id);

alter table order_status_history enable row level security;
-- No policies — service-role-only, same posture as orders/order_lines.

-- Backfill one history row per existing order at its current status, so the
-- timeline has a starting point instead of appearing empty for old orders.
insert into order_status_history (order_id, status, changed_at)
select id, status, placed_at from orders;
