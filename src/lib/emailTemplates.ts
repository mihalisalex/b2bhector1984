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
  return `Hi ${firstName},\n\nWriting about your order ${order.id} (PO ${order.poNumber}), currently ${order.status.replace("_", " ")}.\n\n\n\nBest,\nHector 1984 Wholesale`;
}

export function buildOrderConfirmationEmailBody(order: { id: string; poNumber: string }, contactName: string): string {
  const firstName = contactName.split(" ")[0] || "there";
  return `Hi ${firstName},\n\nWe've received your order ${order.id} (PO ${order.poNumber}). We'll be in touch as it moves through production.\n\nBest,\nHector 1984 Wholesale`;
}

export function orderStatusEmailSubject(order: { id: string; status: string }): string {
  return `Order ${order.id} update — ${STATUS_LABEL[order.status] ?? order.status}`;
}

export function orderConfirmationEmailSubject(order: { id: string }): string {
  return `Order confirmation — ${order.id}`;
}

export function buildApplicationApprovedEmailBody(contactName: string, activationUrl: string): string {
  const firstName = contactName.split(" ")[0] || "there";
  return `Hi ${firstName},\n\nGood news — your Hector 1984 wholesale application has been approved. Activate your account to start browsing the full catalog with pricing:\n\n${activationUrl}\n\nBest,\nHector 1984 Wholesale`;
}

export function buildApplicationDeclinedEmailBody(contactName: string): string {
  const firstName = contactName.split(" ")[0] || "there";
  return `Hi ${firstName},\n\nThanks for your interest in carrying Hector 1984. After review, we're not able to approve a wholesale account at this time. If your business circumstances change, you're welcome to re-apply.\n\nBest,\nHector 1984 Wholesale`;
}

export const APPLICATION_APPROVED_EMAIL_SUBJECT = "Your Hector 1984 wholesale application — approved";
export const APPLICATION_DECLINED_EMAIL_SUBJECT = "Your Hector 1984 wholesale application";

export function buildPasswordResetEmailBody(resetUrl: string, contactName: string): string {
  const firstName = contactName.split(" ")[0] || "there";
  return `Hi ${firstName},\n\nWe received a request to reset your Hector 1984 wholesale account password. Click the link below to choose a new one — it expires in 1 hour:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\nBest,\nHector 1984 Wholesale`;
}

export const PASSWORD_RESET_EMAIL_SUBJECT = "Reset your Hector 1984 wholesale password";

/** Plain-text body -> minimal HTML for the Resend send (the mailto panel keeps using the plain text as-is). */
export function textToHtml(text: string): string {
  return text.split("\n").map((line) => (line ? `<p>${line}</p>` : "")).join("\n");
}
