"use server";

import { requirePermission } from "@/lib/adminGuard";
import { getAllAccounts } from "@/lib/data/accounts";
import { getStorefrontStyles } from "@/lib/data/styles";
import { getHomepageHero } from "@/lib/data/siteContent";
import { logAudit } from "@/lib/data/auditLog";
import { sendEmail } from "@/lib/email";
import { buildSeasonReminderEmailBody, textToHtml } from "@/lib/emailTemplates";
import { estimatedArrivalIso } from "@/lib/delivery";
import { formatDateLong } from "@/lib/format";
import { resolveLocale } from "@/lib/localeHeuristic";
import { getDictionary } from "@/i18n/getDictionary";
import { urlForLocale } from "@/i18n/domains";
import { t } from "@/i18n/format";

export interface SeasonReminderState {
  error?: string;
  success?: string;
  /** Greek text for a WhatsApp broadcast list, same content as the email. */
  whatsappText?: string;
}

/**
 * Emails every active buyer, each in their own language: the newest styles, an "order by"
 * date and the matching delivery date (order-by + the production lead time), and buttons to
 * the new styles and the order sheet. Admin-triggered only, with an explicit confirmation.
 */
export async function sendSeasonReminder(_prev: SeasonReminderState, formData: FormData): Promise<SeasonReminderState> {
  const admin = await requirePermission("accounts.manage");
  const orderByRaw = String(formData.get("orderBy") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 600);
  if (formData.get("confirm") !== "on") return { error: "Tick the box to confirm you want to email every buyer." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(orderByRaw)) return { error: "Pick an order-by date." };
  const orderByDate = new Date(`${orderByRaw}T12:00:00Z`);
  if (orderByDate.getTime() < Date.now() - 24 * 60 * 60 * 1000) return { error: "The order-by date is in the past." };

  const [accounts, styles, hero] = await Promise.all([getAllAccounts(), getStorefrontStyles(), getHomepageHero()]);
  const buyers = accounts.filter((a) => a.status === "active");
  if (buyers.length === 0) return { error: "There are no active buyer accounts to email yet." };

  const newest = styles
    .filter((s) => s.newArrival)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
    .map((s) => s.name);
  const deliveredIso = estimatedArrivalIso(hero.productionLeadTimeDays, orderByDate);

  let sent = 0;
  for (const buyer of buyers) {
    const locale = resolveLocale(buyer.locale, buyer.storeLocation);
    const e = (await getDictionary(locale)).email;
    const vars = { orderBy: formatDateLong(orderByRaw, locale), deliveredBy: formatDateLong(deliveredIso, locale) };
    const subject = t(e.seasonSubject, vars);
    const body = buildSeasonReminderEmailBody(e, buyer.contactName, {
      styleNames: newest,
      ...vars,
      note: note || undefined,
      newUrl: urlForLocale(locale, "/catalogue?sort=newest"),
      sheetUrl: urlForLocale(locale, "/quick-order"),
    });
    await sendEmail({ to: buyer.email, subject, html: textToHtml(body, subject, e, locale) });
    sent += 1;
  }
  await logAudit(admin.id, "buyers.season_reminder_sent", "campaign", orderByRaw, `${sent} buyers`);

  const el = (await getDictionary("el")).email;
  const elVars = { orderBy: formatDateLong(orderByRaw, "el"), deliveredBy: formatDateLong(deliveredIso, "el") };
  const whatsappText = [
    t(el.seasonSubject, elVars),
    newest.length ? `${el.seasonIntro}\n${newest.map((n) => `• ${n}`).join("\n")}` : "",
    t(el.seasonDeadline, elVars),
    note,
    urlForLocale("el", "/catalogue?sort=newest"),
  ]
    .filter(Boolean)
    .join("\n\n");

  return { success: `Sent to ${sent} buyer${sent === 1 ? "" : "s"}.`, whatsappText };
}
