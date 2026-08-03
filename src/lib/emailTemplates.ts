const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  confirmed: "Confirmed",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
};

/** Shared with the admin order page's manual mailto compose panel (EmailBuyerPanel) default body. */
export function buildOrderStatusEmailBody(order: { id: string; poNumber: string; status: string }, contactName: string): string {
  const firstName = contactName.split(" ")[0] || "there";
  return `Hi ${firstName},\n\nWriting about your order ${order.id} (PO ${order.poNumber}), currently ${order.status.replace("_", " ")}.\n\n\n\nBest,\nHector Footwear Wholesale`;
}

export function buildOrderConfirmationEmailBody(order: { id: string; poNumber: string }, contactName: string): string {
  const firstName = contactName.split(" ")[0] || "there";
  return `Hi ${firstName},\n\nWe've received your order ${order.id} (PO ${order.poNumber}). We'll be in touch as it moves through production.\n\nBest,\nHector Footwear Wholesale`;
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

/** Plain-text body -> minimal HTML for the Resend send (the mailto panel keeps using the plain text as-is). */
export function textToHtml(text: string): string {
  return text.split("\n").map((line) => (line ? `<p>${line}</p>` : "")).join("\n");
}
