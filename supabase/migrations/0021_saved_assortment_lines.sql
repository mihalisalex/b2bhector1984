-- Hector 1984 Wholesale — Saved Assortment line-item storage (2026-07-29).
-- The original saved_assortment_styles table only remembered which styles were
-- grouped, not the actual colorway/box-type/quantity a buyer had picked — unlike
-- Reorder (which restores an order's exact lines from order_lines), loading a
-- saved assortment meant manually rebuilding every line from scratch on each
-- product page. This adds real line-item columns so a saved assortment can be
-- loaded straight into the cart with the exact quantities it was saved with.
-- Run once in the Supabase SQL Editor, after 0001-0020.
--
-- The old primary key was (assortment_id, style_id) — one row per style. That
-- can't hold multiple colorway/box combos of the same style, so it's replaced
-- with a surrogate id. Existing pre-migration rows keep colorway_id/box_type_id
-- null and qty=1 — the app degrades those to "browse the product page" instead
-- of a direct cart load, exactly like it behaved before this migration.

alter table saved_assortment_styles drop constraint saved_assortment_styles_pkey;
alter table saved_assortment_styles add column id uuid not null default gen_random_uuid();
alter table saved_assortment_styles add primary key (id);
alter table saved_assortment_styles add column colorway_id text;
alter table saved_assortment_styles add column box_type_id text;
alter table saved_assortment_styles add column qty integer not null default 1;
