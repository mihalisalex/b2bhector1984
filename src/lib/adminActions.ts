"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getApplicationById, updateApplicationStatus, approveApplicationWithAssignment } from "@/lib/data/applications";
import { updateAvailableBoxTypes } from "@/lib/data/styles";
import {
  updateAccountPriceMultiplier,
  updateAccountCreditTerms,
  updateAccountCreditLimit,
  updateAccountMinOrderPairs,
  updateAccountRep,
  updateAccountPhoneAdmin,
  getAccountByEmail,
} from "@/lib/data/accounts";
import { MIN_ORDER_PAIRS } from "@/lib/pricing";
import { createSalesRep, updateSalesRep, deleteSalesRep, getSalesRepById } from "@/lib/data/salesReps";
import { logAudit } from "@/lib/data/auditLog";
import { updateHomepageHero, createHeroImageUploadTarget, finalizeHeroImageUpload } from "@/lib/data/siteContent";
import { updateSeasonSettings, createSeasonTeaserUploadTarget, finalizeSeasonTeaserUpload } from "@/lib/data/seasonSettings";
import {
  updateOrderStatus as updateOrderStatusInDb,
  updateOrderDetails as updateOrderDetailsInDb,
  updateOrderLineQty as updateOrderLineQtyInDb,
  deleteOrderLine as deleteOrderLineInDb,
  getOrderByIdAdmin,
} from "@/lib/runtimeOrders";
import { sendEmail } from "@/lib/email";
import {
  APPLICATION_APPROVED_EMAIL_SUBJECT,
  APPLICATION_DECLINED_EMAIL_SUBJECT,
  buildApplicationApprovedEmailBody,
  buildApplicationDeclinedEmailBody,
  buildOrderStatusEmailBody,
  orderStatusEmailSubject,
  textToHtml,
} from "@/lib/emailTemplates";
import { SITE_URL } from "@/lib/siteUrl";
import type { FormState } from "@/lib/actions";
import type { BoxTypeId, CreditTerms, OrderStatus, Season } from "@/lib/types";

async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") redirect("/login");
  return account;
}

/** Best-effort — `sendEmail` never throws, so this can't fail the status update that triggered it. */
async function notifyOrderStatusChange(orderId: string, status: OrderStatus) {
  const order = await getOrderByIdAdmin(orderId);
  if (!order?.email) return;
  const subject = orderStatusEmailSubject({ id: order.id, status });
  await sendEmail({
    to: order.email,
    subject,
    html: textToHtml(buildOrderStatusEmailBody({ id: order.id, status }, order.contactName), subject),
  });
}

/** Best-effort — `sendEmail` never throws, so this can't fail the status update that triggered it. */
async function notifyApplicationDecision(applicationId: string, decision: "approved" | "declined") {
  const application = await getApplicationById(applicationId);
  if (!application) return;
  if (decision === "approved") {
    // `repId` was just set by `approveApplicationWithAssignment` (or left unset on a bulk
    // approve) — re-fetched fresh here rather than threaded through as a param, so
    // `resendActivationEmail` gets the same rep info for free from the application row
    // instead of needing its own copy of this lookup.
    const rep = application.repId ? await getSalesRepById(application.repId) : undefined;
    await sendEmail({
      to: application.email,
      subject: APPLICATION_APPROVED_EMAIL_SUBJECT,
      html: textToHtml(
        buildApplicationApprovedEmailBody(
          application.contactName,
          `${SITE_URL}/apply/pending?app=${application.id}`,
          rep ? { name: rep.name, phone: rep.phone } : undefined,
        ),
        APPLICATION_APPROVED_EMAIL_SUBJECT,
      ),
    });
  } else {
    await sendEmail({
      to: application.email,
      subject: APPLICATION_DECLINED_EMAIL_SUBJECT,
      html: textToHtml(buildApplicationDeclinedEmailBody(application.contactName), APPLICATION_DECLINED_EMAIL_SUBJECT),
    });
  }
}

const ORDER_STATUSES: OrderStatus[] = ["submitted", "confirmed", "in_production", "shipped", "delivered"];

