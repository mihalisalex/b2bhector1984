-- ---------------------------------------------------------------------------
-- 0039. Announcement bar — Greek text
-- ---------------------------------------------------------------------------
-- 0037 gave the homepage hero its `_el` columns but stopped short of the
-- announcement bar, which sits ABOVE the hero on both domains and is the very
-- first thing a visitor reads. Because it was a single shared field, whatever
-- language it was written in went out to both hectorfootwear.gr and .com — in
-- practice the bar was written in Greek and English visitors read Greek.
--
-- Same shape as the hero: one nullable `_el` column, English stays in the
-- existing column, and an empty/absent Greek value falls back to it rather
-- than blanking the bar.
--
-- The href is NOT duplicated, for the same reason the hero's is not: it is a
-- route, and each domain resolves it against its own locale.

alter table site_content add column announcement_text_el text;
