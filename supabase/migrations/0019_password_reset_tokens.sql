-- Hector 1984 Wholesale — self-service "forgot password" flow (production
-- audit pass, 2026-07-29). Buyers previously had no recovery path if they
-- forgot their password other than contacting their rep.
-- Run once in the Supabase SQL Editor, after 0001-0018.

create table password_reset_tokens (
  token text primary key,
  account_id text not null references accounts(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index password_reset_tokens_account_id_idx on password_reset_tokens(account_id);

alter table password_reset_tokens enable row level security; -- service-role only, same posture as sessions/orders/accounts
