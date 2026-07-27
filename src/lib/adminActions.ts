"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { updateApplicationStatus } from "@/lib/data/applications";
import { uploadStyleImage, setPrimaryImage, deleteStyleImage } from "@/lib/data/styleImages";
import { updateAvailableBoxTypes } from "@/lib/data/styles";
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

export async function uploadStyleImageAction(formData: FormData) {
  await requireAdmin();
  const styleId = String(formData.get("styleId") ?? "");
  const file = formData.get("file");
  if (!styleId || !(file instanceof File) || file.size === 0) return;
  await uploadStyleImage(styleId, file);
  revalidatePath(`/admin/styles/${styleId}`);
  revalidatePath("/admin/styles");
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
