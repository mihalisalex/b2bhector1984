import "server-only";

/**
 * WhatsApp order notifications via Meta's Cloud API — a plain `fetch()`
 * against Graph API, no SDK dependency, exactly the same philosophy as
 * `email.ts`'s Resend integration (`crypto.scrypt` over a hashing library is
 * the same principle again: built-ins/direct REST over a wrapper package).
 *
 * **No-ops with a console warning if unconfigured** — same deferred-dependency
 * treatment Stripe and Resend got. This can never block or fail `placeOrder()`
 * before real credentials exist, and never throws even once they do: a failed
 * WhatsApp send must not fail the order that triggered it, matching
 * `sendEmail`'s exact error-handling shape.
 *
 * ## Why this can't just send arbitrary text
 *
 * WhatsApp's Cloud API only allows free-form text as a *reply* inside a
 * 24-hour window the customer opened by messaging first. A business-initiated
 * notification — which this is, since it fires the moment a buyer places an
 * order, not in response to an incoming message — **must** use a template
 * pre-submitted to and approved by Meta. Only the numbered `{{1}}`, `{{2}}`...
 * placeholders inside that approved template can vary per send; the
 * surrounding wording is fixed at approval time. See the bottom of this file
 * for the exact template text to submit and how its placeholders map to the
 * `params` array below — changing the number or order of variables here
 * without updating the approved template (or vice versa) will make sends fail.
 *
 * ## Required setup (none of this exists yet — see chat for the walkthrough)
 *
 * 1. A Meta Business Account with a verified WhatsApp Business phone number.
 * 2. A message template submitted and approved under that number.
 * 3. Three environment variables: `WHATSAPP_ACCESS_TOKEN`,
 *    `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME`. Optional:
 *    `WHATSAPP_TEMPLATE_LANG` (defaults to `en_US`) and `WHATSAPP_API_VERSION`
 *    (defaults to `v21.0` — check Meta's changelog periodically, they
 *    deprecate old versions on a schedule).
 */

const DEFAULT_API_VERSION = "v21.0";
const DEFAULT_TEMPLATE_LANG = "en_US";

export interface SendWhatsAppTemplateInput {
  /** Raw as entered by the account holder — normalized to E.164 here, not by the caller. */
  to: string;
  /** Positional template variables, in the exact order the approved template expects. See the module doc comment. */
  params: string[];
}

/**
 * Normalizes a human-entered phone number to the `+<countrycode><number>`
 * shape the Cloud API requires. Strips everything but digits and a leading
 * `+`; if no `+` was typed, one is added (Meta rejects a bare digit string).
 * Does not (and cannot) validate that the country code is real — that's a
 * data-entry problem to catch at the form level, not here.
 */
export function normalizePhoneForWhatsApp(raw: string): string {
  const digits = raw.trim().replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

/**
 * Whether WhatsApp sending is actually wired up in this environment.
 *
 * Exists so the UI can stop making a promise the deployment can't keep. The buyer's account
 * page used to state flatly that their phone number was "used to send an order confirmation
 * by WhatsApp" — true only once these three variables exist, and they don't by default, so
 * every buyer was told about a message that silently no-ops. Reading the same three names
 * `sendWhatsAppTemplate` reads means the copy and the behaviour can never disagree: set the
 * variables and the promise appears on its own, with no code change.
 *
 * Server-only (it touches `process.env`), so pass the result down to client components as a
 * prop rather than calling it from one.
 */
export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_TEMPLATE_NAME,
  );
}

export async function sendWhatsAppTemplate({ to, params }: SendWhatsAppTemplateInput): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;

  if (!accessToken || !phoneNumberId || !templateName) {
    console.warn(
      `[whatsapp] Not configured (need WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_NAME) — skipping message to ${to}`,
    );
    return;
  }

  const recipient = normalizePhoneForWhatsApp(to);
  if (!recipient) {
    console.warn(`[whatsapp] No usable phone number on file — skipping message (raw value: "${to}")`);
    return;
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION || DEFAULT_API_VERSION;
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANG || DEFAULT_TEMPLATE_LANG;

  try {
    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: [
            {
              type: "body",
              parameters: params.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    });
    if (!res.ok) {
      console.error(`[whatsapp] Send failed (${res.status}): ${await res.text()}`);
    }
  } catch (err) {
    console.error("[whatsapp] Send threw:", err);
  }
}

/**
 * Builds the parameter array for the proforma-invoice notification, in the
 * exact order the proposed template (below) expects. Kept as its own function
 * — rather than inlined at the `placeOrder()` call site — so the parameter
 * order is defined in exactly one place.
 */
export function buildProformaInvoiceParams(input: {
  contactName: string;
  orderId: string;
  totalPairs: number;
  subtotal: string;
  vatAmount: string;
  grandTotal: string;
  extraNote: string;
}): string[] {
  const firstName = input.contactName.split(" ")[0] || "there";
  return [
    firstName,
    input.orderId,
    String(input.totalPairs),
    input.subtotal,
    input.vatAmount,
    input.grandTotal,
    input.extraNote,
  ];
}

/**
 * ---------------------------------------------------------------------------
 * TEMPLATE TO SUBMIT IN META BUSINESS MANAGER (Business Settings → WhatsApp
 * Manager → Message Templates → Create)
 * ---------------------------------------------------------------------------
 *
 * Name:      proforma_invoice_notice   (or your choice — must match
 *                                        WHATSAPP_TEMPLATE_NAME exactly)
 * Category:  Utility
 * Language:  English (or your choice — must match WHATSAPP_TEMPLATE_LANG)
 *
 * Body:
 *
 *   Hi {{1}}, we've received your proforma invoice request for order {{2}}.
 *
 *   Pairs ordered: {{3}}
 *   Subtotal: {{4}}
 *   VAT: {{5}}
 *   Total: {{6}}
 *
 *   {{7}}
 *
 * The 7th variable is your free-text closing line ("extra words") — since a
 * template's wording is fixed once approved, edit what THAT variable's actual
 * per-order value says (via the `extraNote` field this module sends), not the
 * template body itself, if you want different closing text without a new
 * approval round. If you want genuinely different fixed wording, edit the
 * body above, resubmit for approval, and wait for Meta to accept it — usually
 * fast for a plain transactional template like this, occasionally rejected if
 * it reads as promotional.
 * ---------------------------------------------------------------------------
 */
