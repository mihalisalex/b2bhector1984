-- Hector 1984 Wholesale — Product Management module, variant (colorway) depth.
-- Per-variant price/cost/sale/weight/dimension overrides and status — nulls
-- mean "inherit the parent product's value" (see getColorwayEffectivePrice-
-- style helpers in the app layer). Run once in the Supabase SQL Editor, after
-- 0013-0016.

alter table colorways
  add column price_override numeric,
  add column cost_override numeric,
  add column sale_price_override numeric,
  add column weight_oz numeric,
  add column length_cm numeric,
  add column width_cm numeric,
  add column height_cm numeric,
  add column status text not null default 'active' check (status in ('active', 'draft', 'archived'));
