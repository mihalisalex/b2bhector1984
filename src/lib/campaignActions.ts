"use server";

import { requirePermission } from "@/lib/adminGuard";
import { getAllAccounts } from "@/lib/data/accounts";
import { getStorefrontStyles } from "@/lib/data/styles";
import { logAudit } from "@/lib/data/auditLog";
import { sendEmail } from "@/lib/email";
import { CAMPAIGN_COPY_TO, WHATSAPP_NUMBER } from "@/lib/contact";
import {
  buildCampaignHtml,
  buildCampaignWhatsapp,
  campaignLinks,
  CAMPAIGN_MAX_STYLES,
  type CampaignLang,
  type CampaignStyle,
  type CampaignText,
} from "@/lib/campaignEmail";

export interface CampaignState {
  error?: string;
  success?: string;
  /** The same campaign as plain text, for a WhatsApp broadcast list. */
  whatsappText?: string;
}

/**
 * Sends the "new styles" campaign built in /admin/buyer-emails: the admin's own text (typed
 * or generated), photo cards of the ticked styles, one button to the collection.
 *
 * The HTML is rebuilt here from the style ids and text — never taken from the browser — with
 * the same `buildCampaignHtml` the form's live preview uses.
 *
 * `intent=test` sends one copy marked [TEST] to the given address. The real send needs the
 * confirmation box ticked.
 */
export async function sendCampaign(_prev: CampaignState, formData: FormData): Promise<CampaignState> {
  const admin = await requirePermission("accounts.manage");
  const isTest = formData.get("intent") === "test";
  const lang: CampaignLang = formData.get("language") === "en" ? "en" : "el";
  const field = (name: string, max: number) => String(formData.get(name) ?? "").trim().slice(0, max);
  const text: CampaignText = {
    subject: field("subject", 150),
    headline: field("headline", 120),
    intro: field("intro", 1500),
    closing: field("closing", 800),
    offer: field("offer", 160),
    ctaPath: field("ctaPath", 120) || undefined,
  };
  const styleIds = formData.getAll("styleIds").map(String);

  if (!text.subject) return { error: "Γράψε θέμα (ή πάτα το κουμπί δημιουργίας κειμένου)." };
  if (!text.headline) return { error: "Γράψε τίτλο (ή πάτα το κουμπί δημιουργίας κειμένου)." };
  if (styleIds.length === 0) return { error: "Διάλεξε τουλάχιστον ένα μοντέλο." };
  if (styleIds.length > CAMPAIGN_MAX_STYLES) return { error: `Διάλεξε το πολύ ${CAMPAIGN_MAX_STYLES} μοντέλα.` };

  const byId = new Map((await getStorefrontStyles()).map((s) => [s.id, s]));
  const styles: CampaignStyle[] = styleIds
    .map((id) => byId.get(id))
    .filter((s) => s !== undefined)
    .map((s) => ({ id: s.id, name: s.name, slug: s.slug, category: s.category, season: s.season, imageUrl: s.primaryImageUrl }));
  if (styles.length === 0) return { error: "Κανένα από τα μοντέλα δεν είναι πια στον κατάλογο." };

  const links = campaignLinks(lang);
  const render = (contactName: string) => buildCampaignHtml({ lang, text, styles, links, contactName, whatsapp: WHATSAPP_NUMBER });

  if (isTest) {
    const to = field("testEmail", 200);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { error: "Γράψε το email για τη δοκιμή." };
    await sendEmail({ to, subject: `[TEST] ${text.subject}`, html: render(admin.contactName) });
    return { success: `Η δοκιμή στάλθηκε στο ${to}. Δες τα εισερχόμενα και τα ανεπιθύμητα πριν στείλεις στους πελάτες.` };
  }

  if (formData.get("confirm") !== "on") return { error: "Τσέκαρε το κουτί για να σταλεί σε όλους τους πελάτες." };
  const buyers = (await getAllAccounts()).filter((a) => a.status === "active");
  if (buyers.length === 0) return { error: "Δεν υπάρχουν ενεργοί πελάτες ακόμα." };

  for (const buyer of buyers) {
    await sendEmail({ to: buyer.email, subject: text.subject, html: render(buyer.contactName) });
  }
  // The owner's copy: the real email, not a [TEST] — unless they are on the buyer list already.
  if (!buyers.some((b) => b.email.trim().toLowerCase() === CAMPAIGN_COPY_TO)) {
    await sendEmail({ to: CAMPAIGN_COPY_TO, subject: text.subject, html: render(admin.contactName) });
  }
  await logAudit(admin.id, "buyers.campaign_sent", "campaign", text.subject.slice(0, 80), `${buyers.length} buyers, ${styles.length} styles, ${lang}`);

  return {
    success: `Στάλθηκε σε ${buyers.length} πελάτες, με αντίγραφο στο ${CAMPAIGN_COPY_TO}.`,
    whatsappText: buildCampaignWhatsapp(text, styles, links, lang),
  };
}
