-- Hector 1984 Wholesale — Postgres full-text search for the catalog. Replaces
-- the old in-memory substring match (name/style_number only, JS .includes())
-- with a proper ranked search over name/description/tagline/style_number/
-- category/materials, indexed with GIN so it stays fast as the catalog grows.
-- Run once in the Supabase SQL Editor, after 0001-0009.

alter table styles add column search_vector tsvector
  generated always as (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(tagline, '') || ' ' ||
      coalesce(style_number, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(array_to_string(materials, ' '), '')
    )
  ) stored;

create index styles_search_vector_idx on styles using gin(search_vector);
