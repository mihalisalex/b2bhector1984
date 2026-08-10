-- Hector Footwear Wholesale — per-account override of the sitewide 40-pair order minimum.
--
-- Every buyer is bound by `MIN_ORDER_PAIRS` (src/lib/pricing.ts) today — a flat 40 pairs,
-- no exceptions. That's the right floor for a brand-new account (nothing has been decided
-- about them yet), but an established, trusted account should be able to earn a lower
-- minimum over time, set deliberately by an admin rather than baked into a one-size rule.
--
-- `min_order_pairs = null` (every account, including brand-new ones — this is never set at
-- activation) means "no override, use the standard 40". An admin sets a real number later
-- from /admin/accounts once they've actually built a relationship with that buyer, exactly
-- mirroring how `price_multiplier`/`rep_id` are account-level levers set after the fact.
-- Deliberately NOT restricted to values <= MIN_ORDER_PAIRS at the database level — the app
-- layer (updateAccountMinOrderPairsAction) is where that judgment call belongs, matching how
-- credit_limit/price_multiplier are bounded in code, not by a CHECK constraint.

alter table accounts add column min_order_pairs integer;
