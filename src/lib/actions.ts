"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addOrder, getOrdersForAccount } from "@/lib/runtimeOrders";
import {
  APPLICATION_COOKIE,
  SESSION_COOKIE,
  createSession,
  destroyAllSessionsForAccount,
  destroySession,
  getApplication,
  getCurrentAccount,
  setApplicationCookie,
  setSessionCookie,
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
import { getStylesByIds } from "@/lib/data/styles";
import {
  createPasswordResetToken,
  getValidPasswordResetAccountId,
  markPasswordResetTokenUsed,
} from "@/lib/data/passwordReset";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { formatEUR, getOrderMinimumError, getUnitPrice, summarizeOrder, validateMatrix } from "@/lib/pricing";
import { createSavedAssortment, deleteSavedAssortment as deleteSavedAssortmentData } from "@/lib/data/assortments";
import { addFavorite, removeFavorite } from "@/lib/data/favorites";
import { decrementInventoryForOrder } from "@/lib/data/inventory";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppTemplate, buildProformaInvoiceParams } from "@/lib/whatsapp";
import { getHomepageHero } from "@/lib/data/siteContent";
import {
  buildOrderConfirmationEmailBody,
  buildPasswordResetEmailBody,
  orderConfirmationEmailSubject,
  PASSWORD_RESET_EMAIL_SUBJECT,
  textToHtml,
} from "@/lib/emailTemplates";
import { SITE_URL } from "@/lib/siteUrl";
import type { Application, BoxTypeId, CreditTerms, Order, OrderLine, SavedAssortmentLine } from "@/lib/types";

const APPLICATION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * A real scrypt hash of a random throwaway string, used only to burn the same CPU time
 * `verifyPassword` would spend on a genuine account when the submitted email matches
 * nothing. Must stay in valid `salt:hash` form — `verifyPassword` early-returns on a
 * malformed value, which would reintroduce the timing gap this exists to close.
 * No password can match it.
 */
const DUMMY_PASSWORD_HASH =
  "71356a2b6ee1f799d1aec273f4dd4491:dadbd484fee656bc840c516f2b43db583fb0fb9d7087175084a8882e46b1c9b42be773c4673078886f15570f6e8b025228b6d59e4cecf786a12e0bf336ea2359";

export interface FormState {
  error?: string;
  success?: string;
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const account = await getAccountByEmail(email);
  // Always run a full password verification, even when no account matched, so the
  // response time doesn't reveal whether the email is registered. Short-circuiting on a
  // missing account would return before scrypt runs, and that measurable gap defeats the
  // deliberately generic error message below.
  const passwordOk = account
    ? await verifyPassword(password, account.password)
    : await verifyPassword(password, DUMMY_PASSWORD_HASH);
  if (!account || !passwordOk) {
    return { error: "We couldn't find an active account with that email and password." };
  }
  if (account.status !== "active") {
    return { error: "This account has not been activated yet. Contact your sales rep." };
  }

  const token = await createSession(account.id);
  await setSessionCookie(token);

  if (account.role === "admin") redirect("/admin");
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

/**
 * Always returns the same generic success message whether or not the email
 * matches an account — avoids leaking which emails have wholesale accounts.
 */
export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const genericSuccess: FormState = {
    success: "If an account exists for that email, we've sent a link to reset your password.",
  };
  if (!email) return { error: "Enter the email address on your wholesale account." };

  try {
    const account = await getAccountByEmail(email);
    if (account && account.status === "active") {
      const token = await createPasswordResetToken(account.id);
      const resetUrl = `${SITE_URL}/reset-password/${token}`;
      await sendEmail({
        to: account.email,
        subject: PASSWORD_RESET_EMAIL_SUBJECT,
        html: textToHtml(buildPasswordResetEmailBody(resetUrl, account.contactName)),
      });
    }
  } catch (err) {
    console.error("[requestPasswordReset] failed:", err);
  }
  return genericSuccess;
}

export interface ResetPasswordState extends FormState {
  done?: boolean;
}

export async function resetPassword(_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirmPassword) return { error: "Passwords don't match." };

  const invalidTokenError = { error: "This reset link is invalid or has expired. Request a new one." };
  try {
    const accountId = await getValidPasswordResetAccountId(token);
    if (!accountId) return invalidTokenError;

    await updateAccountPasswordData(accountId, await hashPassword(password));
    await markPasswordResetTokenUsed(token);
    // A reset is the "I may be compromised" path — drop every existing session so an
    // attacker holding one can't outlive the password that let them in.
    await destroyAllSessionsForAccount(accountId);
    return { done: true, success: "Password updated. You can now sign in." };
  } catch (err) {
    console.error("[resetPassword] failed:", err);
    return invalidTokenError;
  }
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formData.get("email") ?? "").trim())) {
    return { error: "Enter a valid email address." };
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

  await setApplicationCookie(id, APPLICATION_MAX_AGE);
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
    phone: application.phone,
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
  await setSessionCookie(token);
  const store = await cookies();
  store.delete(APPLICATION_COOKIE);
  redirect("/dashboard");
}

export interface CheckoutState extends FormState {
  orderId?: string;
}

