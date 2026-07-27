-- Hector 1984 Wholesale — per-style box availability
-- Run once in the Supabase SQL Editor, after 0001_init.sql / 0002_admin_seed.sql.
--
-- Not every style ships in all three pre-pack box sizes. Defaults every
-- existing style to all three (today's behavior); the admin dashboard can
-- narrow this per style going forward.

alter table styles
  add column if not exists available_box_types text[] not null default '{box8,box10,box12}';
