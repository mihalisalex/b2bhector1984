-- Hector 1984 Wholesale — replace per-style box minimums with a single
-- 40-pair-per-order minimum (enforced in the app layer, not the DB).
-- Run once in the Supabase SQL Editor, after 0001-0005.

alter table styles drop column moq_boxes;
