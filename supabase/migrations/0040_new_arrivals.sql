-- ---------------------------------------------------------------------------
-- 0040. New Arrivals, and a switch for the live-order strip
-- ---------------------------------------------------------------------------
-- Two homepage changes asked for together, so they land together.
--
-- 1. `styles.new_arrival` — a curated homepage shelf the admin fills by hand.
--
--    NOT reusing the existing `featured` flag. `featured` already means
--    something in the catalogue: it drives the "Featured" facet in the filter
--    panel (see catalogFilters.ts), and it sorts the admin product list. If
--    "new arrival" were the same column, ticking a shoe for the homepage would
--    silently add a filter facet in the catalogue, and the checkbox on the
--    Visibility tab would be labelled for one job while doing two.
--
--    No ordering column. The homepage sorts flagged styles newest-first by
--    `created_at`, which is what "new arrivals" means; a manual sort field
--    would be a second thing to maintain for no gain until someone asks.
--
-- 2. `site_content.order_pulse_enabled` — the live order-activity strip.
--
--    Defaults FALSE, which hides it on the next deploy. That is the ask ("hide
--    this for now"), and a toggle rather than a deletion is what makes "for
--    now" true: the component, its query and its translations all stay, and
--    turning it back on is a checkbox rather than a code change.

alter table styles add column new_arrival boolean not null default false;
alter table site_content add column order_pulse_enabled boolean not null default false;
