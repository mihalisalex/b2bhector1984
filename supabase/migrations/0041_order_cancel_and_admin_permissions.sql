-- ---------------------------------------------------------------------------
-- 0041. Cancelled orders, and permissions for the rest of the admin
-- ---------------------------------------------------------------------------
-- Run once in the Supabase SQL Editor, after 0040. Run it BEFORE deploying the code
-- that ships with it: that code gates orders/accounts/content actions on the three
-- permission keys seeded below, and until they exist every role except Super Admin
-- is refused.
--
-- 1. `cancelled` order status.
--
--    Checkout takes stock off the shelf when a proforma request is submitted. There
--    was no way to call an order off, so a request that never went ahead held its
--    boxes forever. Cancelling (from the admin order page) puts every in-stock line
--    back; see `updateOrderStatus` in runtimeOrders.ts.
--
-- 2. `orders.manage`, `accounts.manage`, `content.manage`.
--
--    The permission matrix only governed the Products module. Everything in
--    adminActions.ts (order edits, application approval, price multipliers, credit
--    terms, sales reps, homepage/season content) and the journal checked only
--    "is this an admin", so a Content Editor could change a buyer's pricing. The
--    defaults below keep each role doing what its name says; adjust them at
--    /admin/permissions.

-- The original checks were declared inline in 0001/0009, so their names were chosen by
-- Postgres. Drop whatever check currently constrains `status` rather than guessing a name:
-- if a guess missed, the old check would stay and still reject 'cancelled'.
do $$
declare
  c record;
begin
  for c in
    select con.conrelid::regclass as tbl, con.conname
    from pg_constraint con
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
    where con.contype = 'c'
      and con.conrelid in ('orders'::regclass, 'order_status_history'::regclass)
      and att.attname = 'status'
  loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;

alter table orders add constraint orders_status_check
  check (status in ('submitted', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled'));
alter table order_status_history add constraint order_status_history_status_check
  check (status in ('submitted', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled'));

insert into role_permissions (role, permission_key, allowed) values
  ('super_admin', 'orders.manage', true), ('super_admin', 'accounts.manage', true), ('super_admin', 'content.manage', true),
  ('admin', 'orders.manage', true), ('admin', 'accounts.manage', true), ('admin', 'content.manage', true),
  ('inventory_manager', 'orders.manage', true), ('inventory_manager', 'accounts.manage', false), ('inventory_manager', 'content.manage', false),
  ('sales_manager', 'orders.manage', true), ('sales_manager', 'accounts.manage', true), ('sales_manager', 'content.manage', false),
  ('marketing', 'orders.manage', false), ('marketing', 'accounts.manage', false), ('marketing', 'content.manage', true),
  ('content_editor', 'orders.manage', false), ('content_editor', 'accounts.manage', false), ('content_editor', 'content.manage', true)
on conflict (role, permission_key) do nothing;
