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
import { isLocale, type Locale } from "@/i18n/config";
import type { Style } from "@/lib/types";

export interface SeasonReminderState {
  error?: string;
  success?: string;
  /** Greek text for a WhatsApp broadcast list, same content as the email. */
  whatsappText?: string;
}

/** Most styles one email shows — six photos is two screens on a phone; more gets skimmed. */
const MAX_STYLES = 6;

/**
 * A product photo sized for an email: Supabase's transformer at 500px wide (the card is
 * 250px, doubled for retina screens). The originals are phone-camera size — up to ~1.4 MB
 * each, which is six slow downloads for a buyer opening the email on mobile data.
 */
function emailImageUrl(url: string | undefined): string | undefined {
  if (!url?.includes("/storage/v1/object/public/")) return url;
  const rendered = new URL(url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/"));
  rendered.searchParams.set("width", "500");
  rendered.searchParams.set("quality", "70");
  rendered.searchParams.set("resize", "contain");
  return rendered.href;
}

/** The subject and branded HTML of the campaign for one reader. */
async function buildCampaignEmail(
  locale: Locale,
  contactName: string,
  input: { styles: Style[]; orderByRaw: string; leadTimeDays: number; note: string },
) {
  const e = (await getDictionary(locale)).email;
  const dates = input.orderByRaw
    ? {
        orderBy: formatDateLong(input.orderByRaw, locale),
        deliveredBy: formatDateLong(estimatedArrivalIso(input.leadTimeDays, new Date(`${input.orderByRaw}T12:00:00Z`)), locale),
      }
    : undefined;
  const subject = dates ? t(e.seasonSubject, dates) : e.newStylesSubject;
  const body = buildSeasonReminderEmailBody(e, contactName, {
    styleNames: input.styles.map((s) => s.name),
    ...dates,
    leadTimeDays: input.leadTimeDays,
    note: input.note || undefined,
    newUrl: urlForLocale(locale, "/catalogue?sort=newest"),
    sheetUrl: urlForLocale(locale, "/quick-order"),
    withProductGrid: true,
  });
  const products = input.styles.map((s) => ({
    name: s.name,
    url: urlForLocale(locale, `/product/${s.slug}`),
    imageUrl: emailImageUrl(s.primaryImageUrl),
  }));
  return { subject, html: textToHtml(body, subject, e, locale, products), dict: e, dates };
}

/**
 * The "new styles" email: photo cards of the chosen styles, the production time (or an
 * order-by date and its matching ready-by date), and buttons to the new styles and the order
 * sheet. Sent in Greek to everyone, or in each buyer's own language.
 *
 * `intent=test` sends one copy, marked [TEST], to the address given — so the owner can see
 * exactly what buyers will get before anything goes out. The real send needs the explicit
 * confirmation box.
 */
export async function sendSeasonReminder(_prev: SeasonReminderState, formData: FormData): Promise<SeasonReminderState> {
  const admin = await requirePermission("accounts.manage");
  const isTest = formData.get("intent") === "test";
  const orderByRaw = String(formData.get("orderBy") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 600);
  const language = String(formData.get("language") ?? "el");
  const fixedLocale = isLocale(language) ? language : undefined;
  const styleIds = formData.getAll("styleIds").map(String);

  if (orderByRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(orderByRaw)) return { error: "The order-by date isn't a valid date." };
    if (new Date(`${orderByRaw}T12:00:00Z`).getTime() < Date.now() - 24 * 60 * 60 * 1000) return { error: "The order-by date is in the past." };
  }
  if (styleIds.length === 0) return { error: "Tick at least one style to show in the email." };
  if (styleIds.length > MAX_STYLES) return { error: `Pick at most ${MAX_STYLES} styles — more than that and buyers stop scrolling.` };

  const [styles, hero] = await Promise.all([getStorefrontStyles(), getHomepageHero()]);
  const byId = new Map(styles.map((s) => [s.id, s]));
  const chosen = styleIds.map((id) => byId.get(id)).filter((s): s is Style => Boolean(s));
  if (chosen.length === 0) return { error: "None of the ticked styles are live in the catalogue any more." };
  const input = { styles: chosen, orderByRaw, leadTimeDays: hero.productionLeadTimeDays, note };

  if (isTest) {
    const to = String(formData.get("testEmail") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { error: "Enter the email address to send the test to." };
    const { subject, html } = await buildCampaignEmail(fixedLocale ?? "el", admin.contactName, input);
    await sendEmail({ to, subject: `[TEST] ${subject}`, html });
    return { success: `Test sent to ${to}. Check your inbox (and the spam folder) before sending to buyers.` };
  }

  if (formData.get("confirm") !== "on") return { error: "Tick the box to confirm you want to email every buyer." };
  const buyers = (await getAllAccounts()).filter((a) => a.status === "active");
  if (buyers.length === 0) return { error: "There are no active buyer accounts to email yet." };

  let sent = 0;
  for (const buyer of buyers) {
    const locale = fixedLocale ?? resolveLocale(buyer.locale, buyer.storeLocation);
    const { subject, html } = await buildCampaignEmail(locale, buyer.contactName, input);
    await sendEmail({ to: buyer.email, subject, html });
    sent += 1;
  }
  await logAudit(admin.id, "buyers.season_reminder_sent", "campaign", orderByRaw || "no-date", `${sent} buyers, ${chosen.length} styles`);

  const { dict: el, dates } = await buildCampaignEmail("el", "", input);
  const whatsappText = [
    dates ? t(el.seasonSubject, dates) : el.newStylesSubject,
    `${el.seasonIntro}\n${chosen.map((s) => `• ${s.name}`).join("\n")}`,
    dates ? t(el.seasonDeadline, dates) : t(el.newStylesLeadTime, { days: hero.productionLeadTimeDays }),
    note,
    urlForLocale("el", "/catalogue?sort=newest"),
  ]
    .filter(Boolean)
    .join("\n\n");

  return { success: `Sent to ${sent} buyer${sent === 1 ? "" : "s"}.`, whatsappText };
}
