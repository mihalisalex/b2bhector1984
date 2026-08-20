/**
 * Imports the owner-supplied Greek product copy markdown into the `_el` columns.
 *
 *   npx tsx scripts/importGreekProductCopy.ts <file.md>            # dry run, prints the table
 *   npx tsx scripts/importGreekProductCopy.ts <file.md> --write    # actually writes
 *
 * Dry run by default. This is final human-authored copy going into a live catalogue: the
 * default has to be the one that cannot damage anything.
 *
 * The copy is imported VERBATIM. Nothing here rewrites, normalises, spellchecks or
 * "improves" the Greek — the only transformation applied is wrapping description paragraphs
 * in <p> tags, because `styles.description` is HTML rendered through dangerouslySetInnerHTML
 * and the existing English rows are stored that way. Blank-line paragraph separation in the
 * source maps one-to-one onto those <p> blocks, so the breaks survive exactly.
 */
import { readFileSync } from "node:fs";
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

interface ProductCopy {
  slug: string;
  taglineEl?: string;
  descriptionEl?: string;
  featuresEl?: string[];
  materialsEl?: string[];
  lastNoteEl?: string;
  metaTitleEl?: string;
  metaDescriptionEl?: string;
}

const FIELD_LABELS = [
  "tagline_el",
  "description_el",
  "features_el",
  "materials_el",
  "last_note_el",
  "meta_title_el",
  "meta_description_el",
] as const;

/**
 * Splits the markdown into per-slug blocks and pulls each labelled field out.
 *
 * Deliberately driven off the exact `**field_el**` labels and the `## \`slug\`` headings the
 * file actually uses, rather than a general markdown parse — a loose parser silently
 * absorbing an unexpected heading into the previous product's description is precisely the
 * failure that would be invisible until a customer read it.
 */
function parse(md: string): ProductCopy[] {
  const lines = md.split(/\r?\n/);
  const products: ProductCopy[] = [];
  let current: ProductCopy | null = null;
  let field: (typeof FIELD_LABELS)[number] | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!current || !field) return;
    const text = buffer.join("\n").trim();
    if (text) {
      if (field === "tagline_el") current.taglineEl = text;
      else if (field === "description_el") current.descriptionEl = text;
      else if (field === "last_note_el") current.lastNoteEl = text;
      else if (field === "features_el") current.featuresEl = toList(text);
      else if (field === "materials_el") current.materialsEl = toList(text);
    }
    buffer = [];
    field = null;
  };

  for (const line of lines) {
    const heading = line.match(/^##\s+`([^`]+)`/);
    if (heading) {
      flush();
      current = { slug: heading[1] };
      products.push(current);
      continue;
    }

    // The two meta fields are written inline on one line: `**meta_title_el** · value`
    const inlineMeta = line.match(/^\*\*(meta_title_el|meta_description_el)\*\*\s*·\s*(.+)$/);
    if (inlineMeta && current) {
      flush();
      if (inlineMeta[1] === "meta_title_el") current.metaTitleEl = inlineMeta[2].trim();
      else current.metaDescriptionEl = inlineMeta[2].trim();
      continue;
    }

    const label = line.match(/^\*\*([a-z_]+)\*\*\s*$/);
    if (label && (FIELD_LABELS as readonly string[]).includes(label[1])) {
      flush();
      field = label[1] as (typeof FIELD_LABELS)[number];
      continue;
    }

    // A top-level heading or a horizontal rule ends whatever field was being collected.
    if (/^#\s/.test(line) || /^---\s*$/.test(line)) {
      flush();
      continue;
    }

    if (field) buffer.push(line);
  }
  flush();

  return products.filter((p) => p.slug);
}

/** "- item" bullet lines to an array, preserving order and the text verbatim. */
function toList(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean);
}

/**
 * Blank-line-separated paragraphs to <p> blocks.
 *
 * Escapes &, < and > first. The copy contains no HTML and is not expected to, so any angle
 * bracket in it is literal text — passing it through raw would let a stray character become
 * markup. Em dashes, accents and every other non-ASCII character are left untouched.
 */
function toHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim().replace(/\n/g, " "))
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("");
}

