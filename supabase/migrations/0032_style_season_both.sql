-- Hector Footwear Wholesale — let a style feature in both seasons at once
--
-- `styles.season` (migration 0005) has always been a hard `check (season in ('summer',
-- 'winter'))` — one season per style. This widens it to also allow 'both', for a style
-- that should appear in the Summer and Winter spotlights/filters simultaneously. Every
-- app-side place that filters styles by season already treats 'both' as "matches either"
-- (see catalogFilters.ts, and the homepage/collections season filtering) — this migration
-- is the one DB-side change that unblocks actually saving that value.
--
-- `season_settings` (migration 0022) is a different table — one row per *real* season
-- ('summer'/'winter'), used for admin enable/disable + labels + teaser photos. It is
-- deliberately NOT touched here: "both" describes an individual style, not a season
-- itself, so there is no third `season_settings` row to add.
--
-- Finds and drops whatever the existing check constraint on styles.season is actually
-- named (rather than assuming the Postgres-default `styles_season_check`), so this is
-- safe to run regardless of how it was originally auto-named.
do $$
declare
  con_name text;
begin
  select conname into con_name
  from pg_constraint
  where conrelid = 'styles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%season%';
  if con_name is not null then
    execute format('alter table styles drop constraint %I', con_name);
  end if;
end $$;

alter table styles add constraint styles_season_check check (season in ('summer', 'winter', 'both'));
