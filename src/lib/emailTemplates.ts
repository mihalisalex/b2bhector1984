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

/** Plain-text body -> minimal HTML for the Resend send (the mailto panel keeps using the plain text as-is). */
export function textToHtml(text: string): string {
  return text.split("\n").map((line) => (line ? `<p>${line}</p>` : "")).join("\n");
}
