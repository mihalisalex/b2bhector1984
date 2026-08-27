/**
 * Reads an edited greek-review.csv back into src/i18n/dictionaries/el.ts.
 *
 *   npx tsx scripts/applyGreekReview.ts [path/to/greek-review.csv]
 *
 * el.ts is regenerated wholesale rather than patched line by line — it is a plain nested
 * object literal with no comments of its own (checked), so regenerating from en.ts's
 * structure is deterministic and cannot corrupt formatting or escaping the way a
 * search-and-replace over a UTF-8 file can. The key order and nesting follow en.ts, which
 * is also what keeps the `Dictionary` type check meaningful.
 *
 * Refuses to write if the CSV is missing keys or has gained keys that en.ts doesn't have —
 * a truncated spreadsheet save silently dropping the last twenty rows must not silently
 * delete twenty Greek strings.
 */
import { readFileSync, writeFileSync } from "node:fs";
import en from "../src/i18n/dictionaries/en";

type Nested = { [k: string]: string | Nested };

function flattenKeys(obj: Nested, prefix = ""): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.push(path);
    else out.push(...flattenKeys(v, path));
  }
  return out;
}

/** RFC 4180 parser. Hand-rolled because the Greek copy legitimately contains commas,
 * doubled quotes and embedded newlines, and a naive split on "," mangles all three. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/^﻿/, "");

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f !== ""));
}

function setPath(target: Nested, path: string, value: string) {
  const parts = path.split(".");
  let node = target;
  for (const p of parts.slice(0, -1)) {
    if (typeof node[p] !== "object") node[p] = {};
    node = node[p] as Nested;
  }
  node[parts[parts.length - 1]] = value;
}

function serialize(obj: Nested, indent = 2): string {
  const pad = " ".repeat(indent);
  const lines: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    // Quote the key only when it isn't a plain identifier, matching how en.ts is written.
    const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
    if (typeof v === "string") lines.push(`${pad}${key}: ${JSON.stringify(v)},`);
    else lines.push(`${pad}${key}: {`, serialize(v, indent + 2), `${pad}},`);
  }
  return lines.join("\n");
}

const csvPath = process.argv[2] ?? "greek-review.csv";
const rows = parseCsv(readFileSync(csvPath, "utf8"));
const [header, ...body] = rows;

const iNamespace = header.indexOf("Namespace");
const iKey = header.indexOf("Key");
const iGreek = header.indexOf("Greek");
if (iNamespace < 0 || iKey < 0 || iGreek < 0) {
  throw new Error(`${csvPath}: expected Namespace, Key and Greek columns; got ${header.join(", ")}`);
}

const expected = new Set(flattenKeys(en as unknown as Nested));
const seen = new Set<string>();
const result: Nested = {};
const problems: string[] = [];

for (const [n, r] of body.entries()) {
  const path = r[iKey] ? `${r[iNamespace]}.${r[iKey]}` : r[iNamespace];
  const greek = r[iGreek] ?? "";
  if (!expected.has(path)) {
    problems.push(`row ${n + 2}: key "${path}" is not in en.ts`);
    continue;
  }
  if (!greek.trim()) {
    problems.push(`row ${n + 2}: "${path}" has no Greek text`);
    continue;
  }
  seen.add(path);
  setPath(result, path, greek);
}

for (const key of expected) if (!seen.has(key)) problems.push(`missing from CSV: "${key}"`);

if (problems.length) {
  console.error(`Refusing to write — ${problems.length} problem(s):\n`);
  for (const p of problems.slice(0, 40)) console.error(`  ${p}`);
  if (problems.length > 40) console.error(`  ... and ${problems.length - 40} more`);
  process.exit(1);
}

const file = `import type { Dictionary } from "@/i18n/dictionaries/en";

const el: Dictionary = {
${serialize(result)}
};

export default el;
`;

writeFileSync("src/i18n/dictionaries/el.ts", file, "utf8");
console.log(`Wrote src/i18n/dictionaries/el.ts — ${seen.size} keys.`);
console.log("Now run: npm run typecheck");
