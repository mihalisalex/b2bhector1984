import "server-only";

// Must exactly match a sender address on a domain verified in Resend's
// dashboard (Domains → hectorfootwear.gr) — sending fails otherwise.
const FROM_EMAIL = "Hector Footwear Wholesale <info@hectorfootwear.gr>";

export interface EmailAttachment {
  filename: string;
  /** Base64-encoded file bytes — Resend's REST API takes JSON, which can't carry raw
   * binary, so this has to already be base64 by the time it gets here (a plain Buffer
   * would just get its `.toString()` called and silently send garbage). */
  contentBase64: string;
  contentType: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

/**
 * Plain `fetch()` against Resend's REST API — no `resend` npm dependency,
 * consistent with this project's preference for built-ins over new packages
 * (e.g. `crypto.scrypt` over a hashing library). No-ops with a console
 * warning if `RESEND_API_KEY` isn't set, so this never blocks or fails the
 * caller before a real key is provided — same deferred-dependency treatment
 * Stripe got in Phase 1. Never throws; failures are logged, not propagated,
 * since a failed notification email shouldn't fail the order/status action
 * that triggered it.
 */
export async function sendEmail({ to, subject, html, attachments }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipping email to ${to}: "${subject}"`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        attachments: attachments?.map((a) => ({
          filename: a.filename,
          content: a.contentBase64,
          content_type: a.contentType,
        })),
      }),
    });
    if (!res.ok) {
      console.error(`[email] Resend send failed (${res.status}): ${await res.text()}`);
    }
  } catch (err) {
    console.error("[email] Resend send threw:", err);
  }
}
