"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addOrder, getOrdersForAccount } from "@/lib/runtimeOrders";
import {
  APPLICATION_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSession,
  destroySession,
  getApplication,
  getCurrentAccount,
} from "@/lib/session";
import {
  getAccountByEmail,
  createAccount,
  updateAccountContact,
  updateAccountPassword as updateAccountPasswordData,
  insertShipToAddress,
  updateShipToAddress as updateShipToAddressRow,
  deleteShipToAddress as deleteShipToAddressRow,
  setDefaultShipToAddress as setDefaultShipToAddressRow,
} from "@/lib/data/accounts";
import { insertApplication, updateApplicationStatus } from "@/lib/data/applications";
import { getStyleById } from "@/lib/data/styles";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { formatEUR, getOrderMinimumError, getUnitPrice, summarizeOrder, validateMatrix } from "@/lib/pricing";
import { createSavedAssortment, deleteSavedAssortment as deleteSavedAssortmentData } from "@/lib/data/assortments";
import { decrementInventoryForOrder } from "@/lib/data/inventory";
import type { Application, BoxTypeId, CreditTerms, Order, OrderLine } from "@/lib/types";

const APPLICATION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface FormState {
  error?: string;
  success?: string;
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const account = await getAccountByEmail(email);
  if (!account || !(await verifyPassword(password, account.password))) {
    return { error: "We couldn't find an active account with that email and password." };
  }
  if (account.status !== "active") {
    return { error: "This account has not been activated yet. Contact your sales rep." };
  }

  const token = await createSession(account.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { maxAge: SESSION_MAX_AGE, path: "/", httpOnly: true, sameSite: "lax" });

  if (account.role === "admin") redirect("/admin");
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function logout() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(token);
  store.delete(SESSION_COOKIE);
  redirect("/");
}

export async function submitApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const required = [
    "businessName",
    "contactName",
    "email",
    "phone",
    "resaleCertId",
    "businessType",
    "storeLocation",
    "addressLine1",
    "city",
    "state",
    "zip",
    "expectedVolume",
  ];
  for (const field of required) {
    if (!String(formData.get(field) ?? "").trim()) {
      return { error: "Every field marked required needs a value before we can route this to review." };
    }
  }

  const application: Omit<Application, "id" | "status" | "submittedAt"> = {
    businessName: String(formData.get("businessName")),
    contactName: String(formData.get("contactName")),
    email: String(formData.get("email")),
    phone: String(formData.get("phone")),
    resaleCertId: String(formData.get("resaleCertId")),
    businessType: String(formData.get("businessType")),
    storeLocation: String(formData.get("storeLocation")),
    addressLine1: String(formData.get("addressLine1")),
    city: String(formData.get("city")),
    state: String(formData.get("state")),
    zip: String(formData.get("zip")),
    expectedVolume: String(formData.get("expectedVolume")),
    website: String(formData.get("website") ?? "") || undefined,
  };

  const id = await insertApplication(application);

  const store = await cookies();
  store.set(APPLICATION_COOKIE, id, {
    maxAge: APPLICATION_MAX_AGE,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  redirect("/apply/pending");
}

/** Approved -> active: provisions the buyer account and signs the buyer in. */
export async function activateAccount() {
  const application = await getApplication();
  if (!application || application.status !== "approved") redirect("/apply/pending");

  const id = `acct-${crypto.randomUUID().slice(0, 8)}`;
  await createAccount({
    id,
    businessName: application.businessName,
    contactName: application.contactName,
    email: application.email,
    password: await hashPassword("wholesale84"),
    status: "active",
    creditTerms: "prepay",
    creditLimit: 5000,
    resaleCertId: application.resaleCertId,
    businessType: application.businessType,
    storeLocation: application.storeLocation,
    expectedVolume: application.expectedVolume,
    appliedAt: application.submittedAt,
    approvedAt: new Date().toISOString(),
    shipTo: {
      label: application.businessName,
      line1: application.addressLine1,
      city: application.city,
      state: application.state,
      zip: application.zip,
    },
  });
  await updateApplicationStatus(application.id, "active");

  const token = await createSession(id);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { maxAge: SESSION_MAX_AGE, path: "/", httpOnly: true, sameSite: "lax" });
  store.delete(APPLICATION_COOKIE);
  redirect("/dashboard");
}

