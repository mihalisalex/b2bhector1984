import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { assertAllowedExtension, IMAGE_EXTENSIONS } from "@/lib/uploadValidation";
import type { JournalCategory, JournalPost, JournalStatus } from "@/lib/types";

const BUCKET = "journal-images";

interface JournalPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content_html: string;
  featured_image_path: string | null;
  featured_image_url: string | null;
  author_name: string;
  category: JournalCategory;
  tags: string[] | null;
  featured: boolean;
  status: JournalStatus;
  publish_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  seo_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  robots: string;
}

function mapPost(row: JournalPostRow): JournalPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    contentHtml: row.content_html,
    featuredImagePath: row.featured_image_path ?? undefined,
    featuredImageUrl: row.featured_image_url ?? undefined,
    authorName: row.author_name,
    category: row.category,
    tags: row.tags ?? [],
    featured: row.featured,
    status: row.status,
    publishAt: row.publish_at ?? undefined,
    publishedAt: row.published_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    seoTitle: row.seo_title ?? undefined,
    metaDescription: row.meta_description ?? undefined,
    ogImageUrl: row.og_image_url ?? undefined,
    canonicalUrl: row.canonical_url ?? undefined,
    robots: row.robots,
  };
}

/** Every published article, newest first. Never throws — a missing migration 0027
 * degrades the journal to "no articles yet" instead of a broken storefront page. */
export const getPublishedJournalPosts = cache(async (): Promise<JournalPost[]> => {
  const { data, error } = await supabaseAdmin
    .from("journal_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error || !data) return [];
  return (data as JournalPostRow[]).map(mapPost);
});

export async function getJournalPostBySlug(slug: string): Promise<JournalPost | undefined> {
  const posts = await getPublishedJournalPosts();
  return posts.find((post) => post.slug === slug);
}

/** Ignores status — used only for the admin "preview before publishing" path on
 * `/journal/[slug]`, never on a route a signed-out visitor can reach. */
export async function getJournalPostBySlugAny(slug: string): Promise<JournalPost | undefined> {
  const { data, error } = await supabaseAdmin.from("journal_posts").select("*").eq("slug", slug).limit(1);
  if (error || !data?.length) return undefined;
  return mapPost(data[0] as JournalPostRow);
}

/** Same category first, tops up with the newest other published posts — mirrors
 * getRelatedStyles' same-category-then-fill-in shape. */
export async function getRelatedJournalPosts(post: JournalPost, limit = 3): Promise<JournalPost[]> {
  const posts = (await getPublishedJournalPosts()).filter((p) => p.id !== post.id);
  const sameCategory = posts.filter((p) => p.category === post.category);
  const rest = posts.filter((p) => p.category !== post.category);
  return [...sameCategory, ...rest].slice(0, limit);
}

export async function listJournalPostsForAdmin(): Promise<JournalPost[]> {
  const { data, error } = await supabaseAdmin
    .from("journal_posts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return (data as JournalPostRow[]).map(mapPost);
}

export async function getJournalPostById(id: string): Promise<JournalPost | undefined> {
  const { data, error } = await supabaseAdmin.from("journal_posts").select("*").eq("id", id).limit(1);
  if (error || !data?.length) return undefined;
  return mapPost(data[0] as JournalPostRow);
}

export interface JournalGeneralInput {
  title: string;
  slug: string;
  excerpt: string;
  authorName: string;
  category: JournalCategory;
  tags: string[];
}

export async function createJournalPost(input: JournalGeneralInput): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("journal_posts")
    .insert({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      author_name: input.authorName,
      category: input.category,
      tags: input.tags,
    })
    .select("id")
    .single();
  if (error) throw new Error(`journal_posts: ${error.message}`);
  return data.id as string;
}

export async function updateJournalPostGeneral(id: string, input: JournalGeneralInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from("journal_posts")
    .update({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      author_name: input.authorName,
      category: input.category,
      tags: input.tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`journal_posts: ${error.message}`);
}

export async function updateJournalPostContent(id: string, contentHtml: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("journal_posts")
    .update({ content_html: contentHtml, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`journal_posts: ${error.message}`);
}

export interface JournalSeoInput {
  seoTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  canonicalUrl: string;
  robots: string;
}

export async function updateJournalPostSeo(id: string, input: JournalSeoInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from("journal_posts")
    .update({
      seo_title: input.seoTitle || null,
      meta_description: input.metaDescription || null,
      og_image_url: input.ogImageUrl || null,
      canonical_url: input.canonicalUrl || null,
      robots: input.robots,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`journal_posts: ${error.message}`);
}

export interface JournalVisibilityInput {
  status: JournalStatus;
  publishAt?: string;
  featured: boolean;
}

/** Setting status to "published" for the first time stamps `published_at` —
 * the public-facing "Publish date" — exactly once, so republishing after an
 * edit never resets it. */
export async function updateJournalPostVisibility(id: string, input: JournalVisibilityInput): Promise<void> {
  const existing = await getJournalPostById(id);
  const nowIso = new Date().toISOString();
  const shouldStampPublishedAt = input.status === "published" && !existing?.publishedAt;

  const { error } = await supabaseAdmin
    .from("journal_posts")
    .update({
      status: input.status,
      publish_at: input.publishAt || null,
      featured: input.featured,
      ...(shouldStampPublishedAt ? { published_at: nowIso } : {}),
      updated_at: nowIso,
    })
    .eq("id", id);
  if (error) throw new Error(`journal_posts: ${error.message}`);
}

export async function deleteJournalPost(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("journal_posts").delete().eq("id", id);
  if (error) throw new Error(`journal_posts: ${error.message}`);
}

/** Mints a signed Storage upload slot for a featured image — the browser PUTs the file
 * bytes directly to Supabase, never through the Next.js server (see supabase/browser.ts). */
export async function createJournalImageUploadTarget(
  postId: string,
  fileName: string,
): Promise<{ bucket: string; path: string; token: string }> {
  assertAllowedExtension(fileName, IMAGE_EXTENSIONS);
  const path = `${postId}/${crypto.randomUUID()}-${fileName}`;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(`storage createSignedUploadUrl: ${error.message}`);
  return { bucket: BUCKET, path: data.path, token: data.token };
}

/** Called once the browser has finished the direct-to-Storage upload for `path`. */
export async function finalizeJournalImageUpload(postId: string, path: string): Promise<void> {
  const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await supabaseAdmin
    .from("journal_posts")
    .update({ featured_image_path: path, featured_image_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", postId);
  if (error) throw new Error(`journal_posts: ${error.message}`);
}
