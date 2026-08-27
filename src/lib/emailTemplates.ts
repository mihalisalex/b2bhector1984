import { t } from "@/i18n/format";
import { greekVocative } from "@/i18n/greek";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * Transactional email bodies.
 *
 * Every buyer-facing builder now takes the recipient's dictionary. The locale comes from
 * `accounts.locale` (migration 0037) rather than the request's domain — an order
 * confirmation is frequently sent from a background path where there is no request to read,
 * and a buyer's own language is the right answer even when there is one. See
 * `getLocaleForAccount` in src/i18n/requestLocale.ts.
 *
 * The two ADMIN notifications below take no dictionary and stay English on purpose: they go
 * to the business's own inbox, and the admin side of this app is English-only.
 */

type EmailDict = Dictionary["email"];

/**
 * "Hi Maria," / "Γεια σας Μαρία," — and the no-name case.
 *
 * English falls back to "Hi there,". Greek has no equivalent filler that reads naturally, so
 * `fallbackName` is empty there and the comma is cleaned up rather than left dangling after
 * a blank. Handled here so no template has to know.
 */
/**
 * Builds the salutation, letting each language ask for the form of the name it needs.
 *
 * The greeting string chooses its own placeholder: `{name}` for the plain nominative, or
 * `{vocative}` for the inflected address form. Greek uses the latter — "Γεια σας Γιάννης"
 * is wrong, it must be "Γεια σας Γιάννη" (see src/i18n/greek.ts). English uses `{name}`,
 * so an English email to a Greek buyer does not apply Greek grammar inside an English
 * sentence. Which form a language wants is a property of that language, so the dictionary
 * is the right place for it to be declared rather than a branch in here.
 */
function greet(dict: EmailDict, contactName: string): string {
  const raw = contactName.split(" ")[0] || "";
  const name = raw || dict.fallbackName;
  const line = t(dict.greeting, { name, vocative: raw ? greekVocative(raw) : dict.fallbackName });
  // With no name at all, Greek has no natural filler ("Hi there" has no equivalent), so
  // `fallbackName` is empty there and this tidies up the space the placeholder left behind.
  return raw ? line : line.replace(/\s+,/, ",");
}

function statusLabel(dict: EmailDict, status: string): string {
  const map: Record<string, string> = {
    submitted: dict.statusSubmitted,
    confirmed: dict.statusConfirmed,
    in_production: dict.statusInProduction,
    shipped: dict.statusShipped,
    delivered: dict.statusDelivered,
  };
  return map[status] ?? status;
}

/** Shared with the admin order page's manual mailto compose panel (EmailBuyerPanel) default body. */
export function buildOrderStatusEmailBody(
  dict: EmailDict,
  order: { id: string; status: string },
  contactName: string,
): string {
  const body = t(dict.orderStatusBody, { id: order.id, status: statusLabel(dict, order.status) });
  return `${greet(dict, contactName)}\n\n${body}\n\n\n\n${dict.signoff}`;
}

/**
 * `madeToOrderLeadTimeDays` is only passed when the order includes at least one line that
 * wasn't fully covered by on-hand stock and whose style is in "made to order" mode (a fixed
 * ETA). `hasPreOrderLines` flags lines in "pre-order" mode instead — no fixed ETA, timing
 * confirmed later. `attachedInvoice` reflects whether the proforma PDF actually made it onto
 * this send — PDF generation is best-effort (see placeOrder), so the body must not claim an
 * attachment exists when it doesn't. All three are independently omittable/false to get the
 * plain confirmation body for an all-in-stock order with no PDF.
 */
