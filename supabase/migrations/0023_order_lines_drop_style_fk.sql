-- Hector 1984 Wholesale — let a product be permanently deleted even with order history
-- Run once in the Supabase SQL Editor, after 0001-0022.
--
-- Every other table that references `styles(id)` was defined `on delete cascade`
-- (colorways, style_images, style_documents, style_relations, style_attributes,
-- inventory, inventory_movements, favorites, customer_group_prices...) — deleting a
-- style already cleans all of those up. `order_lines` was the one exception: its
-- `style_id`/`colorway_id` foreign keys have no `on delete` clause at all (implicit
-- `NO ACTION`), so deleting a style that was ever ordered fails outright with a
-- foreign-key-violation error, and the admin's only path forward was to archive it
-- instead of actually deleting it.
--
-- This drops just the *referential-integrity enforcement* on those two columns —
-- order_lines.style_id/colorway_id stay exactly as they are (still `text not null`,
-- still holding the real historical id), they just stop being validated against
-- `styles`/`colorways`. A deleted product's past order lines keep their original id
-- string forever; the app already renders `style?.name ?? line.styleId` wherever an
-- order line's style is looked up, so a since-deleted product's orders correctly fall
-- back to showing the bare id instead of crashing or silently losing the line.
--
-- Constraint names are Postgres's default auto-generated names for an unnamed
-- single-column foreign key (`<table>_<column>_fkey`), matching how both were declared
-- with inline `references` syntax in 0001_init.sql with no explicit CONSTRAINT name.

alter table order_lines drop constraint if exists order_lines_style_id_fkey;
alter table order_lines drop constraint if exists order_lines_colorway_id_fkey;
