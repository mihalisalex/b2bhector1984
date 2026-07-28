-- Hector 1984 Wholesale — signed, revocable sessions.
-- The session cookie used to be the raw account id with no signature — anyone
-- who could set a cookie value with a known/guessed account id got that
-- account's session. Sessions are now a random opaque token in this table,
-- validated (and expiry-checked) against the DB on every request.
-- Run once in the Supabase SQL Editor, after 0001-0006.

create table sessions (
  token text primary key,
  account_id text not null references accounts(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index sessions_account_id_idx on sessions(account_id);

alter table sessions enable row level security;
-- No policies — same posture as accounts/orders: service-role-only access.
