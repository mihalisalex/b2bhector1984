"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/adminGuard";
import { getApplicationById, updateApplicationStatus, approveApplicationWithAssignment } from "@/lib/data/applications";
import { updateAvailableBoxTypes } from "@/lib/data/styles";
import {
  updateAccountPriceMultiplier,
  updateAccountCreditTerms,
  updateAccountCreditLimit,
  updateAccountMinOrderPairs,
  updateAccountRep,
  updateAccountPhoneAdmin,
  updateAccountCountry,
  getAccountByEmail,
} from "@/lib/data/accounts";
import { isKnownCountry } from "@/lib/countries";
import { MIN_ORDER_PAIRS } from "@/lib/pricing";
import { createSalesRep, updateSalesRep, deleteSalesRep, getSalesRepById } from "@/lib/data/salesReps";
import { logAudit } from "@/lib/data/auditLog";
import { getHomepageHero, updateHomepageHero, createHeroImageUploadTarget, finalizeHeroImageUpload } from "@/lib/data/siteContent";
import { getSeasonSettings, updateSeasonSettings, createSeasonTeaserUploadTarget, finalizeSeasonTeaserUpload } from "@/lib/data/seasonSettings";
import { invalidateCache } from "@/lib/cacheInvalidation";
import { CACHE_TAGS } from "@/lib/cacheTags";
import {
  updateOrderStatus as updateOrderStatusInDb,
  updateOrderDetails as updateOrderDetailsInDb,
  updateOrderLineQty as updateOrderLineQtyInDb,
  deleteOrderLine as deleteOrderLineInDb,
  getOrderByIdAdmin,
} from "@/lib/runtimeOrders";
import { sendEmail } from "@/lib/email";
import {
  buildApplicationApprovedEmailBody,
  buildApplicationDeclinedEmailBody,
  buildOrderStatusEmailBody,
  orderStatusEmailSubject,
  textToHtml,
} from "@/lib/emailTemplates";
import { getDictionary } from "@/i18n/getDictionary";
import { resolveLocale } from "@/lib/localeHeuristic";
import { SITE_URL } from "@/lib/siteUrl";
import { estimatedArrivalIso } from "@/lib/delivery";
import { formatDayMonth } from "@/lib/format";
import { urlForLocale } from "@/i18n/domains";
import type { Locale } from "@/i18n/config";
import type { FormState } from "@/lib/actions";
import type { BoxTypeId, CreditTerms, OrderStatus, Season } from "@/lib/types";

/** Best-effort — `sendEmail` never throws, so this can't fail the status update that triggered it. */
async function notifyOrderStatusChange(orderId: string, status: OrderStatus) {
  const order = await getOrderByIdAdmin(orderId);
  if (!order?.email) return;
  // The buyer's language, not the admin's. The admin triggering this is on the
  // English-only admin site, which says nothing about who receives the mail.
  const locale = resolveLocale(order.locale, order.storeLocation);
  const e = (await getDictionary(locale)).email;
  const subject = orderStatusEmailSubject(e, { id: order.id, status });
  const extras = await orderStatusExtras(order.id, locale);
  await sendEmail({
    to: order.email,
    subject,
    html: textToHtml(buildOrderStatusEmailBody(e, { id: order.id, status }, order.contactName, extras), subject, e, locale),
  });
}

/** The arrival estimate (from today) and the buyer's own link to the order, for status messages. */
async function orderStatusExtras(orderId: string, locale: Locale): Promise<{ arrival: string; link: string }> {
  const hero = await getHomepageHero();
  return {
    arrival: formatDayMonth(estimatedArrivalIso(hero.productionLeadTimeDays), locale),
    link: urlForLocale(locale, `/dashboard/orders/${orderId}`),
  };
}

