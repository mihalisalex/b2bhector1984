-- Hector Footwear Wholesale — let the admin decide an applicant's sales rep and price
-- multiplier at the moment of approval, not only after the account already exists.
--
-- Both columns already exist on `accounts` (0001_init for rep_id, 0011 for
-- price_multiplier) and are set there once an account is activated. Before this
-- migration, `activateAccount` (src/lib/actions.ts) always created the new account with
-- `rep_id: null` and the column default `price_multiplier = 1`, with no way for the admin
-- to pick either before the applicant self-activates. These two columns hold that choice on
-- the `applications` row from approval time until activation, when `activateAccount` reads
-- them back and carries them onto the new account row.
--
-- `price_multiplier` defaults to 1 (matching `accounts.price_multiplier`'s own default),
-- so every pending/already-approved application picks up a sane default without a backfill.
-- `rep_id` defaults to null (unassigned) the same way `accounts.rep_id` does.

alter table applications add column rep_id uuid references sales_reps(id);
alter table applications add column price_multiplier numeric not null default 1;
