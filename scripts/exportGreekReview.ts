/**
 * Dumps the EN/EL dictionaries to a reviewable CSV: namespace, key, English, Greek.
 *
 *   npx tsx scripts/exportGreekReview.ts
 *
 * The owner edits the "Greek" column in place and hands the file back; the companion
 * importer (scripts/applyGreekReview.ts) writes the corrections into el.ts. Round-tripping
 * a spreadsheet is the point — the .ts dictionaries keep the compile-time missing-key
 * check, and the review happens somewhere a non-programmer can work.
 */
import { writeFileSync } from "node:fs";
import en from "../src/i18n/dictionaries/en";
import el from "../src/i18n/dictionaries/el";

type Nested = { [k: string]: string | Nested };

function flatten(obj: Nested, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.set(path, v);
    else for (const [ik, iv] of flatten(v, path)) out.set(ik, iv);
  }
  return out;
}

/** RFC 4180 quoting. Greek copy contains commas and the occasional quote; newlines appear
 * in multi-line hero headings, and all three have to survive a spreadsheet round trip. */
function cell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

const enFlat = flatten(en as unknown as Nested);
const elFlat = flatten(el as unknown as Nested);

const rows: string[] = ["Namespace,Key,English,Greek,Chars EN,Chars EL,Notes"];
let overflowRisk = 0;

for (const [key, enValue] of enFlat) {
  const elValue = elFlat.get(key) ?? "";
  const [namespace, ...rest] = key.split(".");

  // Greek runs longer than English almost everywhere, and the places that actually break
  // are the short ones — buttons, nav items, table headers, badges. Flagging the ratio here
  // means the layout pass has a list to check rather than a hunt.
  const notes: string[] = [];
  if (!elValue) notes.push("MISSING");
  else if (enValue.length <= 30 && elValue.length > enValue.length * 1.3) {
    notes.push("LONGER — check layout");
    overflowRisk++;
  }
  if (/\{[a-z]+\}/i.test(enValue)) {
    const enVars = (enValue.match(/\{[a-z]+\}/gi) ?? []).sort().join(",");
    const elVars = (elValue.match(/\{[a-z]+\}/gi) ?? []).sort().join(",");
    if (enVars !== elVars) notes.push(`PLACEHOLDER MISMATCH (en: ${enVars || "none"} / el: ${elVars || "none"})`);
  }

  rows.push(
    [
      cell(namespace),
      cell(rest.join(".")),
      cell(enValue),
      cell(elValue),
      String(enValue.length),
      String(elValue.length),
      cell(notes.join("; ")),
    ].join(","),
  );
}

// BOM: Excel on Windows opens a CSV as the system ANSI codepage without one and turns
// every Greek character into mojibake. This file is entirely Greek text.
const out = "﻿" + rows.join("\r\n") + "\r\n";
writeFileSync("greek-review.csv", out, "utf8");

console.log(`Wrote greek-review.csv — ${enFlat.size} keys.`);
console.log(`  missing Greek: ${[...enFlat.keys()].filter((k) => !elFlat.get(k)).length}`);
console.log(`  flagged for layout check: ${overflowRisk}`);
