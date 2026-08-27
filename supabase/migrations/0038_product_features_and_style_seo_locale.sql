-- 0038 — two columns the supplied Greek product copy needs and 0037 didn't anticipate.
--
-- Run once in the Supabase SQL Editor, after 0037.
--
-- The owner supplied final, human-authored Greek copy for all 31 styles carrying seven
-- fields per style. Five map onto 0037's columns. Two do not, and rather than drop 186
-- bullet points and 62 meta strings of finished copy on a technicality, they get a home.

-- ---------------------------------------------------------------------------
-- 1. styles.features / features_el
-- ---------------------------------------------------------------------------
-- The supplied copy has a `features_el` bullet list (5-7 items per style) distinct from
-- `materials_el`. There is no `features` concept anywhere in this schema: `materials` is a
-- flat array rendered as one comma-joined spec line, and `style_attributes` is a key/value
-- table for things like Country of Origin — neither is a feature list.
--
-- Added in BOTH languages, not just Greek. A `features_el` with no `features` beside it
-- would be the only asymmetric column pair in the table, and would mean the English product
-- page could never show the list at all. English starts empty and can be filled from the
-- admin CSV import later; the product page renders the section only when it has rows, so an
-- empty English array simply shows nothing rather than an empty heading.
--
-- text[] rather than a separate table, matching `materials` and `tags` — this is an ordered
-- list of short strings with no identity of its own, which is exactly what those are.
alter table styles add column features text[] not null default '{}';
alter table styles add column features_el text[];

-- ---------------------------------------------------------------------------
-- 2. seo_entity_meta may describe a style
-- ---------------------------------------------------------------------------
-- The supplied copy carries meta_title_el / meta_description_el per style, and the
-- instruction is explicit that they belong in the per-locale override table rather than on
-- `styles`. That table's entity_type CHECK does not allow it: 0025 listed
-- category/collection/brand/supplier/season/page precisely because products already carried
-- their own SEO columns and had no need of it.
--
-- Per-locale changes that. `styles.seo_title` is a single column and cannot hold four
-- languages, and widening it to seo_title_el/_de/_fr would rebuild, in the styles table,
-- the exact polymorphic per-locale override table that now exists one migration back.
--
-- So 'style' joins the list, keyed by the style's `id`. The English values stay where they
-- are on `styles` — nothing about the existing English SEO path changes — and
-- `productMetadata` consults this table first for the active locale.
alter table seo_entity_meta drop constraint seo_entity_meta_entity_type_check;
alter table seo_entity_meta add constraint seo_entity_meta_entity_type_check
  check (entity_type in ('category', 'collection', 'brand', 'supplier', 'season', 'page', 'style'));
