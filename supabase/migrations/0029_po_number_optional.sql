-- PO number is no longer collected at checkout or shown anywhere in the app
-- (most buyers don't have a formal PO process) -- see the "remove PO number"
-- change. Existing orders keep whatever value they already have; this just
-- stops new inserts from being rejected now that the app never sends one.
alter table orders alter column po_number drop not null;
