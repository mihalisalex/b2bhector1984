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
import { setInventoryLevel } from "@/lib/data/inventory";
import { updateHomepageHero, createHeroImageUploadTarget, finalizeHeroImageUpload } from "@/lib/data/siteContent";
import {
  updateOrderStatus as updateOrderStatusInDb,
  updateOrderDetails as updateOrderDetailsInDb,
  updateOrderLineQty as updateOrderLineQtyInDb,
  deleteOrderLine as deleteOrderLineInDb,
} from "@/lib/runtimeOrders";
import type { FormState } from "@/lib/actions";
import type { BoxTypeId, CreditTerms, OrderStatus } from "@/lib/types";

async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") redirect("/login");
  return account;
}

const ORDER_STATUSES: OrderStatus[] = ["submitted", "confirmed", "in_production", "shipped", "delivered"];

/** Bound to `.bind(null, orderId)` for use as a <form action>. */
export async function updateOrderStatus(orderId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const status = String(formData.get("status") ?? "");
  if (!ORDER_STATUSES.includes(status as OrderStatus)) return { error: "Invalid status." };
  const result = await updateOrderStatusInDb(orderId, status as OrderStatus);
  if (result.error) return { error: result.error };
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/dashboard/orders/${orderId}`);
  return {};
}

const ORDER_TERMS: CreditTerms[] = ["prepay", "net30", "net60"];

/** Bound to `.bind(null, orderId, accountId)` — edits everything on an order except status and line items. */
export async function updateOrderDetailsAction(
  orderId: string,
  accountId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const poNumber = String(formData.get("poNumber") ?? "").trim();
  const terms = String(formData.get("terms") ?? "");
  const shipToId = String(formData.get("shipToId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const invoiceUrl = String(formData.get("invoiceUrl") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const carrier = String(formData.get("carrier") ?? "").trim();

  if (!poNumber) return { error: "PO number is required." };
  if (!ORDER_TERMS.includes(terms as CreditTerms)) return { error: "Select valid payment terms." };

  await updateOrderDetailsInDb(orderId, accountId, {
    poNumber,
    terms: terms as CreditTerms,
    shipToId,
    notes: notes || undefined,
    invoiceUrl: invoiceUrl || undefined,
    trackingNumber: trackingNumber || undefined,
    carrier: carrier || undefined,
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return { success: "Order updated." };
}

/** Bound to `.bind(null, orderId)` — a <form action> per line row's qty stepper. */
export async function updateOrderLineQtyAction(orderId: string, formData: FormData) {
  await requireAdmin();
  const lineId = String(formData.get("lineId") ?? "");
  const qty = Number(formData.get("qty") ?? 0);
  if (!lineId || !Number.isFinite(qty) || qty < 1) return;
  await updateOrderLineQtyInDb(lineId, Math.round(qty));
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}

/** Bound to `.bind(null, orderId, lineId)` — a <form action> per line row's remove button. */
export async function deleteOrderLineAction(orderId: string, lineId: string) {
  await requireAdmin();
  await deleteOrderLineInDb(lineId);
  revalidatePath(`/admin/orders/${orderId}`);
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
  revalidatePath("/catalogue");
  revalidatePath("/quick-order");
  revalidatePath("/product/[slug]", "page");
}

/** Bound to `.bind(null, styleId)` — a <form action> per colorway/box-type stock cell. */
export async function updateInventoryLevelAction(styleId: string, formData: FormData) {
  await requireAdmin();
  const colorwayId = String(formData.get("colorwayId") ?? "");
  const boxTypeId = String(formData.get("boxTypeId") ?? "") as BoxTypeId;
  const onHand = Number(formData.get("onHand") ?? 0);
  if (!colorwayId || !boxTypeId || !Number.isFinite(onHand)) return;
  await setInventoryLevel(styleId, colorwayId, boxTypeId, Math.round(onHand));
  revalidatePath(`/admin/styles/${styleId}`);
  revalidatePath("/catalogue");
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
