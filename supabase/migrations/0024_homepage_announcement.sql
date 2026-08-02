-- Hector 1984 Wholesale — editable homepage announcement bar
-- Run once in the Supabase SQL Editor, after 0001-0023.
--
-- Extends the existing single-row `site_content` table (id = 'homepage_hero')
-- rather than adding a new table — this is still "homepage content", just a
-- different section of it, and reuses the same admin form and fetch already
-- in place for the hero.

alter table site_content
  add column announcement_enabled boolean not null default true,
  add column announcement_text text not null default 'Summer 2027 Collection is Live Now',
  add column announcement_href text not null default '/catalogue';
