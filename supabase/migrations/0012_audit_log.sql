-- Hector 1984 Wholesale — generic admin audit log. `order_status_history`
-- (0009) only ever records order status transitions; this is a broader
-- actor/action/target log covering every admin-initiated mutation (account
-- edits, order edits, application decisions, sales-rep changes, etc).
-- Run once in the Supabase SQL Editor, after 0001-0011.

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_account_id text references accounts(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index audit_log_created_at_idx on audit_log(created_at desc);

alter table audit_log enable row level security;
-- No policies — service-role-only, same posture as orders/accounts/order_status_history.