/** Best-effort — `sendEmail` never throws, so this can't fail the status update that triggered it. */
async function notifyApplicationDecision(applicationId: string, decision: "approved" | "declined") {
  const application = await getApplicationById(applicationId);
  if (!application) return;
  // An application has no account yet and `applications` carries no locale column, so the
  // store address is the only real signal — the same heuristic migration 0037 used to
  // backfill accounts.locale. Guessing from the admin's own domain would be worse than
  // useless: the admin is always on the English admin site.
  const locale = resolveLocale(undefined, application.storeLocation);
  const e = (await getDictionary(locale)).email;
  if (decision === "approved") {
    // `repId` was just set by `approveApplicationWithAssignment` (or left unset on a bulk
    // approve) — re-fetched fresh here rather than threaded through as a param, so
    // `resendActivationEmail` gets the same rep info for free from the application row
    // instead of needing its own copy of this lookup.
    const rep = application.repId ? await getSalesRepById(application.repId) : undefined;
    await sendEmail({
      to: application.email,
      subject: e.approvedSubject,
      html: textToHtml(
        buildApplicationApprovedEmailBody(
          e,
          application.contactName,
          `${SITE_URL}/apply/pending?app=${application.id}`,
          rep ? { name: rep.name, phone: rep.phone } : undefined,
        ),
        e.approvedSubject,
        e,
        locale,
      ),
    });
  } else {
    await sendEmail({
      to: application.email,
      subject: e.declinedSubject,
      html: textToHtml(buildApplicationDeclinedEmailBody(e, application.contactName), e.declinedSubject, e, locale),
    });
  }
}

const ORDER_STATUSES: OrderStatus[] = ["submitted", "confirmed", "in_production", "shipped", "delivered", "cancelled"];