export function buildOrderConfirmationEmailBody(
  dict: EmailDict,
  order: { id: string },
  contactName: string,
  madeToOrderLeadTimeDays?: number,
  hasPreOrderLines = false,
  attachedInvoice = false,
): string {
  const notes: string[] = [];
  if (attachedInvoice) notes.push(dict.invoiceAttached);
  if (madeToOrderLeadTimeDays) {
    notes.push(t(dict.madeToOrderNote, { days: madeToOrderLeadTimeDays }));
  }
  if (hasPreOrderLines) notes.push(dict.preOrderNote);
  if (madeToOrderLeadTimeDays || hasPreOrderLines) notes.push(dict.inStockShipsNote);
  const productionNote = notes.length > 0 ? ` ${notes.join(" ")}` : "";
  const body = t(dict.orderConfirmationBody, { id: order.id });
  return `${greet(dict, contactName)}\n\n${body}${productionNote}\n\n${dict.signoff}`;
}

export function orderStatusEmailSubject(dict: EmailDict, order: { id: string; status: string }): string {
  return t(dict.orderStatusSubject, { id: order.id, status: statusLabel(dict, order.status) });
}

export function orderConfirmationEmailSubject(dict: EmailDict, order: { id: string }): string {
  return t(dict.orderConfirmationSubject, { id: order.id });
}

/**
 * `rep` is omitted when the admin approved without assigning one (still allowed — rep can
 * be set later from /admin/accounts) or the assigned rep has since been deleted; the email
 * reads fine either way, it just doesn't name a contact. `rep.name` is already the sales
 * rep's full name (first + last, one field — see `AdminSalesRep`), not just a given name.
 */
export function buildApplicationApprovedEmailBody(
  dict: EmailDict,
  contactName: string,
  activationUrl: string,
  rep?: { name: string; phone?: string },
): string {
  // Name the rep either way; only promise a number when there is one to call.
  const repLine = rep
    ? `\n\n${rep.phone ? t(dict.repLineWithPhone, { name: rep.name, phone: rep.phone }) : t(dict.repLine, { name: rep.name })}`
    : "";
  return `${greet(dict, contactName)}\n\n${dict.approvedBody}\n\n${activationUrl}${repLine}\n\n${dict.signoff}`;
}

export function buildApplicationDeclinedEmailBody(dict: EmailDict, contactName: string): string {
  return `${greet(dict, contactName)}\n\n${dict.declinedBody}\n\n${dict.signoff}`;
}

/** Sent to the applicant the moment they submit — distinct from
 * `buildApplicationApprovedEmailBody`/`buildApplicationDeclinedEmailBody`, which fire later
 * once an admin actually decides. This one just confirms receipt. */
export function buildApplicationReceivedEmailBody(dict: EmailDict, contactName: string): string {
  return `${greet(dict, contactName)}\n\n${dict.receivedBody}\n\n${dict.signoff}`;
}

export function buildPasswordResetEmailBody(dict: EmailDict, resetUrl: string, contactName: string): string {
  return `${greet(dict, contactName)}\n\n${dict.passwordResetBody}\n\n${resetUrl}\n\n${dict.passwordResetIgnore}\n\n${dict.signoff}`;
}

// ---------------------------------------------------------------------------
// Admin notifications — English only, by design. These go to the business's own
// inbox, not to a buyer.
// ---------------------------------------------------------------------------

/** Sent to the business's own inbox (ADMIN_EMAIL) so a new application doesn't sit
 * unnoticed in the admin dashboard between visits. */
export function buildNewApplicationAdminEmailBody(application: {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  storeLocation: string;
  expectedVolume: string;
}): string {
  return `You got a new wholesale application.\n\nBusiness: ${application.businessName}\nContact: ${application.contactName}\nEmail: ${application.email}\nPhone: ${application.phone}\nLocation: ${application.storeLocation}\nExpected volume: ${application.expectedVolume}\n\nReview it in the admin dashboard: Applications.`;
}

export const NEW_APPLICATION_ADMIN_EMAIL_SUBJECT = "You got a new wholesale application";

/**
 * Sent to the business's own inbox (ADMIN_EMAIL) the moment a buyer checks out, so an order
 * doesn't sit unseen in the dashboard until someone happens to log in. Sibling of the
 * new-application notification above, and deliberately the same shape: the figures that
 * decide whether it needs attention now, then where to go.
 *
 * `productionNote` is only present when the order can't ship entirely from stock — that's
 * the case where the buyer is waiting on a confirmation from you, so it's worth surfacing
 * in the subject-adjacent body rather than leaving it to be discovered in the PDF.
 */
