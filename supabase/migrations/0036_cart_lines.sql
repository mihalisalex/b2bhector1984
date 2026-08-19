-- 0036 — server-side cart, so a buyer can start an order on a laptop and finish on a phone.
--
-- QA-021: the cart lived only in localStorage, keyed per account. A buyer building a 40-pair
-- order on one device and opening the site on another found it empty. Prices were always
-- server-authoritative, so this was never a pricing risk — it was abandonment.
--
-- The table is a *mirror*, not the source of truth for a session: the client keeps writing
-- localStorage for instant reads and offline tolerance, and reconciles against this table on
-- load. Nothing here can be trusted for money — checkout re-reads prices and stock from the
-- catalogue exactly as it did before.
--
-- The primary key is the line's natural identity (account + style + colourway + box type),
-- which is what makes the merge idempotent: an upsert of the same cart twice is a no-op
-- rather than a doubling.
create table cart_lines (
  account_id text not null references accounts(id) on delete cascade,
  style_id text not null,
  colorway_id text not null,
  box_type_id text not null,
  -- Number of boxes, never pairs. Mirrors CartLine.qty in src/lib/cart-context.tsx.
  qty int not null check (qty > 0),
  updated_at timestamptz not null default now(),
  primary key (account_id, style_id, colorway_id, box_type_id)
);

-- Every read is "the whole cart for one account", which the primary key's leading column
-- already serves; no extra index earns its keep at this size.

-- Deliberately no FK to styles/colorways. Those rows can be deleted while a stale cart line
-- still points at them (0023 dropped the same FKs from order_lines for exactly this reason),
-- and a delete of a discontinued product must not fail because someone left it in a cart.
-- The client drops lines whose style no longer resolves in the catalogue.

alter table cart_lines enable row level security;
-- No policies: the Next.js server reads and writes this with the service-role key, same as
-- every other non-catalogue table. Default-deny for anon/authenticated is the intent.
