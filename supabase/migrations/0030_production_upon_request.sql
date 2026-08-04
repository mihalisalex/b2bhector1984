-- Production-upon-request ordering: buyers can order beyond on-hand stock, the
-- shortfall goes into production (~40 days by default) instead of being blocked
-- outright. See DEVELOPMENT_LOG.md / project memory for the full feature writeup.

-- Wire up the existing (previously unused — never read by any stock-check code)
-- backorder flag, on for every product by default.
alter table styles alter column allow_backorder set default true;
update styles set allow_backorder = true;

-- Per-line fulfillment source, decided once at order placement by the atomic
-- stock check in decrementInventoryForOrder(). 'stock' = decremented from
-- on-hand as before; 'production' = this line's units were never available,
-- on_hand was left untouched, and it's on order with a production_eta instead.
alter table order_lines add column fulfillment text not null default 'stock'
  check (fulfillment in ('stock', 'production'));
alter table order_lines add column production_eta date;

-- Site-wide production lead time, admin-editable without a deploy — same
-- singleton site_content row already used for the homepage hero, announcement
-- bar, and WhatsApp closing note.
alter table site_content add column production_lead_time_days integer not null default 40;
