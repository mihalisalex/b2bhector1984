-- Hector 1984 Wholesale — lightweight per-account negotiated pricing. The old
-- `pricing_tiers` table/tier system was fully dropped in 0005 and stays gone;
-- this is a smaller, account-scoped replacement: a single multiplier applied
-- on top of the existing payment-terms discount, not a resurrection of tiers.
-- Run once in the Supabase SQL Editor, after 0001-0010.

alter table accounts add column price_multiplier numeric not null default 1;
