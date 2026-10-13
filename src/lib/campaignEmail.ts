import { greekVocative } from "@/i18n/greek";
import { originForLocale, urlForLocale } from "@/i18n/domains";
import type { Category, StyleSeason } from "@/lib/types";

/**
 * The "new styles" campaign email an admin sends to every buyer from /admin/buyer-emails.
 *
 * Pure functions only — the admin form runs `buildCampaignHtml` in the browser for its live
 * preview, and `sendCampaign` runs the very same function on the server for the real send,
 * so what the owner sees is exactly what buyers get.
 *
 * Deliberately not `textToHtml`: that shell is for transactional mail (order updates,
 * password resets). A campaign is a lookbook — big headline, photos first, one button.
 */

export type CampaignLang = "el" | "en";

export interface CampaignStyle {
  id: string;
  name: string;
  slug: string;
  category: Category;
  season: StyleSeason;
  imageUrl?: string;
}

export interface CampaignText {
  subject: string;
  headline: string;
  intro: string;
  closing: string;
  /** Optional offer line, shown as a black strip above the photos ("−10% on all winter styles…"). */
  offer?: string;
  /** Where the main button goes instead of the newest styles, e.g. "/catalogue?flag=sale". */
  ctaPath?: string;
}

export interface CampaignLinks {
  catalogue: string;
  sheet: string;
  /** Product URL without the slug, e.g. "https://www.hectorfootwear.gr/product/". */
  productBase: string;
  site: string;
  /** Origin the email's photos are served from (our /api/img). */
  imageOrigin: string;
}

/** Links for a campaign in one language — the Greek domain for Greek, the .com for English. */
export function campaignLinks(lang: CampaignLang): CampaignLinks {
  return {
    catalogue: urlForLocale(lang, "/catalogue?sort=newest"),
    sheet: urlForLocale(lang, "/quick-order"),
    productBase: urlForLocale(lang, "/product/x").replace(/x$/, ""),
    site: urlForLocale(lang, "/"),
    imageOrigin: originForLocale(lang),
  };
}

/** Most styles one email shows — five rows of two on a phone; past that, buyers stop scrolling. */
export const CAMPAIGN_MAX_STYLES = 10;

const FIXED: Record<CampaignLang, { greeting: (first: string) => string; eyebrow: string; offerEyebrow: string; cta: string; sheet: string; signoff: string; optOut: string }> = {
  el: {
    greeting: (first) => (first ? `Γεια σας ${greekVocative(first)},` : "Γεια σας,"),
    eyebrow: "Νέα μοντέλα",
    offerEyebrow: "Προσφορά",
    cta: "Δείτε τη συλλογή",
    sheet: "ή ανοίξτε το φύλλο παραγγελίας",
    signoff: "Hector Footwear",
    optOut: "Λαμβάνετε αυτό το email ως συνεργάτης χονδρικής. Δεν θέλετε ενημερώσεις; Απαντήστε «STOP».",
  },
  en: {
    greeting: (first) => (first ? `Hi ${first},` : "Hello,"),
    eyebrow: "New in",
    offerEyebrow: "Offer",
    cta: "See the collection",
    sheet: "or open the order sheet",
    signoff: "Hector Footwear",
    optOut: "You get this email as a Hector Footwear wholesale buyer. Rather not? Reply “STOP”.",
  },
};

/**
 * "9100 Black - Leather boots" → { code: "9100", detail: "Black · Leather boots" }.
 * Product names follow "<model> <colour> - <type>"; anything else is shown whole.
 */
export function splitStyleName(name: string): { code: string; detail: string } {
  const clean = name.replace(/\s+/g, " ").trim();
  const match = clean.match(/^(\S+)\s+(.+?)\s+-\s+(.+)$/);
  if (!match) return { code: clean, detail: "" };
  return { code: match[1], detail: `${match[2]} · ${match[3]}` };
}

/** Widths the /api/img route serves: admin thumbnails, and email cards (270px, doubled for retina). */
export const EMAIL_IMAGE_WIDTHS = [240, 560] as const;
export type EmailImageWidth = (typeof EMAIL_IMAGE_WIDTHS)[number];

const BUCKET_SEGMENT = "/storage/v1/object/public/style-images/";

/** "st-<id>/<file>" — the only shape of object path /api/img will fetch. */
export function isStyleImagePath(path: string): boolean {
  return /^st-[A-Za-z0-9-]+\/[^/\\]+$/.test(path) && !path.includes("..");
}

/**
 * A product photo through our own /api/img (see that route for why not Supabase's resizer).
 * `origin` makes it absolute, which an email needs; leave it empty for a page on this site.
 * Anything that isn't a style-images object is returned unchanged.
 */
