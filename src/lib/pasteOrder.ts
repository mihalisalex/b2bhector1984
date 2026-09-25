import type { BoxTypeId, Colorway, Style } from "@/lib/types";

/**
 * Turns an order pasted from Excel, an email or WhatsApp into cart lines.
 *
 * One line per style: a style number, optionally a colour, and the number of boxes —
 * "5109 brown 3", "5109-2 x2", "YKT09 black; 4", "5109 μαύρο 2". Whatever can't be matched
 * with certainty comes back in `unmatched` so the buyer sees it rather than it being guessed.
 *
 * Quantity is always boxes (the ordering unit); each style is sold in one box format, so the
 * box is taken from the style.
 */

export interface PastedLine {
  styleId: string;
  colorwayId: string;
  boxTypeId: BoxTypeId;
  qty: number;
  label: string;
}

/** Greek colour words buyers actually type, mapped to the English colourway names. */
const COLOUR_ALIASES: Record<string, string> = {
  μαυρο: "black",
  μαύρο: "black",
  καφε: "brown",
  καφέ: "brown",
  ταμπα: "taba",
  ταμπά: "taba",
  μπεζ: "beige",
  μπλε: "blue",
  γκρι: "grey",
  gray: "grey",
  λευκο: "white",
  λευκό: "white",
  ασπρο: "white",
  άσπρο: "white",
  ταμπακι: "tan",
};

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function colourWords(text: string): string[] {
  return norm(text)
    .split(/[^a-zα-ω]+/)
    .filter(Boolean)
    .map((w) => COLOUR_ALIASES[w] ?? w);
}

function colourMatches(style: Style, colorway: Colorway, words: string[]): boolean {
  if (words.length === 0) return false;
  const haystack = norm(`${colorway.name} ${style.name}`);
  return words.some((w) => w.length >= 3 && haystack.includes(w));
}

function baseNumber(styleNumber: string): string {
  return norm(styleNumber).split(/[-\s]/)[0];
}

export function parsePastedOrder(text: string, styles: Style[]): { matched: PastedLine[]; unmatched: string[] } {
  const matched: PastedLine[] = [];
  const unmatched: string[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    // Quantity: the last whole number on the line, allowing "x3", "3x", "×3".
    const qtyMatch = line.match(/(?:^|[\s,;:\t×x])(\d{1,3})\s*(?:x|×|boxes?|κιβ\S*)?\s*$/i);
    const qty = qtyMatch ? Number(qtyMatch[1]) : 0;
    if (!qty) {
      unmatched.push(line);
      continue;
    }
    const rest = line.slice(0, qtyMatch!.index).trim();
    const tokens = norm(rest).split(/[\s,;:\t]+/).filter(Boolean);
    if (tokens.length === 0) {
      unmatched.push(line);
      continue;
    }
    const code = tokens[0];
    const words = colourWords(tokens.slice(1).join(" "));

    // 1. Full style number ("5109-2", "yKT09-1", "6922"), with a colour only to pick among colourways.
    let candidates = styles.filter((s) => norm(s.styleNumber) === code);
    // 2. Model number ("5109") — narrowed by the colour words.
    if (candidates.length === 0) {
      candidates = styles.filter((s) => baseNumber(s.styleNumber) === code || norm(s.name).startsWith(`${code} `));
    }

    const hits: { style: Style; colorway: Colorway }[] = [];
    for (const style of candidates) {
      const byColour = style.colorways.filter((c) => colourMatches(style, c, words));
      if (byColour.length > 0) byColour.forEach((colorway) => hits.push({ style, colorway }));
      else if (candidates.length === 1 && style.colorways.length === 1) hits.push({ style, colorway: style.colorways[0] });
    }

    // Exactly one answer or nothing — a guess between two shoes is worse than asking.
    if (hits.length !== 1) {
      unmatched.push(line);
      continue;
    }
    const { style, colorway } = hits[0];
    const boxTypeId = (style.availableBoxTypes?.[0] ?? "box10") as BoxTypeId;
    matched.push({ styleId: style.id, colorwayId: colorway.id, boxTypeId, qty, label: `${style.styleNumber} ${colorway.name} × ${qty}` });
  }

  return { matched, unmatched };
}
