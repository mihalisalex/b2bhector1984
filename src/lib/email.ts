import "server-only";

// Must exactly match a sender address on a domain verified in Resend's
// dashboard (Domains → hectorfootwear.gr) — sending fails otherwise.
const FROM_EMAIL = "Hector 1984 Wholesale <info@hectorfootwear.gr>";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
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
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipping email to ${to}: "${subject}"`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) {
      console.error(`[email] Resend send failed (${res.status}): ${await res.text()}`);
    }
  } catch (err) {
    console.error("[email] Resend send threw:", err);
  }
}
