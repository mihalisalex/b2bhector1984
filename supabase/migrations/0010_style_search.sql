-- Hector 1984 Wholesale — Postgres full-text search for the catalog. Replaces
-- the old in-memory substring match (name/style_number only, JS .includes())
-- with a proper ranked search over name/description/tagline/style_number/
-- category/materials, indexed with GIN so it stays fast as the catalog grows.
-- Run once in the Supabase SQL Editor, after 0001-0009.
--
-- A plain trigger-maintained column, not `generated always as (...) stored`:
-- to_tsvector('english', ...) is only STABLE, not IMMUTABLE (the 'english'
-- config could in principle change), and Postgres rejects non-immutable
-- expressions in generated columns (42P17). A trigger has no such restriction.

alter table styles add column search_vector tsvector;

create or replace function styles_search_vector_update() returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    to_tsvector('english',
      coalesce(new.name, '') || ' ' ||
      coalesce(new.description, '') || ' ' ||
      coalesce(new.tagline, '') || ' ' ||
      coalesce(new.style_number, '') || ' ' ||
      coalesce(new.category, '') || ' ' ||
      coalesce(array_to_string(new.materials, ' '), '')
    );
  return new;
end;
$$;

create trigger styles_search_vector_trigger
  before insert or update on styles
  for each row execute function styles_search_vector_update();

-- Backfill every existing row — the trigger only fires on future writes.
update styles set search_vector = search_vector;

create index styles_search_vector_idx on styles using gin(search_vector);
