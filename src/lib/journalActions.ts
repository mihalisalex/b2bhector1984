"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/adminGuard";
import { revalidateStorefront } from "@/lib/cacheInvalidation";
import { redirect } from "next/navigation";
import { sanitizeJournalBody } from "@/lib/sanitizeHtml";
import { slugifyForSeo } from "@/lib/seoAutogen";
import {
  createJournalPost,
  deleteJournalPost,
  updateJournalPostContent,
  updateJournalPostGeneral,
  updateJournalPostSeo,
  updateJournalPostVisibility,
  createJournalImageUploadTarget,
  finalizeJournalImageUpload,
  type JournalGeneralInput,
} from "@/lib/data/journalPosts";
import type { FormState } from "@/lib/actions";
import type { UploadState, UploadTarget } from "@/lib/adminActions";
import type { JournalCategory, JournalStatus } from "@/lib/types";

/** Same "don't crash on a missing migration" contract as productActions.ts's
 * friendlyDbError — journal_posts is new in migration 0027. */
function friendlyDbError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("schema cache") || message.includes("does not exist") || message.includes("Could not find")) {
    return "Can't save this yet — the Journal schema migration (supabase/migrations/0027_journal.sql) hasn't been run against this database. Run it in the Supabase SQL Editor, then try again.";
  }
  if (message.includes("duplicate key value") && message.includes("slug")) {
    return "That URL slug is already used by another article — try a more specific one.";
  }
  return message;
}

async function runOrError(fn: () => Promise<void>): Promise<FormState | undefined> {
  try {
    await fn();
    return undefined;
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
}

function revalidateJournal(slug?: string) {
  revalidateStorefront();
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  if (slug) revalidatePath(`/journal/${slug}`);
}

function readGeneralInput(formData: FormData): JournalGeneralInput {
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  return {
    title,
    slug: rawSlug ? slugifyForSeo(rawSlug) : slugifyForSeo(title),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    authorName: String(formData.get("authorName") ?? "").trim() || "Hector Footwear Team",
    category: String(formData.get("category") ?? "Industry Insights") as JournalCategory,
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

export async function createJournalPostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("content.manage");
  const input = readGeneralInput(formData);
  if (!input.title) return { error: "Title is required." };
  if (!input.slug) return { error: "Couldn't derive a URL slug from that title — try adding one manually." };

  let id: string;
  try {
    id = await createJournalPost(input);
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  revalidateJournal();
  redirect(`/admin/journal/${id}`);
}

export async function updateGeneralAction(postId: string, slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("content.manage");
  const input = readGeneralInput(formData);
  if (!input.title) return { error: "Title is required." };
  if (!input.slug) return { error: "Couldn't derive a URL slug from that title — try adding one manually." };
  const result = await runOrError(() => updateJournalPostGeneral(postId, input));
  if (result) return result;
  revalidateJournal(slug);
  revalidateJournal(input.slug);
  return { success: "Saved." };
}

export async function updateContentAction(postId: string, slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("content.manage");
  const contentHtml = sanitizeJournalBody(String(formData.get("contentHtml") ?? ""));
  const result = await runOrError(() => updateJournalPostContent(postId, contentHtml));
  if (result) return result;
  revalidateJournal(slug);
  return { success: "Saved." };
}

export async function updateSeoAction(postId: string, slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("content.manage");
  const result = await runOrError(() =>
    updateJournalPostSeo(postId, {
      seoTitle: String(formData.get("seoTitle") ?? "").trim(),
      metaDescription: String(formData.get("metaDescription") ?? "").trim(),
      ogImageUrl: String(formData.get("ogImageUrl") ?? "").trim(),
      canonicalUrl: String(formData.get("canonicalUrl") ?? "").trim(),
      robots: String(formData.get("robots") ?? "index,follow").trim() || "index,follow",
    }),
  );
  if (result) return result;
  revalidateJournal(slug);
  return { success: "Saved." };
}

export async function updateVisibilityAction(postId: string, slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("content.manage");
  const publishAtRaw = String(formData.get("publishAt") ?? "").trim();
  const result = await runOrError(() =>
    updateJournalPostVisibility(postId, {
      status: String(formData.get("status") ?? "draft") as JournalStatus,
      publishAt: publishAtRaw ? new Date(publishAtRaw).toISOString() : undefined,
      featured: formData.get("featured") === "on",
    }),
  );
  if (result) return result;
  revalidateJournal(slug);
  return { success: "Saved." };
}

export async function deleteJournalPostAction(postId: string): Promise<void> {
  await requirePermission("content.manage");
  try {
    await deleteJournalPost(postId);
  } catch (err) {
    console.error(`deleteJournalPost failed: ${friendlyDbError(err)}`);
    return;
  }
  revalidateJournal();
  redirect("/admin/journal");
}

export async function createJournalImageUploadUrlAction(postId: string, fileName: string): Promise<UploadTarget> {
  await requirePermission("content.manage");
  try {
    return await createJournalImageUploadTarget(postId, fileName);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not start upload." };
  }
}

export async function finalizeJournalImageUploadAction(postId: string, path: string): Promise<UploadState> {
  await requirePermission("content.manage");
  try {
    await finalizeJournalImageUpload(postId, path);
  } catch (err) {
    return { error: friendlyDbError(err) };
  }
  revalidateJournal();
  return {};
}