const cartLineSchema = z.object({
  styleId: z.string().min(1),
  colorwayId: z.string().min(1),
  boxTypeId: z.enum(["box8", "box10", "box12"]),
  qty: z.number().int().positive(),
});
const cartLinesSchema = z.array(cartLineSchema);

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  let cartLines: z.infer<typeof cartLinesSchema>;
  try {
    cartLines = cartLinesSchema.parse(JSON.parse(String(formData.get("lines") ?? "[]")));
  } catch {
    return { error: "Your cart data looks invalid. Please refresh and try again." };
  }
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
  const fetchedStyles = await getStylesByIds([...byStyle.keys()]);
  const styleById = new Map(fetchedStyles.map((s) => [s.id, s]));
  let totalPairs = 0;
  for (const [styleId, qtyMap] of byStyle.entries()) {
    const style = styleById.get(styleId);
    if (!style) continue;
    const validation = validateMatrix(style, qtyMap, terms, account.priceMultiplier);
    totalPairs += validation.totalPairs;
    const unitPrice = getUnitPrice(style, terms, account.priceMultiplier);
    // Captured now, not looked up when the invoice/WhatsApp message is built
    // later — same principle as unitPrice: a later change to the product's
    // VAT rate must not rewrite the tax on an order that's already placed.
    const vatRate = style.vatRate ?? 0;
    for (const [colorwayId, boxes] of Object.entries(qtyMap)) {
      for (const [boxTypeId, qty] of Object.entries(boxes)) {
        if (qty && qty > 0) orderLines.push({ styleId, colorwayId, boxTypeId: boxTypeId as BoxTypeId, qty, unitPrice, vatRate });
      }
    }
  }

  const minimumError = getOrderMinimumError(totalPairs);
  if (minimumError) return { error: minimumError };

  // Credit is checked against grandTotal (net + VAT) — the real amount this
  // order will add to the buyer's outstanding balance, not just the pre-tax
  // figure. Existing outstanding orders are summed the same way, so a buyer
  // can't be pushed over their real credit limit once VAT applies.
  const { total: orderTotal, vatTotal: orderVat, grandTotal: orderGrandTotal } = summarizeOrder({ lines: orderLines });
  const existingOrders = await getOrdersForAccount(account.id);
  const outstanding = existingOrders
    .filter((o) => o.status !== "delivered")
    .reduce((sum, o) => sum + summarizeOrder(o).grandTotal, 0);
  const availableCredit = account.creditLimit - outstanding;
  if (orderGrandTotal > availableCredit) {
    return {
      error: `This order (${formatEUR(orderGrandTotal)} incl. VAT) exceeds your available credit (${formatEUR(Math.max(availableCredit, 0))} of a ${formatEUR(account.creditLimit)} limit). Contact ${account.rep.name} to raise your limit or reduce the order.`,
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
  await sendEmail({
    to: account.email,
    subject: orderConfirmationEmailSubject(order),
    html: textToHtml(buildOrderConfirmationEmailBody(order, account.contactName)),
  });

  // WhatsApp notification for the proforma invoice request — no-ops safely
  // (with a console warning) until both WHATSAPP_* env vars are set AND the
  // buyer has a phone on file. Never blocks or fails the order: a redirect
  // to the order confirmation page happens regardless of whether this send
  // succeeded, exactly like the email above.
  if (account.phone) {
    const hero = await getHomepageHero();
    await sendWhatsAppTemplate({
      to: account.phone,
      params: buildProformaInvoiceParams({
        contactName: account.contactName,
        orderId: order.id,
        poNumber: order.poNumber,
        totalPairs,
        subtotal: formatEUR(orderTotal),
        vatAmount: formatEUR(orderVat),
        grandTotal: formatEUR(orderGrandTotal),
        extraNote: hero.whatsappClosingNote,
      }),
    });
  } else {
    console.warn(`[whatsapp] Account ${account.id} has no phone on file — skipping proforma invoice notification.`);
  }

  redirect(`/dashboard/orders/${order.id}?justPlaced=1`);
}

export async function updateAccountProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const businessName = String(formData.get("businessName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!businessName || !contactName || !email) {
    return { error: "Business name, contact name, and email are all required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  // Loose on purpose — phone formats vary a lot by country. Just enough to
  // catch an obvious typo; digits-only normalization happens at WhatsApp-send time.
  if (phone && phone.replace(/\D/g, "").length < 7) {
    return { error: "Enter a valid phone number, including country code." };
  }

  const result = await updateAccountContact(account.id, { businessName, contactName, email, phone: phone || undefined });
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
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (newPassword !== confirmPassword) return { error: "New password and confirmation don't match." };

  await updateAccountPasswordData(account.id, await hashPassword(newPassword));
  // Revoke other sessions, then re-issue one for this device so the user isn't signed out
  // of the tab they just changed their password in.
  await destroyAllSessionsForAccount(account.id);
  await setSessionCookie(await createSession(account.id));
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
  const lines = JSON.parse(String(formData.get("lines") ?? "[]")) as SavedAssortmentLine[];
  if (!name) return { error: "Give this assortment a name." };
  if (lines.length === 0) return { error: "Add at least one style before saving." };

  await createSavedAssortment(account.id, name, lines);
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

/** Toggles a style in the current buyer's favorites/wishlist. Best-effort — degrades to a
 * no-op error rather than crashing if migration 0018 hasn't run yet. */
export async function toggleFavoriteAction(styleId: string, favorited: boolean): Promise<{ error?: string }> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  try {
    if (favorited) await removeFavorite(account.id, styleId);
    else await addFavorite(account.id, styleId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update favorites." };
  }
  revalidatePath("/product/[slug]", "page");
  revalidatePath("/catalogue");
  revalidatePath("/dashboard/favorites");
  return {};
}
