-- Hector 1984 Wholesale — Product Management module, part 4/4: shipping fields.
-- `weight_oz` already existed (migration 0001) and is reused as "Weight" in the
-- editor's Shipping tab. Run once in the Supabase SQL Editor, after 0013-0015.

alter table styles
  add column length_cm numeric,
  add column width_cm numeric,
  add column height_cm numeric,
  add column shipping_class text not null default 'standard',
  add column freight_class text,
  add column hazardous boolean not null default false,
  add column package_length_cm numeric,
  add column package_width_cm numeric,
  add column package_height_cm numeric;
