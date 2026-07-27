-- Hector 1984 Wholesale — admin account
--
-- This repo is public, so the real admin email/password are never checked in
-- here — the actual seeding is done by `npm run seed:admin`
-- (scripts/seedAdmin.ts), which reads ADMIN_EMAIL / ADMIN_PASSWORD from
-- .env.local (gitignored). This file is kept only as schema documentation;
-- substitute real values for the placeholders below if you ever need to run
-- it by hand in the Supabase SQL Editor.
--
-- Same plain-text-password demo posture as the seeded buyer accounts (see
-- the NOTE in 0001_init.sql) — replace with real hashing / Supabase Auth
-- before any real launch.

insert into accounts (
  id, business_name, contact_name, email, password, tier, status,
  credit_terms, credit_limit, resale_cert_id, business_type, store_location,
  expected_volume, applied_at, approved_at, role
) values (
  'acct-admin-01', 'Hector 1984 HQ', 'House Admin', '<ADMIN_EMAIL>', '<ADMIN_PASSWORD>',
  'vip', 'active', 'net60', 0, 'N/A', 'Internal admin', 'Portland, OR', 'N/A',
  now(), now(), 'admin'
)
on conflict (id) do nothing;
