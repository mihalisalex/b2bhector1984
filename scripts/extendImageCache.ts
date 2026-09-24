/**
 * Re-saves every existing image with a one-year Cache-Control, at the same path.
 *
 *   npx tsx scripts/extendImageCache.ts           # dry run: lists what would change
 *   npx tsx scripts/extendImageCache.ts --apply   # re-uploads
 *
 * WHY. Supabase served every photo with `max-age=3600`, so its CDN re-ran the resize for
 * each product image once an hour — about 0.7s on the first view after expiry. New uploads
 * now set a year (see ImageUploadForm); this brings the files uploaded before that change
 * into line.
 *
 * WHY A RE-UPLOAD. The header comes from metadata stored with the file at upload time.
 * Editing `storage.objects.metadata` in SQL changes the row but not what is served — tried
 * and reverted on 2026-09-24. Re-uploading the same bytes to the same path with `upsert`
 * is the supported way, and it keeps every URL identical.
 *
 * SAFE TO RE-RUN: files already at a year are skipped. A long cache is safe because every
 * upload path carries a fresh UUID, so a URL's content never changes.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const BUCKETS = ["style-images", "journal-images", "site-content"];
const ONE_YEAR = "31536000";
const apply = process.argv.includes("--apply");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function listAll(bucket: string, prefix = ""): Promise<{ path: string; cacheControl?: string; mimetype?: string }[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`);
  const out: { path: string; cacheControl?: string; mimetype?: string }[] = [];
  for (const entry of data ?? []) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) {
      out.push(...(await listAll(bucket, path))); // a folder
    } else {
      const meta = entry.metadata as { cacheControl?: string; mimetype?: string } | null;
      out.push({ path, cacheControl: meta?.cacheControl, mimetype: meta?.mimetype });
    }
  }
  return out;
}

async function main() {
  let changed = 0;
  let skipped = 0;
  for (const bucket of BUCKETS) {
    for (const file of await listAll(bucket)) {
      if (file.cacheControl?.includes(`max-age=${ONE_YEAR}`)) {
        skipped++;
        continue;
      }
      console.log(`${apply ? "updating" : "would update"} ${bucket}/${file.path} (${file.cacheControl ?? "no cache header"})`);
      changed++;
      if (!apply) continue;

      const { data: blob, error: downloadError } = await supabase.storage.from(bucket).download(file.path);
      if (downloadError || !blob) throw new Error(`download ${bucket}/${file.path}: ${downloadError?.message}`);
      const { error: uploadError } = await supabase.storage.from(bucket).upload(file.path, blob, {
        upsert: true,
        cacheControl: ONE_YEAR,
        contentType: file.mimetype ?? blob.type,
      });
      if (uploadError) throw new Error(`upload ${bucket}/${file.path}: ${uploadError.message}`);
    }
  }
  console.log(`\n${changed} file(s) ${apply ? "updated" : "to update"}, ${skipped} already at one year.`);
  if (!apply && changed > 0) console.log("Dry run — re-run with --apply to write.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
