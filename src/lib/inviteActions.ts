"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/adminGuard";
import { hasOpenApplication, insertInvitedApplication } from "@/lib/data/applications";
import { getAccountByEmail } from "@/lib/data/accounts";
import { logAudit } from "@/lib/data/auditLog";
import { sendEmail } from "@/lib/email";
import { buildInviteEmailBody, textToHtml } from "@/lib/emailTemplates";
import { waLinkTo } from "@/lib/whatsapp";
import { isKnownCountry } from "@/lib/countries";
import { getDictionary } from "@/i18n/getDictionary";
import { urlForLocale } from "@/i18n/domains";
import { t } from "@/i18n/format";
import { LOCALES, type Locale } from "@/i18n/config";

export interface InviteState {
  error?: string;
  success?: string;
  /** The shop's personal set-your-password link — shown so the admin can copy it. */
  link?: string;
  /** Click-to-send WhatsApp message to the shop, when a mobile was given. */
  whatsappLink?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invite a shop the business already sells to: creates an application that is already
 * approved, emails the shop its set-your-password link in its own language, and hands the
 * admin a ready-written WhatsApp message with the same link. The shop's account is created
 * the moment they set a password (the normal `activateAccount` path).
 */
export async function inviteShop(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const admin = await requirePermission("accounts.manage");
  const str = (k: string) => String(formData.get(k) ?? "").trim();

  const businessName = str("businessName");
  const contactName = str("contactName");
  const email = str("email").toLowerCase();
  const phone = str("phone");
  const country = str("country").toUpperCase() || "GR";
  const city = str("city");
  const vatNumber = str("vatNumber");
  const repId = str("repId") || null;
  const rawMultiplier = str("priceMultiplier");
  const priceMultiplier = rawMultiplier ? Number(rawMultiplier.replace(",", ".")) : 1;
  const localeRaw = str("locale");
  const locale: Locale = (LOCALES as readonly string[]).includes(localeRaw) ? (localeRaw as Locale) : country === "GR" || country === "CY" ? "el" : "en";

  if (!businessName || !contactName || !email) return { error: "Shop name, contact name and email are required." };
  if (!EMAIL_RE.test(email)) return { error: `“${email}” doesn't look like an email address.` };
  if (!isKnownCountry(country)) return { error: "Choose a country from the list." };
  if (!Number.isFinite(priceMultiplier) || priceMultiplier <= 0 || priceMultiplier > 5) {
    return { error: "Price multiplier must be between 0.01 and 5 (1 = normal prices)." };
  }
  if (await getAccountByEmail(email)) return { error: `${email} already has an account — nothing to invite.` };
  if (await hasOpenApplication(email)) {
    return { error: `${email} already has an application or invitation waiting — resend it from Applications instead.` };
  }

  const id = await insertInvitedApplication({ businessName, contactName, email, phone, country, city, vatNumber, repId, priceMultiplier });
  // The shop's own language and domain: .gr for Greek, .com (/de, /fr) otherwise.
  const link = urlForLocale(locale, `/apply/pending?app=${id}`);

  const e = (await getDictionary(locale)).email;
  await sendEmail({
    to: email,
    subject: e.inviteSubject,
    html: textToHtml(buildInviteEmailBody(e, contactName, businessName, link), e.inviteSubject, e, locale),
  });
  await logAudit(admin.id, "application.invited", "application", id, `${businessName} <${email}> ${country}`);
  revalidatePath("/admin/applications");
  revalidatePath("/admin/invite");

  const firstName = contactName.split(" ")[0] || contactName;
  const whatsappLink = waLinkTo(phone, t(e.inviteWhatsapp, { name: firstName, business: businessName, link })) ?? undefined;
  return { success: `Invitation emailed to ${email}.`, link, whatsappLink };
}
