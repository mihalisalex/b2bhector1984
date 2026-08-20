"use server";

import { cookies } from "next/headers";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkRateLimit, formatRetryAfter, resetRateLimit } from "@/lib/rateLimit";
import { addOrder, DuplicateOrderIdError } from "@/lib/runtimeOrders";
import { generateOrderId, ORDER_ID_MAX_ATTEMPTS } from "@/lib/orderId";
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
import { insertApplication, updateApplicationStatus, getApplicationById } from "@/lib/data/applications";
import { getStylesByIds } from "@/lib/data/styles";
import {
  createPasswordResetToken,
  getValidPasswordResetAccountId,
  markPasswordResetTokenUsed,
} from "@/lib/data/passwordReset";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { formatEUR, getOrderMinimumError, getUnitPrice, MAX_BACKORDER_QTY, summarizeOrder, TERMS_LABEL, validateMatrix } from "@/lib/pricing";
import { createSavedAssortment, deleteSavedAssortment as deleteSavedAssortmentData } from "@/lib/data/assortments";
import { addFavorite, removeFavorite } from "@/lib/data/favorites";
import { decrementInventoryForOrder, restoreInventoryForLines, type StockLine } from "@/lib/data/inventory";
import { getBoxType } from "@/lib/data/boxTypes";
import { buildInvoicePdf } from "@/lib/pdf/buildInvoicePdf";
import { sendEmail, type EmailAttachment } from "@/lib/email";
import { sendWhatsAppTemplate, buildProformaInvoiceParams } from "@/lib/whatsapp";
import { getHomepageHero } from "@/lib/data/siteContent";
import {
  buildOrderConfirmationEmailBody,
  buildPasswordResetEmailBody,
  buildApplicationReceivedEmailBody,
  buildNewApplicationAdminEmailBody,
  buildNewOrderAdminEmailBody,
  newOrderAdminEmailSubject,
  orderConfirmationEmailSubject,
  PASSWORD_RESET_EMAIL_SUBJECT,
  APPLICATION_RECEIVED_EMAIL_SUBJECT,
  NEW_APPLICATION_ADMIN_EMAIL_SUBJECT,
  textToHtml,
} from "@/lib/emailTemplates";
import { SITE_URL } from "@/lib/siteUrl";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { getRequestLocale, getLocaleForAccount } from "@/i18n/requestLocale";
import { getDictionary } from "@/i18n/getDictionary";
import { t } from "@/i18n/format";
import type { Application, BoxTypeId, CreditTerms, Order, OrderLine, SavedAssortmentLine } from "@/lib/types";

/**
 * The message strings for this request, in the language of the domain it arrived on.
 *
 * Server Actions receive no route params, so before host-based routing there was nothing
 * here to read a locale from and every message in this file was hardcoded English — a
 * Greek buyer mistyping a password was told so in English. `getRequestLocale` reads the
 * Host header, which is present regardless of route shape.
 *
 * Called per action rather than memoised at module scope: this module is shared across
 * requests, and a cached dictionary would serve one visitor's language to the next.
 */
