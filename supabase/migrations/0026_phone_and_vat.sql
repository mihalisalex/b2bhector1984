-- Hector 1984 Wholesale — buyer phone number + order-level VAT
-- Run once in the Supabase SQL Editor, after 0001-0025.
--
-- Two independent additions needed for the "WhatsApp the proforma invoice"
-- feature: a phone number actually reachable from a buyer's account (today
-- only the original `applications` row has one — it's never copied over when
-- an application is activated into a real account), and a VAT rate captured
-- per order line at the moment the order is placed, the same way unit_price
-- already is.

-- ---------------------------------------------------------------------------
-- 1. accounts.phone
-- ---------------------------------------------------------------------------
-- Nullable: every account created before this migration has no phone on
-- record and there's nothing to backfill it from automatically for accounts
-- that didn't go through the application flow (e.g. seeded demo accounts) —
-- an admin can fill it in by hand via /admin/accounts.
alter table accounts
  add column phone text;

-- ---------------------------------------------------------------------------
-- 2. site_content.whatsapp_closing_note
-- ---------------------------------------------------------------------------
-- The one piece of the WhatsApp proforma-invoice notification that's genuinely
-- free text ("extra words") rather than a computed number — extends the
-- existing site_content singleton exactly the way the announcement bar
-- extended it in migration 0024, rather than a new table for one string.
alter table site_content
  add column whatsapp_closing_note text not null default
    'Thank you for your business — we''ll confirm stock and production shortly.';

-- ---------------------------------------------------------------------------
-- 3. order_lines.vat_rate
-- ---------------------------------------------------------------------------
-- Captured at order-placement time from the style's own `vat_rate` (added in
-- migration 0014), exactly parallel to how `unit_price` is captured at that
-- same moment rather than looked up live later — a style's VAT rate changing
-- after the fact must not silently rewrite the tax on an already-placed order.
-- Defaults to 0 so every pre-existing order row (no column value) continues
-- to compute zero VAT / an unchanged grand total — this migration cannot
-- retroactively change what a past order already charged.
alter table order_lines
  add column vat_rate numeric not null default 0;
