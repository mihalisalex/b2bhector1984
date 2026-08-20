/**
 * The one place the company's public contact addresses are written.
 *
 * `info@hectorfootwear.gr` was hardcoded in eight files — the footer, the shop footer, the
 * contact page, two FAQ answers (English and Greek), an account-activation error, and both
 * PDF documents. Changing it meant finding all eight, and the acceptance criteria for the
 * domain split require no hardcoded domain strings anywhere.
 *
 * Deliberately NOT per-domain. The mailbox is the same one whichever site the buyer came
 * from, and giving hectorfootwear.com its own address would split the inbox for no reason
 * — the language of the *reply* is what varies, and that is driven by `accounts.locale`.
 *
 * No `server-only` import: this is referenced from client components (the footers) as well
 * as from server-rendered PDFs and email bodies.
 */

/** Public enquiries mailbox, shown to buyers. */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "info@hectorfootwear.gr";

/** `mailto:` href for {@link SUPPORT_EMAIL}. */
export const SUPPORT_EMAIL_HREF = `mailto:${SUPPORT_EMAIL}`;

/**
 * The From: address on transactional mail. Must exactly match a sender on a domain verified
 * in Resend's dashboard (Domains → hectorfootwear.gr) or sending fails outright — which is
 * why this is separate from SUPPORT_EMAIL despite currently sharing a mailbox: one is a
 * display string, the other is bound to an external provider's configuration.
 */
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? `Hector Footwear Wholesale <${SUPPORT_EMAIL}>`;
