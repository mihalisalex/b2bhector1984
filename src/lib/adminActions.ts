"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { updateApplicationStatus } from "@/lib/data/applications";
import {
  createStyleImageUploadTarget,
  finalizeStyleImageUpload,
  setPrimaryImage,
  deleteStyleImage,
} from "@/lib/data/styleImages";
import { updateAvailableBoxTypes } from "@/lib/data/styles";
import { updateHomepageHero, createHeroImageUploadTarget, finalizeHeroImageUpload } from "@/lib/data/siteContent";
import { updateOrderStatus as updateOrderStatusInDb } from "@/lib/runtimeOrders";
import type { BoxTypeId, OrderStatus } from "@/lib/types";

async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") redirect("/login");
  return account;
}

const ORDER_STATUSES: OrderStatus[] = ["submitted", "confirmed", "in_production", "shipped", "delivered"];

/** Bound to a specific orderId via `.bind(null, orderId)` for use as a <form action>. */
export async function updateOrderStatus(orderId: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status") ?? "");
  if (!ORDER_STATUSES.includes(status as OrderStatus)) return;
  await updateOrderStatusInDb(orderId, status as OrderStatus);
  revalidatePath("/admin");
}

export async function approveApplication(applicationId: string) {
  await requireAdmin();
  await updateApplicationStatus(applicationId, "approved");
  revalidatePath("/admin/applications");
}

export async function declineApplication(applicationId: string) {
  await requireAdmin();
  await updateApplicationStatus(applicationId, "declined");
  revalidatePath("/admin/applications");
}

export interface UploadState {
  error?: string;
}

export type UploadTarget = { bucket: string; path: string; token: string } | { error: string };

/**
 * Two-step upload: the browser gets a signed Storage upload slot from these
 * actions, PUTs the file bytes straight to Supabase itself (bypassing the
 * Vercel serverless function, which caps request bodies well under what a
 * real photo needs), then calls the matching finalize action with the path.
 */
export async function createStyleImageUploadUrlAction(styleId: string, fileName: string): Promise<UploadTarget> {
  await requireAdmin();
  try {
    return await createStyleImageUploadTarget(styleId, fileName);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not start upload." };
  }
}

export async function finalizeStyleImageUploadAction(styleId: string, path: string): Promise<UploadState> {
  await requireAdmin();
  try {
    await finalizeStyleImageUpload(styleId, path);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }
  revalidatePath(`/admin/styles/${styleId}`);
  revalidatePath("/admin/styles");
  return {};
}

export async function setPrimaryImageAction(formData: FormData) {
  await requireAdmin();
  const styleId = String(formData.get("styleId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  if (!styleId || !imageId) return;
  await setPrimaryImage(styleId, imageId);
  revalidatePath(`/admin/styles/${styleId}`);
  revalidatePath("/admin/styles");
}

const ALL_BOX_TYPES: BoxTypeId[] = ["box8", "box10", "box12"];

export async function updateAvailableBoxTypesAction(formData: FormData) {
  await requireAdmin();
  const styleId = String(formData.get("styleId") ?? "");
  if (!styleId) return;
  const selected = ALL_BOX_TYPES.filter((id) => formData.get(id) === "on");
  await updateAvailableBoxTypes(styleId, selected.length > 0 ? selected : ALL_BOX_TYPES);
  revalidatePath(`/admin/styles/${styleId}`);
  revalidatePath("/catalog");
  revalidatePath("/quick-order");
  revalidatePath("/product/[slug]", "page");
}

export async function deleteStyleImageAction(formData: FormData) {
  await requireAdmin();
  const styleId = String(formData.get("styleId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  if (!imageId) return;
  await deleteStyleImage(imageId);
  revalidatePath(`/admin/styles/${styleId}`);
  revalidatePath("/admin/styles");
}

export async function updateHomepageHeroAction(formData: FormData) {
  await requireAdmin();
  await updateHomepageHero({
    eyebrow: String(formData.get("eyebrow") ?? ""),
    heading: String(formData.get("heading") ?? "").replace(/\r\n/g, "\n"),
    body: String(formData.get("body") ?? ""),
    primaryCtaLabel: String(formData.get("primaryCtaLabel") ?? ""),
    primaryCtaHref: String(formData.get("primaryCtaHref") ?? ""),
    secondaryCtaLabel: String(formData.get("secondaryCtaLabel") ?? ""),
    secondaryCtaHref: String(formData.get("secondaryCtaHref") ?? ""),
  });
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function createHeroImageUploadUrlAction(fileName: string): Promise<UploadTarget> {
  await requireAdmin();
  try {
    return await createHeroImageUploadTarget(fileName);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not start upload." };
  }
}

export async function finalizeHeroImageUploadAction(path: string): Promise<UploadState> {
  await requireAdmin();
  try {
    await finalizeHeroImageUpload(path);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }
  revalidatePath("/admin/content");
  revalidatePath("/");
  return {};
}
