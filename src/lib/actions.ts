"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { addOrder } from "@/lib/runtimeOrders";
import {
  APPLICATION_COOKIE,
  PROVISIONED_ACCOUNT_COOKIE,
  SESSION_COOKIE,
  findAccountByEmailAnywhere,
  getApplication,
  getCurrentAccount,
} from "@/lib/session";
import { getStyleById } from "@/lib/data/styles";
import { getUnitPrice, validateMatrix } from "@/lib/pricing";
import type { Account, Application, BoxTypeId, CreditTerms, Order, OrderLine } from "@/lib/types";

const APPLICATION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export interface FormState {
  error?: string;
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const account = await findAccountByEmailAnywhere(email);
  if (!account || account.password !== password) {
    return { error: "We couldn't find an active account with that email and password." };
  }
  if (account.status !== "active") {
    return { error: "This account has not been activated yet. Contact your sales rep." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, account.id, { maxAge: SESSION_MAX_AGE, path: "/", httpOnly: true, sameSite: "lax" });
  redirect("/dashboard");
}

export async function logout() {
  const store = await cookies();
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

  const application: Application = {
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
    status: "pending",
    submittedAt: new Date().toISOString(),
  };

  const store = await cookies();
  store.set(APPLICATION_COOKIE, JSON.stringify(application), {
    maxAge: APPLICATION_MAX_AGE,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  redirect("/apply/pending");
}

/** Demo-only: advances a pending application to approved. Stands in for manual review. */
export async function simulateApproval() {
  const application = await getApplication();
  if (!application || application.status !== "pending") redirect("/apply/pending");

  const updated: Application = { ...application, status: "approved" };
  const store = await cookies();
  store.set(APPLICATION_COOKIE, JSON.stringify(updated), {
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

  const id = `acct-${Date.now()}`;
  const account: Account = {
    id,
    businessName: application.businessName,
    contactName: application.contactName,
    email: application.email,
    password: "wholesale84",
    tier: "standard",
    status: "active",
    creditTerms: "prepay",
    creditLimit: 5000,
    resaleCertId: application.resaleCertId,
    businessType: application.businessType,
    storeLocation: application.storeLocation,
    expectedVolume: application.expectedVolume,
    appliedAt: application.submittedAt,
    approvedAt: new Date().toISOString(),
    shipTo: [
      {
        id: "ship-1",
        label: application.businessName,
        line1: application.addressLine1,
        city: application.city,
        state: application.state,
        zip: application.zip,
        isDefault: true,
      },
    ],
    rep: {
      name: "New Accounts Team",
      title: "Wholesale Onboarding",
      email: "newaccounts@hector1984.com",
      phone: "(503) 555-0100",
      initials: "NA",
      territory: "Unassigned — a territory rep will follow up within 2 business days",
    },
  };

  const store = await cookies();
  store.set(PROVISIONED_ACCOUNT_COOKIE, JSON.stringify(account), {
    maxAge: SESSION_MAX_AGE,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  store.set(SESSION_COOKIE, id, { maxAge: SESSION_MAX_AGE, path: "/", httpOnly: true, sameSite: "lax" });
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
  for (const [styleId, qtyMap] of byStyle.entries()) {
    const style = getStyleById(styleId);
    if (!style) continue;
    const validation = validateMatrix(style, account.tier, qtyMap);
    if (!validation.moqMet) {
      return { error: `${style.name} no longer meets its box minimum. Return to cart to fix it.` };
    }
    const unitPrice = getUnitPrice(style, account.tier, validation.totalPairs);
    for (const [colorwayId, boxes] of Object.entries(qtyMap)) {
      for (const [boxTypeId, qty] of Object.entries(boxes)) {
        if (qty && qty > 0) orderLines.push({ styleId, colorwayId, boxTypeId: boxTypeId as BoxTypeId, qty, unitPrice });
      }
    }
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
