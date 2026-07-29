-- CRITICAL FIX (page-by-page production audit, 2026-07-29): checkout is
-- currently broken in production. Migration 0014 added a second overload of
-- adjust_inventory(text, text, text, int, text default 'main') intending it
-- to transparently replace the original 4-arg version from 0008 — but
-- `create or replace function` only replaces a function with the exact same
-- argument signature. Because the two versions have a different arg count,
-- Postgres kept BOTH functions. Every call site (decrementInventoryForOrder)
-- passes exactly 4 named args, which now matches both overloads (the 5-arg
-- one via its default) and errors with "Could not choose the best candidate
-- function" — meaning every real checkout submission has been failing with
-- an uncaught 500 since 0014 was run. Reproduced live via a real checkout
-- attempt; this migration removes the stale 4-arg overload so only the
-- warehouse-aware 5-arg version (matching the real inventory table's actual
-- warehouse_id column) remains.
-- Run this immediately — it is the single most urgent item from this audit.

drop function if exists adjust_inventory(text, text, text, int);