/** Bound to `.bind(null, orderId)` for use as a <form action>. */
export async function updateOrderStatus(orderId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const status = String(formData.get("status") ?? "");
  if (!ORDER_STATUSES.includes(status as OrderStatus)) return { error: "Invalid status." };
  const result = await updateOrderStatusInDb(orderId, status as OrderStatus);
  if (result.error) return { error: result.error };
  await logAudit(admin.id, "order.status_changed", "order", orderId, status);
  await notifyOrderStatusChange(orderId, status as OrderStatus);
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
  const admin = await requireAdmin();

  const terms = String(formData.get("terms") ?? "");
  const shipToId = String(formData.get("shipToId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const invoiceUrl = String(formData.get("invoiceUrl") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const carrier = String(formData.get("carrier") ?? "").trim();

  if (!ORDER_TERMS.includes(terms as CreditTerms)) return { error: "Select valid payment terms." };

  await updateOrderDetailsInDb(orderId, accountId, {
    terms: terms as CreditTerms,
    shipToId,
    notes: notes || undefined,
    invoiceUrl: invoiceUrl || undefined,
    trackingNumber: trackingNumber || undefined,
    carrier: carrier || undefined,
  });
  await logAudit(admin.id, "order.details_updated", "order", orderId);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  revalidatePath(`/dashboard/orders/${orderId}`);
  return { success: "Order updated." };
}

/** Bound to `.bind(null, orderId)` — a <form action> per line row's qty stepper. */
export async function updateOrderLineQtyAction(orderId: string, formData: FormData) {
  const admin = await requireAdmin();
  const lineId = String(formData.get("lineId") ?? "");
  const qty = Number(formData.get("qty") ?? 0);
  if (!lineId || !Number.isFinite(qty) || qty < 1) return;
  await updateOrderLineQtyInDb(lineId, Math.round(qty));
  await logAudit(admin.id, "order.line_qty_updated", "order", orderId, `line ${lineId} → qty ${Math.round(qty)}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  revalidatePath(`/dashboard/orders/${orderId}`);
}

/** Bound to `.bind(null, orderId, lineId)` — a <form action> per line row's remove button. */
export async function deleteOrderLineAction(orderId: string, lineId: string) {
  const admin = await requireAdmin();
  const result = await deleteOrderLineInDb(lineId);
  if (result.error) return; // last remaining line — refused, nothing to revalidate
  await logAudit(admin.id, "order.line_deleted", "order", orderId, `line ${lineId}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  revalidatePath(`/dashboard/orders/${orderId}`);
}

/**
 * Bound to `.bind(null, applicationId)` — the row's own form (rep select + price-multiplier
 * input, see `AdminApplicationsList`) submits both alongside the Approve click, so the
 * decision is made once, here, rather than editable-then-forgotten on /admin/accounts after
 * the fact. Both are optional to the admin: an empty rep select persists as unassigned
 * (same as never picking one), and an empty/omitted multiplier defaults to 1 (no markup) —
 * approving without touching either field behaves exactly like the old plain Approve button.
 */
export async function approveApplication(applicationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const repId = String(formData.get("repId") ?? "").trim() || null;
  const rawMultiplier = String(formData.get("priceMultiplier") ?? "").trim();
  const priceMultiplier = rawMultiplier ? Number(rawMultiplier) : 1;
  if (!Number.isFinite(priceMultiplier) || priceMultiplier <= 0 || priceMultiplier > 5) {
    return { error: "Price multiplier must be between 0.01 and 5." };
  }

  const { changed } = await approveApplicationWithAssignment(applicationId, { repId, priceMultiplier });
  if (changed) {
    await logAudit(
      admin.id,
      "application.approved",
      "application",
      applicationId,
      `rep ${repId ?? "unassigned"}, ${priceMultiplier}x`,
    );
    await notifyApplicationDecision(applicationId, "approved");
  }
  revalidatePath("/admin/applications");
  return { success: "Application approved." };
}

/**
 * Re-sends the "you're approved, activate now" email for an application that's already
 * approved — for cases like the activation link having been broken (dead domain, expired
 * assumption, etc.) when the original email went out. A no-op if the application was
 * declined/never approved, or if it's already been activated (an account already exists
 * for the email) — resending an activation link to someone who already has an account
 * would be confusing, not helpful.
 */
export async function resendActivationEmail(applicationId: string) {
  const admin = await requireAdmin();
  const application = await getApplicationById(applicationId);
  if (!application || application.status !== "approved") return;
  const existingAccount = await getAccountByEmail(application.email);
  if (existingAccount) return;
  await logAudit(admin.id, "application.activation_email_resent", "application", applicationId);
  await notifyApplicationDecision(applicationId, "approved");
  revalidatePath("/admin/applications");
}

export async function declineApplication(applicationId: string) {
  const admin = await requireAdmin();
  const { changed } = await updateApplicationStatus(applicationId, "declined");
  if (changed) {
    await logAudit(admin.id, "application.declined", "application", applicationId);
    await notifyApplicationDecision(applicationId, "declined");
  }
  revalidatePath("/admin/applications");
}

/** Bulk status update — loops the same per-order guard (e.g. shipped requires tracking). */
export async function bulkUpdateOrderStatus(orderIds: string[], status: OrderStatus): Promise<FormState> {
  const admin = await requireAdmin();
  if (!ORDER_STATUSES.includes(status)) return { error: "Invalid status." };
  const failures: string[] = [];
  for (const orderId of orderIds) {
    const result = await updateOrderStatusInDb(orderId, status);
    if (result.error) {
      failures.push(`${orderId}: ${result.error}`);
    } else {
      await logAudit(admin.id, "order.status_changed", "order", orderId, status);
      await notifyOrderStatusChange(orderId, status);
    }
  }
  revalidatePath("/admin");
  if (failures.length > 0) return { error: `${failures.length} of ${orderIds.length} orders couldn't be updated — ${failures.join("; ")}` };
  return { success: `Updated ${orderIds.length} orders to ${status}.` };
}

/** Bulk approve — loops the same single-application approval path. */
export async function bulkApproveApplications(applicationIds: string[]): Promise<FormState> {
  const admin = await requireAdmin();
  for (const applicationId of applicationIds) {
    const { changed } = await updateApplicationStatus(applicationId, "approved");
    if (!changed) continue;
    await logAudit(admin.id, "application.approved", "application", applicationId);
    await notifyApplicationDecision(applicationId, "approved");
  }
  revalidatePath("/admin/applications");
  return { success: `Approved ${applicationIds.length} applications.` };
}

export interface UploadState {
  error?: string;
}

export type UploadTarget = { bucket: string; path: string; token: string } | { error: string };

const ALL_BOX_TYPES: BoxTypeId[] = ["box8", "box10", "box12"];

export async function updateAvailableBoxTypesAction(formData: FormData) {
  await requireAdmin();
  const styleId = String(formData.get("styleId") ?? "");
  if (!styleId) return;
  const selected = ALL_BOX_TYPES.filter((id) => formData.get(id) === "on");
  await updateAvailableBoxTypes(styleId, selected.length > 0 ? selected : ALL_BOX_TYPES);
  // The form lives in the Products editor's Inventory tab, so revalidate that route —
  // this previously pointed at `/admin/styles/:id`, which is now only a redirect stub, so
  // the page the admin was actually looking at kept serving stale box types after a save.
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${styleId}`);
  revalidatePath("/catalogue");
  revalidatePath("/quick-order");
  revalidatePath("/product/[slug]", "page");
}

/** Bound to `.bind(null, accountId)` — a <form action> per account row on /admin/accounts. */
export async function updateAccountPriceMultiplierAction(accountId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const priceMultiplier = Number(formData.get("priceMultiplier") ?? 1);
  if (!Number.isFinite(priceMultiplier) || priceMultiplier <= 0 || priceMultiplier > 5) return { error: "Price multiplier must be between 0.01 and 5." };
  await updateAccountPriceMultiplier(accountId, priceMultiplier);
  await logAudit(admin.id, "account.price_multiplier_updated", "account", accountId, String(priceMultiplier));
  revalidatePath("/admin/accounts");
  return { success: "Price multiplier saved." };
}

/**
 * Bound to `.bind(null, accountId)` — a <form action> per account row's minimum-order
 * input on /admin/accounts. An empty field clears the override (back to the standard
 * `MIN_ORDER_PAIRS`); this is deliberately not exposed at application approval time — it's
 * meant for an account that's already been trading a while, not a decision made on day one.
 */
export async function updateAccountMinOrderPairsAction(accountId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const raw = String(formData.get("minOrderPairs") ?? "").trim();
  if (!raw) {
    await updateAccountMinOrderPairs(accountId, null);
    await logAudit(admin.id, "account.min_order_pairs_updated", "account", accountId, "cleared");
    revalidatePath("/admin/accounts");
    return { success: `Minimum order reset to the standard ${MIN_ORDER_PAIRS} pairs.` };
  }
  const minOrderPairs = Number(raw);
  if (!Number.isInteger(minOrderPairs) || minOrderPairs <= 0 || minOrderPairs > MIN_ORDER_PAIRS) {
    return { error: `Minimum order must be a whole number between 1 and ${MIN_ORDER_PAIRS} pairs.` };
  }
  await updateAccountMinOrderPairs(accountId, minOrderPairs);
  await logAudit(admin.id, "account.min_order_pairs_updated", "account", accountId, String(minOrderPairs));
  revalidatePath("/admin/accounts");
  return { success: "Minimum order saved." };
}

/** Backfills/corrects the WhatsApp number for accounts that predate this feature or never went through the application flow. */
export async function updateAccountPhoneAction(accountId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const phone = String(formData.get("phone") ?? "").trim();
  if (phone && phone.replace(/\D/g, "").length < 7) return { error: "Enter a valid phone number, including country code." };
  await updateAccountPhoneAdmin(accountId, phone);
  await logAudit(admin.id, "account.phone_updated", "account", accountId);
  revalidatePath("/admin/accounts");
  return { success: "Phone saved." };
}

const ACCOUNT_TERMS: CreditTerms[] = ["prepay", "net30", "net60"];

/** Bound to `.bind(null, accountId)` — a <form action> per account row's terms select. */
export async function updateAccountCreditTermsAction(accountId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const terms = String(formData.get("creditTerms") ?? "");
  if (!ACCOUNT_TERMS.includes(terms as CreditTerms)) return { error: "Invalid credit terms." };
  await updateAccountCreditTerms(accountId, terms as CreditTerms);
  await logAudit(admin.id, "account.credit_terms_updated", "account", accountId, terms);
  revalidatePath("/admin/accounts");
  return { success: "Credit terms saved." };
}

/** Bound to `.bind(null, accountId)` — a <form action> per account row's credit-limit input. */
export async function updateAccountCreditLimitAction(accountId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const creditLimit = Number(formData.get("creditLimit") ?? 0);
  if (!Number.isFinite(creditLimit) || creditLimit < 0 || creditLimit > 10_000_000) return { error: "Credit limit must be between €0 and €10,000,000." };
  await updateAccountCreditLimit(accountId, creditLimit);
  await logAudit(admin.id, "account.credit_limit_updated", "account", accountId, String(creditLimit));
  revalidatePath("/admin/accounts");
  return { success: "Credit limit saved." };
}

/** Bound to `.bind(null, accountId)` — a <form action> per account row's rep select. */
export async function updateAccountRepAction(accountId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const repId = String(formData.get("repId") ?? "").trim();
  await updateAccountRep(accountId, repId || null);
  await logAudit(admin.id, "account.rep_updated", "account", accountId, repId || "unassigned");
  revalidatePath("/admin/accounts");
  return { success: "Sales rep saved." };
}

/** Bound to `.bind(null, repId)` — a <form action> per sales-rep row on /admin/sales-reps. */
export async function updateSalesRepAction(repId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const initials = String(formData.get("initials") ?? "").trim();
  const territory = String(formData.get("territory") ?? "").trim();
  if (!name || !email) return { error: "Name and email are required." };
  await updateSalesRep(repId, { name, title, email, phone, initials, territory });
  await logAudit(admin.id, "sales_rep.updated", "sales_rep", repId, name);
  revalidatePath("/admin/sales-reps");
  revalidatePath("/admin/accounts");
  return { success: "Saved." };
}

export async function createSalesRepAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const initials = String(formData.get("initials") ?? "").trim();
  const territory = String(formData.get("territory") ?? "").trim();
  if (!name || !email) return { error: "Name and email are required." };
  const rep = await createSalesRep({ name, title, email, phone, initials: initials || name.slice(0, 2).toUpperCase(), territory });
  await logAudit(admin.id, "sales_rep.created", "sales_rep", rep.id, name);
  revalidatePath("/admin/sales-reps");
  return { success: "Sales rep added." };
}

/** Bound to `.bind(null, repId)` — uses useActionState so a "rep still assigned" error can surface inline. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by useActionState, neither param is needed
export async function deleteSalesRepAction(repId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const result = await deleteSalesRep(repId);
  if (result.error) return { error: result.error };
  await logAudit(admin.id, "sales_rep.deleted", "sales_rep", repId);
  revalidatePath("/admin/sales-reps");
  return { success: "Sales rep removed." };
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
    announcementEnabled: formData.get("announcementEnabled") === "on",
    announcementText: String(formData.get("announcementText") ?? ""),
    announcementHref: String(formData.get("announcementHref") ?? ""),
    whatsappClosingNote: String(formData.get("whatsappClosingNote") ?? ""),
    productionLeadTimeDays: Math.max(1, Number(formData.get("productionLeadTimeDays")) || 40),
  });
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function updateSeasonSettingsAction(formData: FormData) {
  await requireAdmin();
  await updateSeasonSettings({
    summer: {
      enabled: formData.get("summerEnabled") === "on",
      label: String(formData.get("summerLabel") ?? "").trim() || "Summer",
    },
    winter: {
      enabled: formData.get("winterEnabled") === "on",
      label: String(formData.get("winterLabel") ?? "").trim() || "Winter",
    },
  });
  revalidatePath("/admin/seasons");
  revalidatePath("/");
  revalidatePath("/catalogue");
  revalidatePath("/collections");
  revalidatePath("/quick-order");
}

export async function createSeasonTeaserUploadUrlAction(season: Season, fileName: string): Promise<UploadTarget> {
  await requireAdmin();
  try {
    return await createSeasonTeaserUploadTarget(season, fileName);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not start upload." };
  }
}

export async function finalizeSeasonTeaserUploadAction(season: Season, path: string): Promise<UploadState> {
  await requireAdmin();
  try {
    await finalizeSeasonTeaserUpload(season, path);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }
  revalidatePath("/admin/seasons");
  revalidatePath("/");
  return {};
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