export function campaignImageUrl(url: string | undefined, width: EmailImageWidth, origin = ""): string | undefined {
  const at = url?.indexOf(BUCKET_SEGMENT) ?? -1;
  if (!url || at < 0) return url;
  let path = url.slice(at + BUCKET_SEGMENT.length).split("?")[0];
  try {
    path = decodeURIComponent(path);
  } catch {
    return url;
  }
  if (!isStyleImagePath(path)) return url;
  return `${origin}/api/img?${new URLSearchParams({ p: path, w: String(width) })}`;
}

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Free text → paragraphs; a blank line starts a new one. */
const paragraphs = (text: string, style: string) =>
  text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p style="${style}">${esc(block).replace(/\n/g, "<br />")}</p>`)
    .join("");

const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";

/** The collection link, honouring a campaign's own `ctaPath` (only catalogue paths). */
function collectionUrl(text: CampaignText, links: CampaignLinks, lang: CampaignLang): string {
  return text.ctaPath?.startsWith("/catalogue") ? urlForLocale(lang, text.ctaPath) : links.catalogue;
}

export function buildCampaignHtml(input: {
  lang: CampaignLang;
  text: CampaignText;
  styles: CampaignStyle[];
  links: CampaignLinks;
  /** The buyer's contact name; only the first word is used. */
  contactName: string;
  whatsapp: string;
}): string {
  const f = FIXED[input.lang];
  const first = input.contactName.trim().split(/\s+/)[0] ?? "";
  const offer = input.text.offer?.trim() ?? "";
  const body = `margin:0 0 16px 0;font-family:${FONT};font-size:16px;line-height:1.6;color:#4a4a4a;`;

  const card = (style: CampaignStyle, index: number) => {
    const { code, detail } = splitStyleName(style.name);
    const url = `${input.links.productBase}${style.slug}`;
    const image = campaignImageUrl(style.imageUrl, 560, input.links.imageOrigin);
    return `
      <td width="50%" valign="top" style="padding:0 ${index % 2 === 0 ? "6px" : "0"} 28px ${index % 2 === 0 ? "0" : "6px"};">
        <a href="${esc(url)}" style="text-decoration:none;color:#121212;display:block;">
          ${
            image
              ? `<img src="${esc(image)}" alt="${esc(style.name)}" width="270" style="display:block;width:100%;max-width:270px;height:auto;border:0;border-radius:6px;background-color:#f4f3f1;" />`
              : `<div style="height:200px;border-radius:6px;background-color:#f4f3f1;"></div>`
          }
          <p style="margin:12px 0 0 0;font-family:${FONT};font-size:11px;letter-spacing:2px;color:#a3a09b;">${String(index + 1).padStart(2, "0")}</p>
          <p style="margin:2px 0 0 0;font-family:${FONT};font-size:16px;font-weight:700;color:#121212;letter-spacing:-0.2px;">${esc(code)}</p>
          ${detail ? `<p style="margin:2px 0 0 0;font-family:${FONT};font-size:13px;line-height:1.4;color:#77736d;">${esc(detail)}</p>` : ""}
        </a>
      </td>`;
  };
  const rows: string[] = [];
  for (let i = 0; i < input.styles.length; i += 2) {
    const pair = input.styles.slice(i, i + 2);
    rows.push(`<tr>${pair.map((s, j) => card(s, i + j)).join("")}${pair.length === 1 ? '<td width="50%"></td>' : ""}</tr>`);
  }

  return `<!doctype html>
<html lang="${input.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>${esc(input.text.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(input.text.intro.slice(0, 140))}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
      <tr>
        <td align="center" style="padding:36px 20px 44px 20px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
            <tr>
              <td style="padding:0 0 18px 0;border-bottom:1px solid #121212;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:6px;color:#121212;">HECTOR</td>
                    <td align="right" style="font-family:${FONT};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#a3a09b;">${esc(offer ? f.offerEyebrow : f.eyebrow)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 0 8px 0;">
                <h1 style="margin:0 0 24px 0;font-family:${FONT};font-size:36px;line-height:1.08;font-weight:700;letter-spacing:-1px;color:#121212;">${esc(input.text.headline).replace(/\n/g, "<br />")}</h1>
                <p style="${body}">${esc(f.greeting(first))}</p>
                ${paragraphs(input.text.intro, body)}
              </td>
            </tr>
            ${
              offer
                ? `<tr>
              <td style="padding:12px 0 4px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:#121212;border-radius:6px;padding:18px 22px;font-family:${FONT};font-size:16px;line-height:1.4;font-weight:700;color:#ffffff;letter-spacing:-0.1px;">${esc(offer)}</td>
                  </tr>
                </table>
              </td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding:20px 0 4px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${rows.join("\n")}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0 36px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:#121212;border-radius:999px;">
                      <a href="${esc(collectionUrl(input.text, input.links, input.lang))}" style="display:inline-block;padding:16px 30px;font-family:${FONT};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">${esc(f.cta)} &rarr;</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:14px 0 0 4px;font-family:${FONT};font-size:13px;">
                  <a href="${esc(input.links.sheet)}" style="color:#77736d;text-decoration:underline;">${esc(f.sheet)}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 32px 0;">
                ${paragraphs(input.text.closing, body)}
                <p style="margin:0;font-family:${FONT};font-size:16px;font-weight:700;color:#121212;">— ${esc(f.signoff)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 0 0 0;border-top:1px solid #e8e6e3;font-family:${FONT};font-size:12px;line-height:1.7;color:#a3a09b;">
                <a href="${esc(input.links.site)}" style="color:#77736d;text-decoration:none;">${esc(input.links.site.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>
                &nbsp;·&nbsp; WhatsApp ${esc(input.whatsapp)}<br />
                ${esc(f.optOut)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** The same campaign as plain text, for a WhatsApp broadcast list. */
export function buildCampaignWhatsapp(text: CampaignText, styles: CampaignStyle[], links: CampaignLinks, lang: CampaignLang): string {
  return [
    text.headline.replace(/\n/g, " "),
    text.offer ?? "",
    text.intro,
    styles.map((s) => `• ${s.name.replace(/\s+/g, " ")}`).join("\n"),
    collectionUrl(text, links, lang),
  ]
    .filter((part) => part.trim())
    .join("\n\n");
}

// --- Ready-made campaigns -------------------------------------------------------------
//
// Complete emails written for a specific occasion: which styles to show and the finished
// text. Picked from "Start from" in the admin form (or /admin/buyer-emails?preset=<id>), then
// editable like anything else. `until` hides a preset once its offer has ended.

export interface CampaignPreset {
  id: string;
  label: string;
  lang: CampaignLang;
  /** Which styles to pre-pick: the newest `count` of this season. */
  season?: StyleSeason;
  count: number;
  text: CampaignText;
  /** ISO date; the preset disappears from the list after this day. */
  until?: string;
}

export const CAMPAIGN_PRESETS: CampaignPreset[] = [
  {
    // Owner's request 2026-10-13. The sale prices it promises are set on the site: every
    // winter style 10% off, ending 31 Oct 23:59 Athens (styles.sale_price / sale_end_at).
    id: "winter-10-october-2026",
    label: "Winter −10% until end of October (Greek)",
    lang: "el",
    season: "winter",
    count: 10,
    until: "2026-10-31",
    text: {
      ctaPath: "/catalogue?flag=sale",
      subject: "−10% σε όλα τα χειμερινά, μόνο έως το τέλος Οκτωβρίου",
      headline: "Ο χειμώνας\nξεκινά με −10%.",
      offer: "−10% σε όλα τα χειμερινά μοντέλα, έως 31 Οκτωβρίου",
      intro:
        "Ήρθε η ώρα να ετοιμάσετε τη βιτρίνα σας για τον χειμώνα. Μέχρι το τέλος Οκτωβρίου, όλα τα χειμερινά μας μοντέλα — δερμάτινα μποτάκια και δετά — έχουν 10% έκπτωση. Οι τιμές με την έκπτωση φαίνονται ήδη στο site.\n\nΚαι αν επιλέξετε προπληρωμή, κερδίζετε επιπλέον 10%, που αφαιρείται αυτόματα.",
      closing:
        "Όσο νωρίτερα παραγγείλετε, τόσο νωρίτερα θα έχετε τα κιβώτιά σας στο κατάστημα. Για οποιαδήποτε απορία, απαντήστε σε αυτό το email ή στείλτε μας στο WhatsApp.",
    },
  },
];

/** Presets still running on `todayIso` (YYYY-MM-DD). */
export function activePresets(todayIso: string): CampaignPreset[] {
  return CAMPAIGN_PRESETS.filter((p) => !p.until || p.until >= todayIso);
}

// --- Text generator ---------------------------------------------------------------------
//
// "Generate text" in the admin form. No AI service: a handful of hand-written versions per
// language, filled in from the ticked styles (their models, types and colours). Pressing it
// again gives the next version. Everything stays editable afterwards.

const CATEGORY_WORDS: Record<CampaignLang, Record<Category, string>> = {
  el: {
    boots: "μποτάκια",
    formal: "δετά",
    sneakers: "sneakers",
    sandals: "πέδιλα",
    loafers: "μοκασίνια",
    wedding: "γαμπριάτικα",
    anatomic: "ανατομικά",
  },
  en: {
    boots: "boots",
    formal: "lace-ups",
    sneakers: "sneakers",
    sandals: "sandals",
    loafers: "loafers",
    wedding: "wedding shoes",
    anatomic: "comfort shoes",
  },
};

function joinList(items: string[], lang: CampaignLang): string {
  const and = lang === "el" ? "και" : "and";
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}

function facts(styles: CampaignStyle[], lang: CampaignLang) {
  const unique = <T,>(list: T[]) => [...new Set(list)];
  const cats = unique(styles.map((s) => CATEGORY_WORDS[lang][s.category] ?? s.category));
  const models = unique(styles.map((s) => splitStyleName(s.name).code));
  const colours = unique(
    styles
      .map((s) => s.name.replace(/\s+/g, " ").match(/^\S+\s+(.+?)\s+-\s+/)?.[1])
      .filter((c): c is string => Boolean(c)),
  );
  return { count: styles.length, cats: joinList(cats, lang), models: joinList(models, lang), colours: joinList(colours, lang) };
}

type Facts = ReturnType<typeof facts>;

const VERSIONS: Record<CampaignLang, ((x: Facts) => CampaignText)[]> = {
  el: [
    (x) => ({
      subject: `Νέα μοντέλα: ${x.cats}`,
      headline: "Μόλις μπήκαν\nστον κατάλογο.",
      intro: `${x.count === 1 ? "Ένα νέο σχέδιο" : `${x.count} νέα σχέδια`} από εμάς — ${x.cats}, σε ${x.colours}. Δερμάτινα, σε κουτιά, έτοιμα για την επόμενη παραγγελία σας.`,
      closing: "Για οτιδήποτε χρειαστείτε, απαντήστε σε αυτό το email ή στείλτε μας στο WhatsApp.",
    }),
    (x) => ({
      subject: `${x.models} — τα νέα μας σχέδια`,
      headline: "Νέα σχέδια\nγια τη βιτρίνα σας.",
      intro: `Σας τα δείχνουμε πρώτοι: ${x.cats} που φτιάξαμε για τη νέα σεζόν. Τιμές και κουτιά θα τα βρείτε στο site, μαζί με το προτεινόμενο λιανικής.`,
      closing: "Κάθε παραγγελία φτιάχνεται για εσάς. Πείτε μας τι σας αρέσει και κανονίζουμε τα υπόλοιπα.",
    }),
    (x) => ({
      subject: `${x.count} νέα μοντέλα από τη Hector Footwear`,
      headline: "Κάτι καινούργιο.",
      intro: `Προσθέσαμε ${x.cats} στη συλλογή μας. Η παραγγελία γίνεται σε λίγα λεπτά από το κινητό σας — διαλέγετε κουτιά και στέλνετε.`,
      closing: "Ευχαριστούμε που μας εμπιστεύεστε.",
    }),
    (x) => ({
      subject: `Νέα ${x.cats} — δείτε τα πρώτοι`,
      headline: "Δερμάτινα.\nΚαινούργια.\nΓια εσάς.",
      intro: `Τα νέα μας μοντέλα (${x.models}) είναι online. Δείτε τα από κοντά και πείτε μας ποια θέλετε στο επόμενο κουτί σας.`,
      closing: "Θέλετε περισσότερες φωτογραφίες ή έχετε κάποια ερώτηση; Απαντήστε σε αυτό το email.",
    }),
  ],
  en: [
    (x) => ({
      subject: `New styles: ${x.cats}`,
      headline: "Just added\nto the catalogue.",
      intro: `${x.count === 1 ? "One new style" : `${x.count} new styles`} from us — ${x.cats} in ${x.colours}. All leather, sold by the box, ready for your next order.`,
      closing: "Anything you need, just reply to this email or message us on WhatsApp.",
    }),
    (x) => ({
      subject: `${x.models} — our newest styles`,
      headline: "New styles\nfor your shelves.",
      intro: `You're seeing them first: ${x.cats} we've made for the new season. Prices, boxes and suggested retail are all on the site.`,
      closing: "Every order is made for you. Tell us what you like and we'll handle the rest.",
    }),
    (x) => ({
      subject: `${x.count} new styles from Hector Footwear`,
      headline: "Something new.",
      intro: `We've added ${x.cats} to the collection. Ordering takes a few minutes from your phone — pick your boxes and send.`,
      closing: "Thank you for working with us.",
    }),
    (x) => ({
      subject: `New ${x.cats} — see them first`,
      headline: "Leather.\nNew.\nYours.",
      intro: `Our newest models (${x.models}) are online. Take a closer look and tell us which ones go in your next box.`,
      closing: "Want more photos or have a question? Just reply to this email.",
    }),
  ],
};

/** How many versions "Generate text" cycles through. */
export const CAMPAIGN_VERSION_COUNT = VERSIONS.el.length;

export function generateCampaignText(styles: CampaignStyle[], lang: CampaignLang, version: number): CampaignText {
  const list = VERSIONS[lang];
  return list[((version % list.length) + list.length) % list.length](facts(styles, lang));
}