async function messages() {
  const dict = await getDictionary(await getRequestLocale());
  return dict.actions;
}

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

  // Every attempt counts, but a successful sign-in clears the window below — so the only
  // way to reach the cap is to actually fail 10 times in 15 minutes, and a buyer who
  // mistypes their password a few times is never locked out of their own account.
  const limited = await checkRateLimit("login", { limit: 10, windowMs: 15 * 60_000 });
  if (!limited.allowed) {
    return { error: `Too many sign-in attempts. Try again in ${formatRetryAfter(limited.retryAfterSeconds)}.` };
  }

  const account = await getAccountByEmail(email);
  // Always run a full password verification, even when no account matched, so the
  // response time doesn't reveal whether the email is registered. Short-circuiting on a
  // missing account would return before scrypt runs, and that measurable gap defeats the
  // deliberately generic error message below.
  const passwordOk = account
    ? await verifyPassword(password, account.password)
    : await verifyPassword(password, DUMMY_PASSWORD_HASH);
  if (!account || !passwordOk) {
    return { error: (await messages()).loginFailed };
  }
  if (account.status !== "active") {
    return { error: (await messages()).accountNotActivated };
  }

  // Cleared before the redirect below, which throws — a genuine sign-in shouldn't leave
  // earlier mistyped attempts counting against this client.
  await resetRateLimit("login");

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
  const m = await messages();
  const genericSuccess: FormState = { success: m.resetLinkSent };
  if (!email) return { error: m.enterAccountEmail };

  // This endpoint sends mail to an address the caller supplies, so it is an email-bombing
  // tool if left unbounded. The cap is per-IP and independent of the email submitted, so
  // this message reveals nothing about which addresses have accounts — the generic-success
  // contract above is preserved.
  const limited = await checkRateLimit("password-reset", { limit: 5, windowMs: 15 * 60_000 });
  if (!limited.allowed) {
    return { error: `Too many reset requests. Try again in ${formatRetryAfter(limited.retryAfterSeconds)}.` };
  }

  try {
    const account = await getAccountByEmail(email);
    if (account && account.status === "active") {
      const token = await createPasswordResetToken(account.id);
      const resetUrl = `${SITE_URL}/reset-password/${token}`;
      await sendEmail({
        to: account.email,
        subject: PASSWORD_RESET_EMAIL_SUBJECT,
        html: textToHtml(buildPasswordResetEmailBody(resetUrl, account.contactName), PASSWORD_RESET_EMAIL_SUBJECT),
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
  const m = await messages();
  if (password !== confirmPassword) return { error: m.passwordsDontMatch };

  const invalidTokenError = { error: m.resetLinkInvalid };
  try {
    const accountId = await getValidPasswordResetAccountId(token);
    if (!accountId) return invalidTokenError;

    await updateAccountPasswordData(accountId, await hashPassword(password));
    await markPasswordResetTokenUsed(token);
    // A reset is the "I may be compromised" path — drop every existing session so an
    // attacker holding one can't outlive the password that let them in.
    await destroyAllSessionsForAccount(accountId);
    return { done: true, success: m.passwordUpdatedSignIn };
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
  // Writes a row and notifies the admin on every call — unbounded, it's a spam funnel into
  // the applications queue. A real wholesale buyer applies once.
  const limited = await checkRateLimit("apply", { limit: 5, windowMs: 60 * 60_000 });
  if (!limited.allowed) {
    return { error: `Too many applications from this connection. Try again in ${formatRetryAfter(limited.retryAfterSeconds)}.` };
  }

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
  const m = await messages();
  for (const field of required) {
    if (!String(formData.get(field) ?? "").trim()) {
      return { error: m.requiredFieldsMissing };
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formData.get("email") ?? "").trim())) {
    return { error: m.invalidEmail };
  }

  const application: Omit<Application, "id" | "status" | "submittedAt" | "repId" | "priceMultiplier"> = {
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

  // Best-effort notifications — sendEmail never throws, so a Resend outage
  // can't block the applicant's redirect to the pending-review page.
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: NEW_APPLICATION_ADMIN_EMAIL_SUBJECT,
      html: textToHtml(buildNewApplicationAdminEmailBody(application), NEW_APPLICATION_ADMIN_EMAIL_SUBJECT),
    });
  } else {
    console.warn("[email] ADMIN_EMAIL not set — skipping new-application admin notification");
  }
  await sendEmail({
    to: application.email,
    subject: APPLICATION_RECEIVED_EMAIL_SUBJECT,
    html: textToHtml(buildApplicationReceivedEmailBody(application.contactName), APPLICATION_RECEIVED_EMAIL_SUBJECT),
  });

  await setApplicationCookie(id, APPLICATION_MAX_AGE);
  redirect("/apply/pending");
}

/** Approved -> active: the buyer sets their own password, provisions the account, and signs them in.
 * The form carries the application id as a hidden field (see ActivateAccountForm) so this works
 * from the "activate now" email link on any browser, not just the one that originally applied —
 * falls back to the `hector_application` cookie for the same-browser case with no id posted. */
export async function activateAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const explicitId = String(formData.get("applicationId") ?? "").trim();
  const application = explicitId ? ((await getApplicationById(explicitId)) ?? null) : await getApplication();
  if (!application || application.status !== "approved") redirect("/apply/pending");

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  const m = await messages();
  if (password !== confirmPassword) return { error: m.passwordsDontMatch };

  // Activation links are long-lived and land in an inbox, so the same one genuinely does get
  // clicked twice. `accounts.email` is unique, so the second attempt used to throw out of
  // `createAccount` uncaught — a 500/error boundary instead of an explanation. Check first,
  // and say something useful.
  if (await getAccountByEmail(application.email)) {
    return { error: m.accountAlreadyExists };
  }

  const id = `acct-${crypto.randomUUID().slice(0, 8)}`;
  try {
    await createAccount({
      id,
      businessName: application.businessName,
      contactName: application.contactName,
      email: application.email,
      phone: application.phone,
      password: await hashPassword(password),
      status: "active",
      creditTerms: "prepay",
      creditLimit: 5000,
      resaleCertId: application.resaleCertId,
      businessType: application.businessType,
      storeLocation: application.storeLocation,
      expectedVolume: application.expectedVolume,
      appliedAt: application.submittedAt,
      approvedAt: new Date().toISOString(),
      // Decided by the admin back at approval time (see `approveApplicationWithAssignment`
      // and `AdminApplicationsList`'s rep-select/multiplier row) — carried onto the account
      // now rather than re-asked at activation, which the applicant has no reason to see.
      repId: application.repId,
      priceMultiplier: application.priceMultiplier,
      shipTo: {
        label: application.businessName,
        line1: application.addressLine1,
        city: application.city,
        state: application.state,
        zip: application.zip,
      },
    });
  } catch (err) {
    // Covers the email-uniqueness race (two tabs activating at once) and any DB failure.
    console.error(`[activateAccount] failed to provision account for application ${application.id}:`, err);
    return { error: t(m.activationFailed, { email: SUPPORT_EMAIL }) };
  }

  // `"approved"`, not the default `"pending"` — this is the transition that was silently
  // failing and leaving every onboarded buyer stuck at "approved" in the admin list.
  await updateApplicationStatus(application.id, "active", "approved");

  const token = await createSession(id);
  await setSessionCookie(token);
  const store = await cookies();
  store.delete(APPLICATION_COOKIE);
  redirect("/dashboard");
}

