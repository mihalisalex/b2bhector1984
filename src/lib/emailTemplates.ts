const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  confirmed: "Confirmed",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
};

/** Shared with the admin order page's manual mailto compose panel (EmailBuyerPanel) default body. */
export function buildOrderStatusEmailBody(order: { id: string; status: string }, contactName: string): string {
  const firstName = contactName.split(" ")[0] || "there";
  return `Hi ${firstName},\n\nWriting about your order ${order.id}, currently ${order.status.replace("_", " ")}.\n\n\n\nBest,\nHector Footwear Wholesale`;
}

export function buildOrderConfirmationEmailBody(order: { id: string }, contactName: string): string {
  const firstName = contactName.split(" ")[0] || "there";
  return `Hi ${firstName},\n\nWe've received your order ${order.id}. We'll be in touch as it moves through production.\n\nBest,\nHector Footwear Wholesale`;
}

export function orderStatusEmailSubject(order: { id: string; status: string }): string {
  return `Order ${order.id} update — ${STATUS_LABEL[order.status] ?? order.status}`;
}

export function orderConfirmationEmailSubject(order: { id: string }): string {
  return `Order confirmation — ${order.id}`;
}

export function buildApplicationApprovedEmailBody(contactName: string, activationUrl: string): string {
  const firstName = contactName.split(" ")[0] || "there";
  return `Hi ${firstName},\n\nGood news — your Hector Footwear wholesale application has been approved. Activate your account to start browsing the full catalog with pricing:\n\n${activationUrl}\n\nBest,\nHector Footwear Wholesale`;
}

export function buildApplicationDeclinedEmailBody(contactName: string): string {
  const firstName = contactName.split(" ")[0] || "there";
  return `Hi ${firstName},\n\nThanks for your interest in carrying Hector Footwear. After review, we're not able to approve a wholesale account at this time. If your business circumstances change, you're welcome to re-apply.\n\nBest,\nHector Footwear Wholesale`;
}

export const APPLICATION_APPROVED_EMAIL_SUBJECT = "Your Hector Footwear wholesale application — approved";
export const APPLICATION_DECLINED_EMAIL_SUBJECT = "Your Hector Footwear wholesale application";

/** Sent to the applicant the moment they submit — distinct from
 * `buildApplicationApprovedEmailBody`/`buildApplicationDeclinedEmailBody`, which fire later
 * once an admin actually decides. This one just confirms receipt. */
export function buildApplicationReceivedEmailBody(contactName: string): string {
  const firstName = contactName.split(" ")[0] || "there";
  return `Hi ${firstName},\n\nThanks for applying for a Hector Footwear wholesale account — we've received your application and our team is reviewing it now. Most applications are reviewed within 2 business days, and we'll follow up by email as soon as a decision is made.\n\nBest,\nHector Footwear Wholesale`;
}

export const APPLICATION_RECEIVED_EMAIL_SUBJECT = "We've received your Hector Footwear wholesale application";

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

export function buildPasswordResetEmailBody(resetUrl: string, contactName: string): string {
  const firstName = contactName.split(" ")[0] || "there";
  return `Hi ${firstName},\n\nWe received a request to reset your Hector Footwear wholesale account password. Click the link below to choose a new one — it expires in 1 hour:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\nBest,\nHector Footwear Wholesale`;
}

export const PASSWORD_RESET_EMAIL_SUBJECT = "Reset your Hector Footwear wholesale password";

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
 */
export function textToHtml(text: string, subject: string): string {
  const esc = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

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
              <a href="${esc(trimmed)}" style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">Continue &rarr;</a>
            </td></tr>
          </table>`;
      }
      return `<p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#333333;">${esc(line)}</p>`;
    })
    .join("\n");

  return `<!doctype html>
<html>
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
                <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;color:#8a8a8a;letter-spacing:2px;text-transform:uppercase;">Wholesale Portal</p>
                <h1 style="margin:0 0 20px 0;font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:bold;color:#121212;text-transform:uppercase;letter-spacing:0.3px;">${esc(subject)}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 32px 40px;border-top:1px solid #e5e3e0;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8a8a8a;">
                  Hector Footwear Co. &mdash; Wholesale accounts only.<br />
                  This is a transactional email about your wholesale account.
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
