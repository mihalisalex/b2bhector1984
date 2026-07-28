-- Hector 1984 Wholesale — editable homepage hero content
-- Run once in the Supabase SQL Editor, after 0001-0003.
--
-- Single-row table (id is always 'homepage_hero') so the admin dashboard can
-- edit the hero image and copy without a code deploy. Seeded with today's
-- live copy/image so the homepage has no missing-row case to handle.

create table site_content (
  id text primary key,
  eyebrow text not null,
  heading text not null,                       -- newline-separated lines, rendered as <br />
  body text not null,
  hero_image_url text not null,
  primary_cta_label text not null,
  primary_cta_href text not null,
  secondary_cta_label text not null,
  secondary_cta_href text not null,
  updated_at timestamptz not null default now()
);

insert into site_content (
  id, eyebrow, heading, body, hero_image_url,
  primary_cta_label, primary_cta_href, secondary_cta_label, secondary_cta_href
) values (
  'homepage_hero',
  'Wholesale — Est. 1984',
  E'Track-engineered\nfootwear for the\nfloor, not the feed.',
  'Hector 1984 has sold into independent run shops, court specialty, and outdoor retailers since the year we were founded. Same construction standards. Same retailers who reorder every season.',
  '/images/hero-shoes.jpg',
  'Apply for Wholesale Access', '/apply',
  'Buyer Login', '/login'
);

alter table site_content enable row level security;
create policy "Public read" on site_content for select using (true);

-- ---------------------------------------------------------------------------
-- Storage bucket for admin-uploaded marketing/hero photography
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('site-content', 'site-content', true)
on conflict (id) do nothing;

create policy "Public read site content images"
  on storage.objects for select
  using (bucket_id = 'site-content');