export interface CheckoutState extends FormState {
  orderId?: string;
}

/** The three payment terms, as a parser rather than a cast — see `placeOrder`. */
const termsSchema = z.enum(["prepay", "net30", "net60"]);

const cartLineSchema = z.object({
  styleId: z.string().min(1),
  colorwayId: z.string().min(1),
  boxTypeId: z.enum(["box8", "box10", "box12"]),
  // `MAX_BACKORDER_QTY` was enforced only by the browser's quantity stepper, so a crafted
  // request could order an unbounded number of boxes of any backorder-enabled style —
  // which is every style in the catalogue.
  qty: z.number().int().positive().max(MAX_BACKORDER_QTY),
});
const cartLinesSchema = z.array(cartLineSchema);

/** Looser than `cartLineSchema` on purpose: a saved assortment may predate line-item
 * detail (migration 0021), so colorway/box are optional here — see SavedAssortmentLine. */
const assortmentLinesSchema = z.array(
  z.object({
    styleId: z.string().min(1),
    colorwayId: z.string().min(1).optional(),
    boxTypeId: z.enum(["box8", "box10", "box12"]).optional(),
    qty: z.number().int().positive(),
  }),
);

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  // Prefer the buyer's own stored language over the domain this request happened to arrive
  // on — an order placed from a shared machine still belongs to their account.
  const dict = await getDictionary(await getLocaleForAccount(account.locale));
  const m = dict.actions;

  let cartLines: z.infer<typeof cartLinesSchema>;
  try {
    cartLines = cartLinesSchema.parse(JSON.parse(String(formData.get("lines") ?? "[]")));
  } catch {
    return { error: m.cartInvalid };
  }
  if (cartLines.length === 0) return { error: m.cartEmpty };

  const shipToId = String(formData.get("shipToId") ?? "");
  if (!account.shipTo.some((s) => s.id === shipToId)) return { error: m.selectShipTo };

  // Parsed, not cast. A buyer choosing their own terms is deliberate (it routes the order
  // to a rep for credit approval), but the value was previously trusted verbatim: anything
  // outside the enum made `TERMS_DISCOUNT[terms]` undefined, so every unit price became
  // NaN. It failed safe on the `orders.terms` check constraint, but only after the stock
  // decrement, and the buyer got the generic "something went wrong" for a bad request.
  const parsedTerms = termsSchema.safeParse(String(formData.get("terms") ?? account.creditTerms));
  if (!parsedTerms.success) return { error: m.selectPaymentTerms };
  const terms: CreditTerms = parsedTerms.data;
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
        if (qty && qty > 0) {
          // "stock" is a starting assumption, corrected below once the actual stock
          // check runs — every line needs a value here since `fulfillment` isn't optional.
          orderLines.push({ styleId, colorwayId, boxTypeId: boxTypeId as BoxTypeId, qty, unitPrice, vatRate, fulfillment: "stock" });
        }
      }
    }
  }

  const minimumError = getOrderMinimumError(totalPairs, account.minOrderPairs);
  if (minimumError) return { error: minimumError };

  // No automatic credit-limit gate here (removed 2026-08-10) — every order already routes
  // through a rep as a proforma-invoice request before anything is confirmed (see the
  // "isn't a charge" copy on the checkout button), so an automated hard block at submission
  // time fought against that conversation rather than supporting it. `creditLimit` stays on
  // the account as an admin reference/tracking field; it just isn't enforced here anymore.
  const { total: orderTotal, vatTotal: orderVat, grandTotal: orderGrandTotal } = summarizeOrder({ lines: orderLines });

  // Lines whose full quantity isn't on hand fall back to production instead of failing,
  // as long as the style allows it (`allowBackorder` — on by default, admin can opt a
  // style out). Fetched once here, ahead of the stock check, so the ETA it feeds and the
  // WhatsApp closing note later both read the same site-wide lead-time setting.
  const hero = await getHomepageHero();
  const stockLines: StockLine[] = orderLines.map((line) => ({
    styleId: line.styleId,
    colorwayId: line.colorwayId,
    boxTypeId: line.boxTypeId,
    qty: line.qty,
    allowBackorder: styleById.get(line.styleId)?.allowBackorder ?? false,
  }));
  const stockResult = await decrementInventoryForOrder(stockLines);
  if (!stockResult.ok) {
    const style = styleById.get(stockResult.failedLine.styleId);
    // Derived from the box-type registry rather than a hard-coded id->label map, which
    // would silently go stale if a box size were ever added or resized.
    const boxLabel = `${getBoxType(stockResult.failedLine.boxTypeId).totalPairs}-pair`;
    return {
      error: `Not enough stock for ${style?.name ?? "that style"} (${boxLabel} box) to cover this order. Reduce the quantity or contact ${account.rep.name}.`,
    };
  }

  const productionEta = new Date(Date.now() + hero.productionLeadTimeDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  stockResult.fulfillments.forEach((fulfillment, i) => {
    orderLines[i].fulfillment = fulfillment;
    // A pre-order style intentionally gets no ETA here — timing isn't fixed, it's
    // confirmed with the buyer once production is scheduled. Only "made to order"
    // (the default) stamps the site-wide lead time as a concrete date.
    if (fulfillment === "production" && styleById.get(orderLines[i].styleId)?.backorderMode !== "pre_order") {
      orderLines[i].productionEta = productionEta;
    }
  });
  const hasMadeToOrderLines = orderLines.some(
    (l) => l.fulfillment === "production" && l.productionEta !== undefined,
  );
  const hasPreOrderLines = orderLines.some(
    (l) => l.fulfillment === "production" && l.productionEta === undefined,
  );

  const placedAt = new Date();
  const order: Order = {
    id: generateOrderId(placedAt),
    placedAt: placedAt.toISOString(),
    status: "submitted",
    terms,
    shipToId,
    notes,
    lines: orderLines,
  };

  // Inventory was already decremented above, but the order row doesn't exist yet — those
  // are two separate writes with no shared transaction. If this insert fails (a bad
  // ship-to FK, a DB blip), the stock is gone with no order to show for it, so put it back
  // before surfacing the error. Only the lines that actually came off the shelf are
  // restored; `"production"` lines never touched `on_hand` in the first place.
  //
  // Scoped tightly to `addOrder` on purpose: `redirect()` further down signals success by
  // *throwing* (NEXT_REDIRECT), so widening this catch would roll back completed orders.
  //
  // The one error worth retrying rather than reporting is a duplicate order id: ids carry
  // a random tail (see orderId.ts) so a second attempt gets a different one, and nothing
  // was written when `DuplicateOrderIdError` is thrown. A buyer should never see a failed
  // checkout over a number collision.
  for (let attempt = 1; ; attempt += 1) {
    try {
      await addOrder(account.id, order);
      break;
    } catch (err) {
      if (err instanceof DuplicateOrderIdError && attempt < ORDER_ID_MAX_ATTEMPTS) {
        console.warn(`[checkout] order id ${order.id} was taken (attempt ${attempt}) — retrying with a new one`);
        order.id = generateOrderId(placedAt);
        continue;
      }
      const decremented = stockLines.filter((_, i) => stockResult.fulfillments[i] === "stock");
      await restoreInventoryForLines(decremented);
      console.error(`[checkout] order ${order.id} failed to save; inventory restored:`, err);
      return {
        error: `Something went wrong saving your order, so nothing was charged or reserved. Please try again, or contact ${account.rep.name} if it keeps happening.`,
      };
    }
  }

  // Best-effort, same posture as the email/WhatsApp sends below: a buyer's order is
  // fully placed the moment addOrder() above returns, so nothing past this point may
  // ever fail the checkout. A photo that 404s or is in a format react-pdf's <Image>
  // can't decode fails the whole render (see buildInvoicePdf's doc comment), which
  // would otherwise take the confirmation email down with it — so on any failure here,
  // the buyer still gets their confirmation, just without the PDF attached.
  // Everything from here to the redirect is post-commit follow-up: the order is already in
  // the database, and none of it changes what the buyer sees on the confirmation page. It
  // used to be awaited inline, which put a PDF render plus two sequential Resend calls on
  // the critical path — measured at 5.7s for `POST /checkout`, of which `placeOrder` was
  // 3.3s. `after()` runs it once the response has been sent, so the buyer lands on their
  // order immediately and the emails follow a moment later.
  after(async () => {
    let invoiceAttachment: EmailAttachment | undefined;
    try {
      const shipTo = account.shipTo.find((s) => s.id === shipToId);
      const pdfBuffer = await buildInvoicePdf({
        order: { id: order.id, placedAt: order.placedAt, status: order.status, terms: order.terms },
        businessName: account.businessName,
        contactName: account.contactName,
        shipTo,
        lines: orderLines,
        styleById,
      });
      invoiceAttachment = {
        filename: `${order.id}-proforma-invoice.pdf`,
        contentBase64: pdfBuffer.toString("base64"),
        contentType: "application/pdf",
      };
    } catch (err) {
      console.error(`[checkout] Failed to build invoice PDF for ${order.id} — confirmation email will go out without it:`, err);
    }
  
    const confirmationSubject = orderConfirmationEmailSubject(order);
    await sendEmail({
      to: account.email,
      subject: confirmationSubject,
      html: textToHtml(
        buildOrderConfirmationEmailBody(
          order,
          account.contactName,
          hasMadeToOrderLines ? hero.productionLeadTimeDays : undefined,
          hasPreOrderLines,
          invoiceAttachment !== undefined,
        ),
        confirmationSubject,
      ),
        attachments: invoiceAttachment ? [invoiceAttachment] : undefined,
    });
  
    // Tell the business it has an order. Without this an order sits unseen in the dashboard
    // until someone happens to log in — the same gap the new-application notification above
    // already closes, which is why this reuses that pattern exactly (ADMIN_EMAIL env var,
    // warn-and-continue when unset).
    //
    // Safe to await: sendEmail never throws (failures are logged inside it), so a bounced
    // notification can't fail a checkout that has already been written to the database.
    // Reuses the same `invoiceAttachment` buffer as the buyer's copy rather than rebuilding
    // the PDF — it may be undefined if generation failed, which the body accounts for.
    const adminOrderEmail = process.env.ADMIN_EMAIL;
    if (adminOrderEmail) {
      const adminSubject = newOrderAdminEmailSubject({ orderId: order.id, businessName: account.businessName });
      await sendEmail({
        to: adminOrderEmail,
        subject: adminSubject,
        html: textToHtml(
          buildNewOrderAdminEmailBody({
            orderId: order.id,
            businessName: account.businessName,
            contactName: account.contactName,
            email: account.email,
            totalPairs,
            grandTotal: formatEUR(orderGrandTotal),
            terms: TERMS_LABEL[terms] ?? terms,
            hasMadeToOrderLines,
            hasPreOrderLines,
            attachedInvoice: invoiceAttachment !== undefined,
          }),
          adminSubject,
        ),
        attachments: invoiceAttachment ? [invoiceAttachment] : undefined,
      });
    } else {
      console.warn(`[email] ADMIN_EMAIL not set — skipping new-order admin notification for ${order.id}`);
    }
  
    // WhatsApp notification for the proforma invoice request — no-ops safely
    // (with a console warning) until both WHATSAPP_* env vars are set AND the
    // buyer has a phone on file. Never blocks or fails the order: a redirect
    // to the order confirmation page happens regardless of whether this send
    // succeeded, exactly like the email above.
    if (account.phone) {
      const productionNote = [
        hasMadeToOrderLines
          ? `Some items in this order are made to order and will ship in about ${hero.productionLeadTimeDays} days. `
          : "",
        hasPreOrderLines ? "Some items are on pre-order — we'll confirm ship timing once production is scheduled. " : "",
      ].join("");
      await sendWhatsAppTemplate({
        to: account.phone,
        params: buildProformaInvoiceParams({
          contactName: account.contactName,
          orderId: order.id,
          totalPairs,
          subtotal: formatEUR(orderTotal),
          vatAmount: formatEUR(orderVat),
          grandTotal: formatEUR(orderGrandTotal),
          extraNote: productionNote + hero.whatsappClosingNote,
        }),
      });
    } else {
      console.warn(`[whatsapp] Account ${account.id} has no phone on file — skipping proforma invoice notification.`);
    }
  });

  redirect(`/dashboard/orders/${order.id}?justPlaced=1`);
}