export function buildNewOrderAdminEmailBody(input: {
  orderId: string;
  businessName: string;
  contactName: string;
  email: string;
  totalPairs: number;
  grandTotal: string;
  terms: string;
  hasMadeToOrderLines: boolean;
  hasPreOrderLines: boolean;
  attachedInvoice: boolean;
}): string {
  const flags: string[] = [];
  if (input.hasMadeToOrderLines) flags.push("some lines are made to order");
  if (input.hasPreOrderLines) flags.push("some lines are pre-order");
  const productionNote = flags.length > 0 ? `\n\nNeeds confirming: ${flags.join(", ")}.` : "";
  const invoiceNote = input.attachedInvoice ? "\n\nThe buyer's proforma invoice is attached." : "";
  return `You got a new order.\n\nOrder: ${input.orderId}\nBusiness: ${input.businessName}\nContact: ${input.contactName}\nEmail: ${input.email}\nPairs: ${input.totalPairs}\nTotal: ${input.grandTotal} incl. VAT\nTerms: ${input.terms}${productionNote}${invoiceNote}\n\nOpen it in the admin dashboard: Orders → ${input.orderId}.`;
}

export function newOrderAdminEmailSubject(input: { orderId: string; businessName: string }): string {
  return `New order ${input.orderId} — ${input.businessName}`;
}

/**
 * Plain-text body -> a branded HTML email (the mailto panel keeps using the plain text
 * as-is; only the real Resend send goes through here). Every `sendEmail()` call in this
 * app routes its body through this one function, so the branded shell, XSS-safe escaping,
 * and link-to-button treatment all apply everywhere for free — no per-template HTML to
 * maintain, and no template can forget to escape user-submitted text (application
 * business names etc. reach here unescaped from a public form).
 *
 * A line that is *only* a bare URL (the shape every current template already uses for its
 * one call-to-action link, e.g. the password reset/activation URL on its own line) renders
 * as a solid button instead of a plain paragraph; everything else renders as a paragraph.
 *
 * `dict` is optional: the admin notifications have none and correctly render the English
 * shell. `lang` sets the document's language so a screen reader and Gmail's translate
 * prompt both read the mail correctly.
 */
export function textToHtml(text: string, subject: string, dict?: EmailDict, lang = "en"): string {
  const esc = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const eyebrow = dict?.shellEyebrow ?? "Wholesale Portal";
  const buttonLabel = dict?.shellButton ?? "Continue →";
  const footer1 = dict?.shellFooterLine1 ?? "Hector Footwear Co. — Wholesale accounts only.";
  const footer2 = dict?.shellFooterLine2 ?? "This is a transactional email about your wholesale account.";

  const bareUrl = /^https?:\/\/\S+$/;
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  const preheader = lines[0] ?? "";

  const bodyHtml = lines
    .map((line) => {
      const trimmed = line.trim();
      if (bareUrl.test(trimmed)) {
        return `
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0;">
            <tr><td style="background-color:#121212;">
              <a href="${esc(trimmed)}" style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">${esc(buttonLabel)}</a>
            </td></tr>
          </table>`;
      }
      return `<p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#333333;">${esc(line)}</p>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="${esc(lang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f0efec;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0efec;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;">
            <tr>
              <td style="background-color:#121212;padding:28px 32px;text-align:center;">
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">HECTOR</span>
                <span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;color:#c9c9c9;letter-spacing:3px;margin-left:8px;">FOOTWEAR</span>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 40px 8px 40px;">
                <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;color:#8a8a8a;letter-spacing:2px;text-transform:uppercase;">${esc(eyebrow)}</p>
                <h1 style="margin:0 0 20px 0;font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:bold;color:#121212;text-transform:uppercase;letter-spacing:0.3px;">${esc(subject)}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 32px 40px;border-top:1px solid #e5e3e0;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8a8a8a;">
                  ${esc(footer1)}<br />
                  ${esc(footer2)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
