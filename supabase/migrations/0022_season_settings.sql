-- Hector 1984 Wholesale — admin-configurable season settings
-- Run once in the Supabase SQL Editor, after 0001-0021.
--
-- One row per season (season is still the fixed "summer"/"winter" key used
-- throughout styles.season) so the admin dashboard can toggle a season off
-- the storefront and rename its display label (e.g. "Summer 2027") without a
-- code deploy or touching the underlying style data.

create table season_settings (
  season text primary key check (season in ('summer', 'winter')),
  enabled boolean not null default true,
  label text not null,
  updated_at timestamptz not null default now()
);

insert into season_settings (season, enabled, label) values
  ('summer', true, 'Summer'),
  ('winter', true, 'Winter');

alter table season_settings enable row level security;
create policy "Public read" on season_settings for select using (true);