export async function updateAccountProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const businessName = String(formData.get("businessName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const m = (await getDictionary(await getLocaleForAccount(account.locale))).actions;
  if (!businessName || !contactName || !email) {
    return { error: m.profileFieldsRequired };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: m.invalidEmail };
  }
  // Loose on purpose — phone formats vary a lot by country. Just enough to
  // catch an obvious typo; digits-only normalization happens at WhatsApp-send time.
  if (phone && phone.replace(/\D/g, "").length < 7) {
    return { error: m.invalidPhone };
  }

  const result = await updateAccountContact(account.id, { businessName, contactName, email, phone: phone || undefined });
  if (result.error) return { error: result.error };

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard");
  return { success: m.profileUpdated };
}

export async function updateAccountPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const m = (await getDictionary(await getLocaleForAccount(account.locale))).actions;
  if (!(await verifyPassword(currentPassword, account.password))) return { error: m.currentPasswordIncorrect };
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (newPassword !== confirmPassword) return { error: m.newPasswordMismatch };

  await updateAccountPasswordData(account.id, await hashPassword(newPassword));
  // Revoke other sessions, then re-issue one for this device so the user isn't signed out
  // of the tab they just changed their password in.
  await destroyAllSessionsForAccount(account.id);
  await setSessionCookie(await createSession(account.id));
  revalidatePath("/dashboard/account");
  return { success: m.passwordUpdated };
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

  const m = (await getDictionary(await getLocaleForAccount(account.locale))).actions;
  if (!label || !line1 || !city || !state || !zip) {
    return { error: m.addressFieldsRequired };
  }

  await insertShipToAddress(account.id, { label, line1, line2: line2 || undefined, city, state, zip, isDefault });
  revalidatePath("/dashboard/account");
  return { success: m.addressAdded };
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

  const m = (await getDictionary(await getLocaleForAccount(account.locale))).actions;
  if (!shipToId || !account.shipTo.some((s) => s.id === shipToId)) return { error: m.addressNotFound };
  if (!label || !line1 || !city || !state || !zip) {
    return { error: m.addressFieldsRequired };
  }

  await updateShipToAddressRow(account.id, shipToId, { label, line1, line2: line2 || undefined, city, state, zip });
  revalidatePath("/dashboard/account");
  return { success: m.addressUpdated };
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
  // Same treatment as placeOrder's cart lines: this is a server action, so the payload is
  // an untrusted HTTP body, not just whatever SaveAssortmentButton happens to send. It was
  // previously a bare JSON.parse plus an unchecked cast — malformed JSON threw an
  // unhandled error (a 500 rather than a message), and a well-formed but wrong-shaped body
  // went straight through to the insert.
  const m = (await getDictionary(await getLocaleForAccount(account.locale))).actions;
  let lines: SavedAssortmentLine[];
  try {
    lines = assortmentLinesSchema.parse(JSON.parse(String(formData.get("lines") ?? "[]")));
  } catch {
    return { error: m.assortmentInvalid };
  }
  if (!name) return { error: m.assortmentNeedsName };
  if (lines.length === 0) return { error: m.assortmentNeedsStyle };

  await createSavedAssortment(account.id, name, lines);
  revalidatePath("/dashboard/assortments");
  return { success: m.assortmentSaved };
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
