-- Hector Footwear Wholesale — admin-chosen homepage season teaser image
-- Run once in the Supabase SQL Editor, after 0001-0027.
--
-- The homepage's season spotlight previously picked whatever style happened to
-- be first for that season (`styles[0]`) as its photo — not something an admin
-- could deliberately choose. This lets an admin upload a specific photo per
-- season instead, reusing the same signed-upload-URL Storage pattern as the
-- homepage hero image (site_content) rather than a new bucket — just a
-- different path prefix inside the existing public `site-content` bucket.

alter table season_settings
  add column teaser_image_path text,
  add column teaser_image_url text;
