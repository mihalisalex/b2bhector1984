-- Per-style toggle for *how* production-upon-request (migration 0030) is presented to
-- buyers: 'made_to_order' keeps the existing ~40-day ETA messaging; 'pre_order' drops the
-- fixed ETA and tells the buyer timing will be confirmed once we're ready. Purely a
-- messaging/ETA distinction — the underlying stock-vs-production decision in
-- decrementInventoryForOrder() is unchanged either way.
alter table styles add column backorder_mode text not null default 'made_to_order'
  check (backorder_mode in ('made_to_order', 'pre_order'));
