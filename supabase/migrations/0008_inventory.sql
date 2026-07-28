-- Hector 1984 Wholesale — real stock tracking. Orders were previously
-- placeable for any style/colorway/box combination regardless of any
-- real-world stock position. Inventory is tracked at the same granularity
-- buyers actually order in (style x colorway x box type — box8/box10/box12),
-- not per individual pair/size, since that's what the matrix/linesheet UI
-- lets a buyer select.
-- Run once in the Supabase SQL Editor, after 0001-0007.

create table inventory (
  id uuid primary key default gen_random_uuid(),
  style_id text not null references styles(id) on delete cascade,
  colorway_id text not null references colorways(id) on delete cascade,
  box_type_id text not null references box_types(id),
  on_hand int not null default 0 check (on_hand >= 0),
  unique (style_id, colorway_id, box_type_id)
);

create index inventory_style_id_idx on inventory(style_id);

alter table inventory enable row level security;
create policy "Public read" on inventory for select using (true);

-- Atomic, race-safe stock adjustment: succeeds (returns true) only if the
-- resulting on_hand would stay >= 0, so two concurrent checkouts can't both
-- decrement past zero. Also used with a negative p_qty to roll back a
-- decrement if a later line in the same order fails its own stock check.
create or replace function adjust_inventory(
  p_style_id text,
  p_colorway_id text,
  p_box_type_id text,
  p_qty int
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
    and on_hand >= p_qty;
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;