export interface CheckoutState extends FormState {
  orderId?: string;
}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const cartLines = JSON.parse(String(formData.get("lines") ?? "[]")) as {
    styleId: string;
    colorwayId: string;
    boxTypeId: BoxTypeId;
    qty: number;
  }[];
  if (cartLines.length === 0) return { error: "Your cart is empty." };

  const poNumber = String(formData.get("poNumber") ?? "").trim();
  if (!poNumber) return { error: "A PO number is required to submit this order." };

  const shipToId = String(formData.get("shipToId") ?? "");
  if (!account.shipTo.some((s) => s.id === shipToId)) return { error: "Select a valid ship-to address." };

  const terms = String(formData.get("terms") ?? account.creditTerms) as CreditTerms;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  const byStyle = new Map<string, Record<string, Partial<Record<BoxTypeId, number>>>>();
  for (const line of cartLines) {
    if (!byStyle.has(line.styleId)) byStyle.set(line.styleId, {});
    const qtyMap = byStyle.get(line.styleId)!;
    qtyMap[line.colorwayId] = qtyMap[line.colorwayId] || {};
    qtyMap[line.colorwayId]![line.boxTypeId] = (qtyMap[line.colorwayId]![line.boxTypeId] || 0) + line.qty;
  }

  const orderLines: OrderLine[] = [];
  const styleById = new Map<string, Awaited<ReturnType<typeof getStyleById>>>();
  let totalPairs = 0;
  for (const [styleId, qtyMap] of byStyle.entries()) {
    const style = await getStyleById(styleId);
    if (!style) continue;
    styleById.set(styleId, style);
    const validation = validateMatrix(style, qtyMap, terms, account.priceMultiplier);
    totalPairs += validation.totalPairs;
    const unitPrice = getUnitPrice(style, terms, account.priceMultiplier);
    for (const [colorwayId, boxes] of Object.entries(qtyMap)) {
      for (const [boxTypeId, qty] of Object.entries(boxes)) {
        if (qty && qty > 0) orderLines.push({ styleId, colorwayId, boxTypeId: boxTypeId as BoxTypeId, qty, unitPrice });
      }
    }
  }

  const minimumError = getOrderMinimumError(totalPairs);
  if (minimumError) return { error: minimumError };

  const { total: orderTotal } = summarizeOrder({ lines: orderLines });
  const existingOrders = await getOrdersForAccount(account.id);
  const outstanding = existingOrders
    .filter((o) => o.status !== "delivered")
    .reduce((sum, o) => sum + summarizeOrder(o).total, 0);
  const availableCredit = account.creditLimit - outstanding;
  if (orderTotal > availableCredit) {
    return {
      error: `This order (${formatEUR(orderTotal)}) exceeds your available credit (${formatEUR(Math.max(availableCredit, 0))} of a ${formatEUR(account.creditLimit)} limit). Contact ${account.rep.name} to raise your limit or reduce the order.`,
    };
  }

  const stockResult = await decrementInventoryForOrder(orderLines);
  if (!stockResult.ok) {
    const style = styleById.get(stockResult.failedLine.styleId);
    const boxLabel = { box8: "8-pair", box10: "10-pair", box12: "12-pair" }[stockResult.failedLine.boxTypeId];
    return {
      error: `Not enough stock for ${style?.name ?? "that style"} (${boxLabel} box) to cover this order. Reduce the quantity or contact ${account.rep.name}.`,
    };
  }

  const order: Order = {
    id: `ORD-${Date.now().toString().slice(-5)}`,
    poNumber,
    placedAt: new Date().toISOString(),
    status: "submitted",
    terms,
    shipToId,
    notes,
    lines: orderLines,
  };

  await addOrder(account.id, order);
  redirect(`/dashboard/orders/${order.id}?justPlaced=1`);
}

export async function updateAccountProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const businessName = String(formData.get("businessName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!businessName || !contactName || !email) {
    return { error: "Business name, contact name, and email are all required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const result = await updateAccountContact(account.id, { businessName, contactName, email });
  if (result.error) return { error: result.error };

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard");
  return { success: "Profile updated." };
}

export async function updateAccountPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!(await verifyPassword(currentPassword, account.password))) return { error: "Current password is incorrect." };
  if (newPassword.length < 6) return { error: "New password must be at least 6 characters." };
  if (newPassword !== confirmPassword) return { error: "New password and confirmation don't match." };

  await updateAccountPasswordData(account.id, await hashPassword(newPassword));
  revalidatePath("/dashboard/account");
  return { success: "Password updated." };
}

export async function addShipToAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const label = String(formData.get("label") ?? "").trim();
  const line1 = String(formData.get("line1") ?? "").trim();
  const line2 = String(formData.get("line2") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();
  const isDefault = formData.get("isDefault") === "on" || account.shipTo.length === 0;

  if (!label || !line1 || !city || !state || !zip) {
    return { error: "Label, address, city, state, and ZIP are required." };
  }

  await insertShipToAddress(account.id, { label, line1, line2: line2 || undefined, city, state, zip, isDefault });
  revalidatePath("/dashboard/account");
  return { success: "Address added." };
}

export async function updateShipToAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const shipToId = String(formData.get("shipToId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const line1 = String(formData.get("line1") ?? "").trim();
  const line2 = String(formData.get("line2") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();

  if (!shipToId || !account.shipTo.some((s) => s.id === shipToId)) return { error: "Address not found." };
  if (!label || !line1 || !city || !state || !zip) {
    return { error: "Label, address, city, state, and ZIP are required." };
  }

  await updateShipToAddressRow(account.id, shipToId, { label, line1, line2: line2 || undefined, city, state, zip });
  revalidatePath("/dashboard/account");
  return { success: "Address updated." };
}

export async function deleteShipToAddress(formData: FormData): Promise<void> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const shipToId = String(formData.get("shipToId") ?? "");
  if (shipToId) await deleteShipToAddressRow(account.id, shipToId);
  revalidatePath("/dashboard/account");
}

export async function setDefaultShipToAddress(formData: FormData): Promise<void> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const shipToId = String(formData.get("shipToId") ?? "");
  if (shipToId) await setDefaultShipToAddressRow(account.id, shipToId);
  revalidatePath("/dashboard/account");
}

export async function saveAssortment(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const styleIds = JSON.parse(String(formData.get("styleIds") ?? "[]")) as string[];
  if (!name) return { error: "Give this assortment a name." };
  if (styleIds.length === 0) return { error: "Add at least one style before saving." };

  await createSavedAssortment(account.id, name, styleIds);
  revalidatePath("/dashboard/assortments");
  return { success: "Assortment saved." };
}

export async function deleteAssortment(formData: FormData): Promise<void> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const assortmentId = String(formData.get("assortmentId") ?? "");
  if (assortmentId) await deleteSavedAssortmentData(account.id, assortmentId);
  revalidatePath("/dashboard/assortments");
}
