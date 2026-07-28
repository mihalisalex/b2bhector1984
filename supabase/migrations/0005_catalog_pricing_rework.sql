-- Hector 1984 Wholesale — catalog restructure + terms-based pricing
-- Run once in the Supabase SQL Editor, after 0001-0004.
--
-- Replaces the Running/Court/Trail catalog with a two-season, seven-category
-- catalog (Summer: loafers/wedding/sneakers/sandals, Winter:
-- boots/sneakers/formal/anatomic), and replaces per-style quantity price
-- breaks + Standard/Preferred/VIP account tiers with a flat payment-terms
-- discount (prepay 10% / net30 5% / net60 0%) computed in the app layer.
--
-- DESTRUCTIVE: the old category values can't satisfy the new check
-- constraint and there's no reasonable mapping to the new categories, so
-- this truncates the existing demo catalog, order history, and saved
-- assortments before reseeding fresh data via `npm run seed`.

truncate table styles, orders, saved_assortments restart identity cascade;

alter table styles
  drop column price_breaks,
  drop column tier_eligibility,
  add column season text not null check (season in ('summer', 'winter'));

alter table styles drop constraint styles_category_check;
alter table styles add constraint styles_category_check
  check (category in ('loafers', 'wedding', 'sneakers', 'sandals', 'boots', 'formal', 'anatomic'));

alter table accounts drop column tier;
drop table pricing_tiers;

-- Refresh the homepage hero copy to match the new catalog positioning
-- (site_content was seeded/edited independently of the product catalog —
-- see supabase/migrations/0004_site_content.sql and /admin/content).
update site_content
set
  heading = E'Full-grain footwear\nfor every season\nyour floor sells.',
  body = 'Hector 1984 has sold into independent footwear retailers across every category — loafers to boots — since the year we were founded. Same construction standards. Same retailers who reorder every season.'
where id = 'homepage_hero';
