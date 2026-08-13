-- Hector Footwear Wholesale — let the admin switch the homepage announcement bar's
-- background between black (the site's --color-ink) and a new burgundy accent, from
-- /admin/content, instead of it being hardcoded to bg-ink in HomeAnnouncementBar.tsx.
--
-- Defaults to 'black' so every existing row (and any row created before this migration
-- runs on a given environment) keeps its current look with zero behavior change.

alter table site_content
  add column announcement_color text not null default 'black'
  check (announcement_color in ('black', 'burgundy'));