function tick(v: unknown): string {
  if (Array.isArray(v)) return v.length ? "✓" : "·";
  return typeof v === "string" && v.trim() ? "✓" : "·";
}

async function main() {
  const path = process.argv[2];
  const write = process.argv.includes("--write");
  if (!path) {
    console.error("usage: npx tsx scripts/importGreekProductCopy.ts <file.md> [--write]");
    process.exit(1);
  }

  const products = parse(readFileSync(path, "utf8"));
  console.log(`Parsed ${products.length} product blocks from ${path}\n`);

  const { data: rows, error } = await db.from("styles").select("id, slug, name");
  if (error) throw new Error(error.message);
  const bySlug = new Map((rows ?? []).map((r) => [r.slug, r]));

  const unmatched: string[] = [];
  const matched: { copy: ProductCopy; id: string; name: string }[] = [];
  for (const p of products) {
    const row = bySlug.get(p.slug);
    if (!row) unmatched.push(p.slug);
    else matched.push({ copy: p, id: row.id, name: row.name });
  }
  const untouched = (rows ?? []).filter((r) => !products.some((p) => p.slug === r.slug));

  if (write) {
    for (const { copy, id } of matched) {
      const { error: upErr } = await db
        .from("styles")
        .update({
          tagline_el: copy.taglineEl ?? null,
          description_el: copy.descriptionEl ? toHtml(copy.descriptionEl) : null,
          features_el: copy.featuresEl ?? null,
          materials_el: copy.materialsEl ?? null,
          last_note_el: copy.lastNoteEl ?? null,
        })
        .eq("id", id);
      if (upErr) throw new Error(`${copy.slug}: ${upErr.message}`);

      // Per-locale SEO goes to seo_entity_meta keyed by the style's id, per 0038 — NOT to
      // the styles table, which holds only the English values.
      if (copy.metaTitleEl || copy.metaDescriptionEl) {
        const { error: seoErr } = await db.from("seo_entity_meta").upsert(
          {
            entity_type: "style",
            entity_key: id,
            locale: "el",
            seo_title: copy.metaTitleEl ?? null,
            meta_description: copy.metaDescriptionEl ?? null,
            robots: "index,follow",
            twitter_card: "summary_large_image",
            secondary_keywords: [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: "entity_type,entity_key,locale" },
        );
        if (seoErr) throw new Error(`${copy.slug} seo: ${seoErr.message}`);
      }
    }
  }

  const header = ["tagline", "descr", "featur", "materi", "lastNt", "mTitle", "mDesc"];
  console.log(`${"SLUG".padEnd(38)} ${header.join("  ")}`);
  console.log("-".repeat(38 + header.join("  ").length + 1));
  for (const { copy } of matched) {
    const marks = [
      tick(copy.taglineEl),
      tick(copy.descriptionEl),
      tick(copy.featuresEl),
      tick(copy.materialsEl),
      tick(copy.lastNoteEl),
      tick(copy.metaTitleEl),
      tick(copy.metaDescriptionEl),
    ];
    console.log(`${copy.slug.padEnd(38)} ${marks.map((m, i) => m.padEnd(header[i].length)).join("  ")}`);
  }

  console.log(`\nmatched: ${matched.length}   parsed: ${products.length}   db rows: ${rows?.length ?? 0}`);
  console.log(`slugs in file with no database row: ${unmatched.length ? unmatched.join(", ") : "none"}`);
  console.log(`database rows with no Greek copy:   ${untouched.length ? untouched.map((r) => r.slug).join(", ") : "none"}`);

  const incomplete = matched.filter(
    ({ copy }) =>
      !copy.taglineEl || !copy.descriptionEl || !copy.featuresEl?.length || !copy.materialsEl?.length ||
      !copy.lastNoteEl || !copy.metaTitleEl || !copy.metaDescriptionEl,
  );
  console.log(`products missing at least one field: ${incomplete.length ? incomplete.map((m) => m.copy.slug).join(", ") : "none"}`);
  console.log(write ? "\nWRITTEN." : "\nDRY RUN — nothing written. Re-run with --write.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