/** Bound to `.bind(null, orderId)` for use as a <form action>. */
export async function updateOrderStatus(orderId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("orders.manage");
  const status = String(formData.get("status") ?? "");
  if (!ORDER_STATUSES.includes(status as OrderStatus)) return { error: "Μη έγκυρη κατάσταση." };
  const result = await updateOrderStatusInDb(orderId, status as OrderStatus, admin.id);
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
  const admin = await requirePermission("orders.manage");

  const terms = String(formData.get("terms") ?? "");
  const shipToId = String(formData.get("shipToId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const invoiceUrl = String(formData.get("invoiceUrl") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const carrier = String(formData.get("carrier") ?? "").trim();

  if (!ORDER_TERMS.includes(terms as CreditTerms)) return { error: "Διάλεξε όρους πληρωμής." };
  // Now that this renders as a link, it has to actually be one — the field previously
  // accepted any string (a literal "not-a-url" saved fine) because nothing ever used it.
  if (invoiceUrl && !/^https?:\/\/\S+$/i.test(invoiceUrl)) {
    return { error: "Το link τιμολογίου πρέπει να ξεκινά με http:// ή https://" };
  }

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
  return { success: "Η παραγγελία ενημερώθηκε." };
}

/** Bound to `.bind(null, orderId)` — a <form action> per line row's qty stepper. */
export async function updateOrderLineQtyAction(orderId: string, formData: FormData) {
  const admin = await requirePermission("orders.manage");
  const lineId = String(formData.get("lineId") ?? "");
  const qty = Number(formData.get("qty") ?? 0);
  if (!lineId || !Number.isFinite(qty) || qty < 1) return;
  // Moves stock to match the new quantity, and refuses if an increase isn't covered.
  const result = await updateOrderLineQtyInDb(lineId, Math.round(qty), admin.id);
  if (result.error) {
    // This form has no error surface (a plain <form action>, no useActionState), so the
    // row simply re-renders at its unchanged quantity. Logged so the reason is findable.
    console.warn(`[admin] line qty change refused on ${orderId}/${lineId}: ${result.error}`);
    return;
  }
  await logAudit(admin.id, "order.line_qty_updated", "order", orderId, `line ${lineId} → qty ${Math.round(qty)}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  revalidatePath(`/dashboard/orders/${orderId}`);
}

/** Bound to `.bind(null, orderId, lineId)` — a <form action> per line row's remove button. */
export async function deleteOrderLineAction(orderId: string, lineId: string) {
  const admin = await requirePermission("orders.manage");
  const result = await deleteOrderLineInDb(lineId, admin.id);
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
  const admin = await requirePermission("accounts.manage");
  const repId = String(formData.get("repId") ?? "").trim() || null;
  const rawMultiplier = String(formData.get("priceMultiplier") ?? "").trim();
  const priceMultiplier = rawMultiplier ? Number(rawMultiplier) : 1;
  if (!Number.isFinite(priceMultiplier) || priceMultiplier <= 0 || priceMultiplier > 5) {
    return { error: "Ο συντελεστής τιμής πρέπει να είναι από 0,01 έως 5." };
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
  return { success: "Η αίτηση εγκρίθηκε." };
}

/**
 * Re-sends the "you're approved, activate now" email for an application that's already
 * approved — for cases like the activation link having been broken (dead domain, expired
 * assumption, etc.) when the original email went out. A no-op if the application was
 * declined/never approved, or if it's already been activated (an account already exists
 * for the email) — resending an activation link to someone who already has an account
 * would be confusing, not helpful.
 */
// Takes no `formData` — the form has no fields, only a submit button — but `useActionState`
// still requires the previous-state parameter to be in the signature, so it can't be dropped.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- positional, required by the useActionState contract
export async function resendActivationEmail(applicationId: string, _prev: FormState): Promise<FormState> {
  const admin = await requirePermission("accounts.manage");
  const application = await getApplicationById(applicationId);
  // Each of these three outcomes used to be a bare `return`, which rendered as
  // absolutely nothing: the button was indistinguishable from a dead control
  // whether it had just sent an email, refused to, or hit a no-op. Every branch
  // now says which one happened.
  if (!application) return { error: "Η αίτηση δεν υπάρχει πια." };
  if (application.status !== "approved") {
    return { error: `Δεν υπάρχει κάτι για αποστολή: η αίτηση δεν περιμένει ενεργοποίηση.` };
  }
  const existingAccount = await getAccountByEmail(application.email);
  if (existingAccount) {
    return { error: `Το ${application.email} έχει ήδη ενεργοποιήσει λογαριασμό.` };
  }
  await logAudit(admin.id, "application.activation_email_resent", "application", applicationId);
  await notifyApplicationDecision(applicationId, "approved");
  revalidatePath("/admin/applications");
  return { success: `Το email ενεργοποίησης στάλθηκε ξανά στο ${application.email}.` };
}

export async function declineApplication(applicationId: string) {
  const admin = await requirePermission("accounts.manage");
  const { changed } = await updateApplicationStatus(applicationId, "declined");
  if (changed) {
    await logAudit(admin.id, "application.declined", "application", applicationId);
    await notifyApplicationDecision(applicationId, "declined");
  }
  revalidatePath("/admin/applications");
}

/** Bulk status update — loops the same per-order guard (e.g. shipped requires tracking). */
export async function bulkUpdateOrderStatus(orderIds: string[], status: OrderStatus): Promise<FormState> {
  const admin = await requirePermission("orders.manage");
  if (!ORDER_STATUSES.includes(status)) return { error: "Μη έγκυρη κατάσταση." };
  const failures: string[] = [];
  for (const orderId of orderIds) {
    const result = await updateOrderStatusInDb(orderId, status, admin.id);
    if (result.error) {
      failures.push(`${orderId}: ${result.error}`);
    } else {
      await logAudit(admin.id, "order.status_changed", "order", orderId, status);
      await notifyOrderStatusChange(orderId, status);
    }
  }
  revalidatePath("/admin");
  if (failures.length > 0) return { error: `${failures.length} από ${orderIds.length} παραγγελίες δεν ενημερώθηκαν: ${failures.join("; ")}` };
  return { success: `Ενημερώθηκαν ${orderIds.length} παραγγελίες.` };
}

/** Bulk approve — loops the same single-application approval path. */
export async function bulkApproveApplications(applicationIds: string[]): Promise<FormState> {
  const admin = await requirePermission("accounts.manage");
  for (const applicationId of applicationIds) {
    const { changed } = await updateApplicationStatus(applicationId, "approved");
    if (!changed) continue;
    await logAudit(admin.id, "application.approved", "application", applicationId);
    await notifyApplicationDecision(applicationId, "approved");
  }
  revalidatePath("/admin/applications");
  return { success: `Εγκρίθηκαν ${applicationIds.length} αιτήσεις.` };
}

export interface UploadState {
  error?: string;
}

export type UploadTarget = { bucket: string; path: string; token: string } | { error: string };

const ALL_BOX_TYPES: BoxTypeId[] = ["box8", "box10", "box12"];

export async function updateAvailableBoxTypesAction(formData: FormData) {
  await requirePermission("products.edit");
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
  const admin = await requirePermission("accounts.manage");
  const priceMultiplier = Number(formData.get("priceMultiplier") ?? 1);
  if (!Number.isFinite(priceMultiplier) || priceMultiplier <= 0 || priceMultiplier > 5) return { error: "Ο συντελεστής τιμής πρέπει να είναι από 0,01 έως 5." };
  await updateAccountPriceMultiplier(accountId, priceMultiplier);
  await logAudit(admin.id, "account.price_multiplier_updated", "account", accountId, String(priceMultiplier));
  revalidatePath("/admin/accounts");
  return { success: "Αποθηκεύτηκε." };
}

/**
 * Bound to `.bind(null, accountId)` — a <form action> per account row's minimum-order
 * input on /admin/accounts. An empty field clears the override (back to the standard
 * `MIN_ORDER_PAIRS`); this is deliberately not exposed at application approval time — it's
 * meant for an account that's already been trading a while, not a decision made on day one.
 */
export async function updateAccountMinOrderPairsAction(accountId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("accounts.manage");
  const raw = String(formData.get("minOrderPairs") ?? "").trim();
  if (!raw) {
    await updateAccountMinOrderPairs(accountId, null);
    await logAudit(admin.id, "account.min_order_pairs_updated", "account", accountId, "cleared");
    revalidatePath("/admin/accounts");
    return { success: `Το ελάχιστο γύρισε στα ${MIN_ORDER_PAIRS} ζευγάρια.` };
  }
  const minOrderPairs = Number(raw);
  if (!Number.isInteger(minOrderPairs) || minOrderPairs <= 0 || minOrderPairs > MIN_ORDER_PAIRS) {
    return { error: `Το ελάχιστο πρέπει να είναι ακέραιος από 1 έως ${MIN_ORDER_PAIRS} ζευγάρια.` };
  }
  await updateAccountMinOrderPairs(accountId, minOrderPairs);
  await logAudit(admin.id, "account.min_order_pairs_updated", "account", accountId, String(minOrderPairs));
  revalidatePath("/admin/accounts");
  return { success: "Αποθηκεύτηκε." };
}

/** Backfills/corrects the WhatsApp number for accounts that predate this feature or never went through the application flow. */
export async function updateAccountPhoneAction(accountId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("accounts.manage");
  const phone = String(formData.get("phone") ?? "").trim();
  if (phone && phone.replace(/\D/g, "").length < 7) return { error: "Γράψε έγκυρο τηλέφωνο με κωδικό χώρας." };
  await updateAccountPhoneAdmin(accountId, phone);
  await logAudit(admin.id, "account.phone_updated", "account", accountId);
  revalidatePath("/admin/accounts");
  return { success: "Αποθηκεύτηκε." };
}

const ACCOUNT_TERMS: CreditTerms[] = ["prepay", "net30", "net60"];

/** Bound to `.bind(null, accountId)` — a <form action> per account row's terms select. */
export async function updateAccountCreditTermsAction(accountId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("accounts.manage");
  const terms = String(formData.get("creditTerms") ?? "");
  if (!ACCOUNT_TERMS.includes(terms as CreditTerms)) return { error: "Μη έγκυροι όροι." };
  await updateAccountCreditTerms(accountId, terms as CreditTerms);
  await logAudit(admin.id, "account.credit_terms_updated", "account", accountId, terms);
  revalidatePath("/admin/accounts");
  return { success: "Αποθηκεύτηκε." };
}

/** Bound to `.bind(null, accountId)` — the country decides whether Greek VAT is charged. */
export async function updateAccountCountryAction(accountId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("accounts.manage");
  const country = String(formData.get("country") ?? "").trim().toUpperCase();
  if (!isKnownCountry(country)) return { error: "Διάλεξε χώρα από τη λίστα." };
  await updateAccountCountry(accountId, country);
  await logAudit(admin.id, "account.country_updated", "account", accountId, country);
  revalidatePath("/admin/accounts");
  return {
    success: country === "GR" ? "Country saved — this buyer is charged Greek VAT." : "Country saved — this buyer is invoiced without Greek VAT.",
  };
}

/** Bound to `.bind(null, accountId)` — a <form action> per account row's credit-limit input. */
export async function updateAccountCreditLimitAction(accountId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("accounts.manage");
  const creditLimit = Number(formData.get("creditLimit") ?? 0);
  if (!Number.isFinite(creditLimit) || creditLimit < 0 || creditLimit > 10_000_000) return { error: "Το όριο πίστωσης πρέπει να είναι από 0 € έως 10.000.000 €." };
  await updateAccountCreditLimit(accountId, creditLimit);
  await logAudit(admin.id, "account.credit_limit_updated", "account", accountId, String(creditLimit));
  revalidatePath("/admin/accounts");
  return { success: "Αποθηκεύτηκε." };
}

/** Bound to `.bind(null, accountId)` — a <form action> per account row's rep select. */
export async function updateAccountRepAction(accountId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("accounts.manage");
  const repId = String(formData.get("repId") ?? "").trim();
  await updateAccountRep(accountId, repId || null);
  await logAudit(admin.id, "account.rep_updated", "account", accountId, repId || "unassigned");
  revalidatePath("/admin/accounts");
  return { success: "Αποθηκεύτηκε." };
}

/** Bound to `.bind(null, repId)` — a <form action> per sales-rep row on /admin/sales-reps. */
export async function updateSalesRepAction(repId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("accounts.manage");
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const initials = String(formData.get("initials") ?? "").trim();
  const territory = String(formData.get("territory") ?? "").trim();
  if (!name || !email) return { error: "Συμπλήρωσε όνομα και email." };
  await updateSalesRep(repId, { name, title, email, phone, initials, territory });
  await logAudit(admin.id, "sales_rep.updated", "sales_rep", repId, name);
  revalidatePath("/admin/sales-reps");
  revalidatePath("/admin/accounts");
  return { success: "Αποθηκεύτηκε." };
}

export async function createSalesRepAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("accounts.manage");
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const initials = String(formData.get("initials") ?? "").trim();
  const territory = String(formData.get("territory") ?? "").trim();
  if (!name || !email) return { error: "Συμπλήρωσε όνομα και email." };
  const rep = await createSalesRep({ name, title, email, phone, initials: initials || name.slice(0, 2).toUpperCase(), territory });
  await logAudit(admin.id, "sales_rep.created", "sales_rep", rep.id, name);
  revalidatePath("/admin/sales-reps");
  return { success: "Ο εκπρόσωπος προστέθηκε." };
}

/** Bound to `.bind(null, repId)` — uses useActionState so a "rep still assigned" error can surface inline. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by useActionState, neither param is needed
export async function deleteSalesRepAction(repId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  const admin = await requirePermission("accounts.manage");
  const result = await deleteSalesRep(repId);
  if (result.error) return { error: result.error };
  await logAudit(admin.id, "sales_rep.deleted", "sales_rep", repId);
  revalidatePath("/admin/sales-reps");
  return { success: "Ο εκπρόσωπος αφαιρέθηκε." };
}

export async function updateHomepageHeroAction(formData: FormData) {
  await requirePermission("content.manage");
  await updateHomepageHero({
    eyebrow: String(formData.get("eyebrow") ?? ""),
    heading: String(formData.get("heading") ?? "").replace(/\r\n/g, "\n"),
    body: String(formData.get("body") ?? ""),
    primaryCtaLabel: String(formData.get("primaryCtaLabel") ?? ""),
    primaryCtaHref: String(formData.get("primaryCtaHref") ?? ""),
    secondaryCtaLabel: String(formData.get("secondaryCtaLabel") ?? ""),
    secondaryCtaHref: String(formData.get("secondaryCtaHref") ?? ""),
    // Same \r\n normalisation as the English heading — the heading is newline-separated
    // and rendered as <br />, so a browser's CRLF would produce a stray blank line.
    eyebrowEl: String(formData.get("eyebrowEl") ?? ""),
    headingEl: String(formData.get("headingEl") ?? "").replace(/\r\n/g, "\n"),
    bodyEl: String(formData.get("bodyEl") ?? ""),
    primaryCtaLabelEl: String(formData.get("primaryCtaLabelEl") ?? ""),
    secondaryCtaLabelEl: String(formData.get("secondaryCtaLabelEl") ?? ""),
    announcementEnabled: formData.get("announcementEnabled") === "on",
    orderPulseEnabled: formData.get("orderPulseEnabled") === "on",
    announcementText: String(formData.get("announcementText") ?? ""),
    announcementTextEl: String(formData.get("announcementTextEl") ?? ""),
    announcementHref: String(formData.get("announcementHref") ?? ""),
    announcementColor: formData.get("announcementColor") === "burgundy" ? "burgundy" : "black",
    whatsappClosingNote: String(formData.get("whatsappClosingNote") ?? ""),
    productionLeadTimeDays: Math.max(1, Number(formData.get("productionLeadTimeDays")) || 40),
  });
  invalidateCache(CACHE_TAGS.siteContent);
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function updateSeasonSettingsAction(formData: FormData) {
  await requirePermission("content.manage");
  // Names only: opening and closing a season has its own control, setSeasonOpenAction.
  const current = await getSeasonSettings();
  await updateSeasonSettings({
    summer: {
      enabled: current.summer.enabled,
      label: String(formData.get("summerLabel") ?? "").trim() || "Summer",
    },
    winter: {
      enabled: current.winter.enabled,
      label: String(formData.get("winterLabel") ?? "").trim() || "Winter",
    },
  });
  afterSeasonChange();
}

/**
 * Opens or closes a season for orders. A closed season's styles leave every buyer-facing list
 * and can't be ordered; all-season styles stay. Refuses to close the last open season: with
 * both off the shop would have nothing to sell, so `getEnabledSeasons` would show everything.
 */
export async function setSeasonOpenAction(season: Season, open: boolean) {
  const admin = await requirePermission("content.manage");
  const current = await getSeasonSettings();
  const other: Season = season === "summer" ? "winter" : "summer";
  if (!open && !current[other].enabled) return;
  await updateSeasonSettings({
    summer: { enabled: season === "summer" ? open : current.summer.enabled, label: current.summer.label },
    winter: { enabled: season === "winter" ? open : current.winter.enabled, label: current.winter.label },
  });
  await logAudit(admin.id, open ? "season.opened" : "season.closed", "season", season);
  afterSeasonChange();
}

function afterSeasonChange() {
  invalidateCache(CACHE_TAGS.seasons);
  revalidatePath("/admin/seasons");
  revalidatePath("/");
  revalidatePath("/catalogue");
  revalidatePath("/collections");
  revalidatePath("/quick-order");
}

export async function createSeasonTeaserUploadUrlAction(season: Season, fileName: string): Promise<UploadTarget> {
  await requirePermission("content.manage");
  try {
    return await createSeasonTeaserUploadTarget(season, fileName);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not start upload." };
  }
}

export async function finalizeSeasonTeaserUploadAction(season: Season, path: string): Promise<UploadState> {
  await requirePermission("content.manage");
  try {
    await finalizeSeasonTeaserUpload(season, path);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }
  invalidateCache(CACHE_TAGS.seasons);
  revalidatePath("/admin/seasons");
  revalidatePath("/");
  return {};
}

export async function createHeroImageUploadUrlAction(fileName: string): Promise<UploadTarget> {
  await requirePermission("content.manage");
  try {
    return await createHeroImageUploadTarget(fileName);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not start upload." };
  }
}

export async function finalizeHeroImageUploadAction(path: string): Promise<UploadState> {
  await requirePermission("content.manage");
  try {
    await finalizeHeroImageUpload(path);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }
  invalidateCache(CACHE_TAGS.siteContent);
  revalidatePath("/admin/content");
  revalidatePath("/");
  return {};
}
